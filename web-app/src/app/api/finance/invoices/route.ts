import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to generate invoice number (e.g. INV-2026-0001)
async function generateInvoiceNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: { createdAt: 'desc' },
    select: { invoiceNumber: true },
  });

  if (!lastInvoice) {
    return `${prefix}0001`;
  }

  const parts = lastInvoice.invoiceNumber.split('-');
  const lastSeq = parseInt(parts[2], 10);
  const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

// GET /api/finance/invoices
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const search = searchParams.get('search');

    if (id) {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          client: true,
          items: true,
        },
      });

      if (!invoice) {
        return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
      }

      // Fetch global settings for company GST / Bank info
      const settings = await prisma.globalSettings.findUnique({ where: { id: 'default' } });

      return NextResponse.json({ success: true, data: { ...invoice, companySettings: settings } });
    }

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status.toUpperCase();
    }
    if (clientId) {
      where.clientId = clientId;
    }
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { client: { companyName: { contains: search, mode: 'insensitive' } } },
        { client: { contactPerson: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: {
          select: { id: true, clientId: true, companyName: true, contactPerson: true, phone: true, email: true },
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute summary metrics
    const allInvoices = await prisma.invoice.findMany();
    const totalBilled = allInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalReceived = allInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    const outstanding = Math.max(0, totalBilled - totalReceived);
    const paidCount = allInvoices.filter(i => i.status === 'PAID').length;
    const pendingCount = allInvoices.filter(i => i.status === 'SENT' || i.status === 'DRAFT' || i.status === 'PARTIAL').length;

    return NextResponse.json({
      success: true,
      data: invoices,
      summary: {
        totalBilled,
        totalReceived,
        outstanding,
        paidCount,
        pendingCount,
        totalCount: allInvoices.length,
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/finance/invoices
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      clientId,
      issueDate,
      dueDate,
      items,
      taxRate = 18,
      discountAmount = 0,
      notes,
      termsAndConditions,
      status = 'DRAFT',
    } = body;

    if (!clientId) {
      return NextResponse.json({ success: false, error: 'Client is required' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'At least one line item is required' }, { status: 400 });
    }

    // Calculate item totals & subtotal
    const processedItems = items.map((it: any) => {
      const qty = parseFloat(it.quantity) || 1;
      const rate = parseFloat(it.unitPrice) || 0;
      const amount = qty * rate;
      return {
        description: it.description || 'Creative Post-Production Service',
        quantity: qty,
        unit: it.unit || 'units',
        unitPrice: rate,
        amount,
        editingJobId: it.editingJobId || null,
      };
    });

    const subtotal = processedItems.reduce((acc: number, curr: any) => acc + curr.amount, 0);
    const discount = parseFloat(discountAmount) || 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const rateOfTax = parseFloat(taxRate) || 0;
    const taxAmount = (taxableAmount * rateOfTax) / 100;
    const totalAmount = taxableAmount + taxAmount;

    const invoiceNumber = await generateInvoiceNumber();
    const today = new Date().toISOString().split('T')[0];
    const defaultDue = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        issueDate: issueDate || today,
        dueDate: dueDate || defaultDue,
        status: status || 'DRAFT',
        currency: 'INR',
        subtotal,
        discountAmount: discount,
        taxRate: rateOfTax,
        taxAmount,
        totalAmount,
        amountPaid: 0,
        notes: notes || 'Thank you for your business!',
        termsAndConditions: termsAndConditions || 'Payment is due within 15 days of invoice date. All payments in INR (₹). GST applicable as per Indian Tax Norms.',
        items: {
          create: processedItems,
        },
      },
      include: {
        client: true,
        items: true,
      },
    });

    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ success: false, error: 'Failed to create invoice' }, { status: 500 });
  }
}

// PATCH /api/finance/invoices
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, amountPaid, paymentDate, paymentMethod, paymentReference, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Invoice ID is required' }, { status: 400 });
    }

    const currentInvoice = await prisma.invoice.findUnique({ where: { id } });
    if (!currentInvoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Record Payment
    if (amountPaid !== undefined) {
      const newPaid = parseFloat(amountPaid) || 0;
      updateData.amountPaid = newPaid;
      updateData.paymentDate = paymentDate || new Date().toISOString().split('T')[0];
      if (paymentMethod) updateData.paymentMethod = paymentMethod;
      if (paymentReference) updateData.paymentReference = paymentReference;

      if (newPaid >= currentInvoice.totalAmount) {
        updateData.status = 'PAID';
      } else if (newPaid > 0 && newPaid < currentInvoice.totalAmount) {
        updateData.status = 'PARTIAL';
      }
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        items: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ success: false, error: 'Failed to update invoice' }, { status: 500 });
  }
}

// DELETE /api/finance/invoices?id=...
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Invoice ID is required' }, { status: 400 });
    }

    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete invoice' }, { status: 500 });
  }
}
