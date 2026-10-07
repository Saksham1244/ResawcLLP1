import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const client = await prisma.client.findFirst({
      where: {
        OR: [
          { id },
          { clientId: id },
        ],
      },
      include: {
        assignedMarketing: {
          select: { id: true, name: true, email: true, role: true },
        },
        rateCard: true,
        editingJobs: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedEditor: { select: { id: true, name: true, role: true } },
            qcReviewer: { select: { id: true, name: true, role: true } },
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
          },
        },
        followUps: {
          orderBy: { dueDate: 'desc' },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
      },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    // Calculate 360° Rollup KPIs
    const totalBilled = client.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = client.invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const outstanding = Math.max(0, totalBilled - totalPaid);

    const jobsCompleted = client.editingJobs.filter(j => j.status === 'DELIVERED').length;
    const jobsActive = client.editingJobs.filter(j => j.status !== 'DELIVERED').length;
    const totalPhotosEdited = client.editingJobs.reduce((sum, j) => sum + (j.completedImages || 0), 0);
    const totalVideoMins = client.editingJobs.reduce((sum, j) => sum + (j.durationMinutes || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        ...client,
        kpis: {
          totalBilled,
          totalPaid,
          outstanding,
          totalJobs: client.editingJobs.length,
          jobsCompleted,
          jobsActive,
          totalPhotosEdited,
          totalVideoMins,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching client 360 profile:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch client profile' }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const updated = await prisma.client.update({
      where: { id },
      data: body,
      include: {
        rateCard: true,
        assignedMarketing: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ success: false, error: 'Failed to update client' }, { status: 500 });
  }
}
