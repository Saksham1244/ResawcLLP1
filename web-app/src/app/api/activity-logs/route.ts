import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/activity-logs
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const clientId = searchParams.get('clientId');
    const entityType = searchParams.get('entityType');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {};
    if (userId) where.userId = userId;
    if (clientId) where.clientId = clientId;
    if (entityType) where.entityType = entityType;
    if (category && category !== 'ALL') where.category = category;
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { entityTitle: { contains: search, mode: 'insensitive' } },
        { userName: { contains: search, mode: 'insensitive' } },
      ];
    }

    let logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, role: true, email: true } },
        client: { select: { id: true, companyName: true, clientId: true } },
      },
    });

    // If activity logs table has few records, dynamically synthesize timeline from existing records
    if (logs.length < 15 && !search && (!category || category === 'ALL')) {
      const synthesized: any[] = [];

      // 1. Invoices
      const invoices = await prisma.invoice.findMany({
        where: clientId ? { clientId } : {},
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { client: { select: { id: true, companyName: true, clientId: true } } },
      });
      for (const inv of invoices) {
        synthesized.push({
          id: `syn-inv-${inv.id}`,
          action: inv.status === 'PAID' ? 'PAYMENT_RECEIVED' : 'INVOICE_GENERATED',
          category: 'FINANCE',
          entityType: 'INVOICE',
          entityId: inv.id,
          entityTitle: inv.invoiceNumber,
          clientId: inv.clientId,
          client: inv.client,
          description: inv.status === 'PAID'
            ? `Payment of ₹${inv.amountPaid.toLocaleString('en-IN')} received for invoice ${inv.invoiceNumber} (${inv.client?.companyName})`
            : `Invoice ${inv.invoiceNumber} generated for ${inv.client?.companyName} totaling ₹${inv.totalAmount.toLocaleString('en-IN')}`,
          createdAt: inv.updatedAt || inv.createdAt,
          userName: 'Finance Team',
          userRole: 'ADMIN',
        });
      }

      // 2. Editing Jobs
      const jobs = await prisma.editingJob.findMany({
        where: clientId ? { clientId } : {},
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, companyName: true, clientId: true } },
          assignedEditor: { select: { id: true, name: true, role: true } },
        },
      });
      for (const j of jobs) {
        synthesized.push({
          id: `syn-job-${j.id}`,
          action: j.status === 'DELIVERED' ? 'JOB_DELIVERED' : 'JOB_CREATED',
          category: 'PROJECTS',
          entityType: 'JOB',
          entityId: j.id,
          entityTitle: j.jobNumber,
          clientId: j.clientId,
          client: j.client,
          description: j.status === 'DELIVERED'
            ? `Editing Job ${j.jobNumber} ("${j.title}") was successfully delivered to ${j.client?.companyName}`
            : `New editing job ${j.jobNumber} ("${j.title}") created for ${j.client?.companyName} (${j.totalImages} images)`,
          createdAt: j.updatedAt || j.createdAt,
          userName: j.assignedEditor?.name || 'Production Coordinator',
          userRole: j.assignedEditor?.role || 'EDITOR',
        });
      }

      // 3. Leads
      if (!clientId) {
        const leads = await prisma.lead.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
        });
        for (const l of leads) {
          synthesized.push({
            id: `syn-lead-${l.id}`,
            action: l.status === 'CONVERTED' ? 'LEAD_CONVERTED' : 'LEAD_CREATED',
            category: 'MARKETING',
            entityType: 'LEAD',
            entityId: l.id,
            entityTitle: l.name,
            description: l.status === 'CONVERTED'
              ? `Lead "${l.name}" (${l.company || 'Photography'}) was converted to active client!`
              : `New inquiry / lead added: "${l.name}" from ${l.company || 'Studio'}`,
            createdAt: l.updatedAt || l.createdAt,
            userName: 'Marketing Team',
            userRole: 'MARKETING',
          });
        }
      }

      // 4. Payslips
      if (!clientId) {
        const payslips = await prisma.payslip.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, role: true } } },
        });
        for (const p of payslips) {
          synthesized.push({
            id: `syn-pay-${p.id}`,
            action: 'PAYROLL_GENERATED',
            category: 'HR',
            entityType: 'PAYSLIP',
            entityId: p.id,
            entityTitle: p.payslipNumber,
            description: `Generated ${p.monthYear} Payslip ${p.payslipNumber} for ${p.user.name} (Net: ₹${p.netSalary.toLocaleString('en-IN')})`,
            createdAt: p.createdAt,
            userName: 'HR / Payroll',
            userRole: 'ADMIN',
          });
        }
      }

      // Merge existing with synthesized without duplicate IDs
      const existingIds = new Set(logs.map(l => l.id));
      const newItems = synthesized.filter(s => !existingIds.has(s.id));
      logs = [...logs, ...newItems].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}

// POST /api/activity-logs (Manual Log / Milestone note)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      userName,
      userRole,
      action = 'NOTE_ADDED',
      category = 'GENERAL',
      entityType,
      entityId,
      entityTitle,
      clientId,
      description,
      metadata,
    } = body;

    if (!description) {
      return NextResponse.json({ success: false, error: 'Description is required' }, { status: 400 });
    }

    const log = await prisma.activityLog.create({
      data: {
        userId,
        userName,
        userRole,
        action,
        category,
        entityType,
        entityId,
        entityTitle,
        clientId,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    console.error('Error creating activity log:', error);
    return NextResponse.json({ success: false, error: 'Failed to create activity log' }, { status: 500 });
  }
}
