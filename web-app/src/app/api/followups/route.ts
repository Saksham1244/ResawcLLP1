import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/followups
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const todayOnly = searchParams.get('todayOnly') === 'true';

    const todayStr = new Date().toISOString().split('T')[0];

    const where: any = {};
    if (userId) where.assignedToId = userId;
    if (status && status !== 'ALL') where.status = status.toUpperCase();
    if (todayOnly) where.dueDate = todayStr;

    const followUps = await prisma.marketingFollowUp.findMany({
      where,
      include: {
        lead: { select: { id: true, name: true, company: true, phone: true, email: true } },
        client: { select: { id: true, clientId: true, companyName: true, contactPerson: true, phone: true } },
        assignedTo: { select: { id: true, name: true, role: true } },
      },
      orderBy: [
        { dueDate: 'asc' },
        { dueTime: 'asc' },
      ],
    });

    const pendingCount = followUps.filter(f => f.status === 'PENDING').length;
    const completedCount = followUps.filter(f => f.status === 'COMPLETED').length;

    return NextResponse.json({
      success: true,
      data: followUps,
      pendingCount,
      completedCount,
    });
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/followups
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      leadId,
      clientId,
      assignedToId,
      title,
      actionType,
      dueDate,
      dueTime,
      priority,
    } = body;

    if (!title || !assignedToId || !dueDate) {
      return NextResponse.json(
        { success: false, error: 'Title, Assigned Employee, and Due Date are required' },
        { status: 400 }
      );
    }

    const followUp = await prisma.marketingFollowUp.create({
      data: {
        title,
        actionType: (actionType || 'CALL').toUpperCase(),
        dueDate,
        dueTime: dueTime || '11:00 AM',
        priority: (priority || 'MEDIUM').toUpperCase(),
        assignedToId,
        leadId: leadId || null,
        clientId: clientId || null,
        status: 'PENDING',
      },
      include: {
        lead: true,
        client: true,
        assignedTo: true,
      },
    });

    return NextResponse.json({ success: true, data: followUp });
  } catch (error) {
    console.error('Error creating follow-up:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/followups
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, outcomeNotes, nextFollowUp } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Follow-up ID is required' }, { status: 400 });
    }

    const updated = await prisma.marketingFollowUp.update({
      where: { id },
      data: {
        status: status ? status.toUpperCase() : 'COMPLETED',
        outcomeNotes: outcomeNotes || null,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });

    // If marketing employee also wants to schedule the next follow-up in the same action:
    let nextCreated = null;
    if (nextFollowUp && nextFollowUp.dueDate && nextFollowUp.title) {
      nextCreated = await prisma.marketingFollowUp.create({
        data: {
          title: nextFollowUp.title,
          actionType: (nextFollowUp.actionType || 'CALL').toUpperCase(),
          dueDate: nextFollowUp.dueDate,
          dueTime: nextFollowUp.dueTime || '11:00 AM',
          priority: nextFollowUp.priority || 'MEDIUM',
          assignedToId: updated.assignedToId,
          leadId: updated.leadId,
          clientId: updated.clientId,
          status: 'PENDING',
        },
      });
    }

    return NextResponse.json({ success: true, data: updated, nextFollowUp: nextCreated });
  } catch (error) {
    console.error('Error updating follow-up:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/followups
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Follow-up ID required' }, { status: 400 });
    }

    await prisma.marketingFollowUp.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Follow-up deleted' });
  } catch (error) {
    console.error('Error deleting follow-up:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
