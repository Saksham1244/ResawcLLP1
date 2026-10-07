import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to generate next client ID (e.g. CL-1001)
async function generateClientId(): Promise<string> {
  const lastClient = await prisma.client.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { clientId: true },
  });

  if (!lastClient || !lastClient.clientId.startsWith('CL-')) {
    return 'CL-1001';
  }

  const numPart = parseInt(lastClient.clientId.replace('CL-', ''), 10);
  if (isNaN(numPart)) return 'CL-1001';
  return `CL-${numPart + 1}`;
}

// GET /api/clients
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (id) {
      const client = await prisma.client.findUnique({
        where: { id },
        include: {
          assignedMarketing: { select: { id: true, name: true, email: true, role: true } },
          editingJobs: {
            include: {
              assignedEditor: { select: { id: true, name: true, role: true } },
              qcReviewer: { select: { id: true, name: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!client) {
        return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: client });
    }

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status.toUpperCase();
    }
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { clientId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      include: {
        assignedMarketing: { select: { id: true, name: true, email: true } },
        _count: {
          select: { editingJobs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/clients
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      companyName,
      contactPerson,
      phone,
      email,
      address,
      country,
      currency,
      paymentTerms,
      status,
      notes,
      assignedMarketingId,
      fromLeadId,
    } = body;

    if (!companyName || !contactPerson) {
      return NextResponse.json(
        { success: false, error: 'Company Name and Contact Person are required' },
        { status: 400 }
      );
    }

    const nextId = await generateClientId();

    const client = await prisma.client.create({
      data: {
        clientId: nextId,
        companyName,
        contactPerson,
        phone: phone || null,
        email: email || null,
        address: address || null,
        country: country || 'India',
        currency: currency || 'INR',
        paymentTerms: paymentTerms || 'Due on Receipt',
        status: status ? status.toUpperCase() : 'ACTIVE',
        notes: notes || null,
        assignedMarketingId: assignedMarketingId || null,
      },
    });

    // If converted from a lead, mark the lead as CONVERTED
    if (fromLeadId) {
      try {
        await prisma.lead.update({
          where: { id: fromLeadId },
          data: { status: 'CONVERTED' },
        });
      } catch (e) {
        console.warn('Could not update lead status on conversion:', e);
      }
    }

    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/clients
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Client ID is required' }, { status: 400 });
    }

    if (updateData.status) {
      updateData.status = updateData.status.toUpperCase();
    }

    const updated = await prisma.client.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/clients
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Client ID is required' }, { status: 400 });
    }

    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
