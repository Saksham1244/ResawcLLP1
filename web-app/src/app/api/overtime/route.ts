import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/overtime - list overtime requests with monthly aggregations
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const month = searchParams.get('month') || new Date().toISOString().substring(0, 7); // YYYY-MM
    const status = searchParams.get('status');

    const isAdmin = role?.toUpperCase() === 'ADMIN';

    const whereClause: any = {};

    // If not admin, only view own requests
    if (!isAdmin && userId) {
      whereClause.userId = userId;
    } else if (userId && userId !== 'all') {
      whereClause.userId = userId;
    }

    if (month) {
      whereClause.date = { startsWith: month };
    }

    if (status && status !== 'ALL') {
      whereClause.status = status.toUpperCase();
    }

    const requests = await prisma.overtimeRequest.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Compute monthly summary
    let totalApprovedHours = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    requests.forEach((r) => {
      if (r.status === 'APPROVED') {
        totalApprovedHours += r.approvedHours ?? r.hours;
        approvedCount++;
      } else if (r.status === 'PENDING') {
        pendingCount++;
      } else if (r.status === 'REJECTED') {
        rejectedCount++;
      }
    });

    return NextResponse.json({
      success: true,
      data: requests,
      summary: {
        month,
        totalApprovedHours: Math.round(totalApprovedHours * 10) / 10,
        pendingCount,
        approvedCount,
        rejectedCount,
        totalRequests: requests.length,
      },
    });
  } catch (error) {
    console.error('Overtime GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/overtime - submit an overtime request
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, date, hours, taskOrJobTitle, reason } = body;

    if (!userId || !date || !hours || !taskOrJobTitle || !reason) {
      return NextResponse.json(
        { success: false, error: 'Please provide date, hours, project/job worked on, and reason.' },
        { status: 400 }
      );
    }

    const numHours = parseFloat(hours);
    if (isNaN(numHours) || numHours <= 0 || numHours > 16) {
      return NextResponse.json(
        { success: false, error: 'Please enter valid overtime hours (e.g., between 0.5 and 16 hours).' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const record = await prisma.overtimeRequest.create({
      data: {
        userId,
        date,
        hours: numHours,
        taskOrJobTitle: taskOrJobTitle.trim(),
        reason: reason.trim(),
        status: 'PENDING',
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    // Notify admins
    try {
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'admin'] } },
      });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            text: `⏱ ${user.name} requested ${numHours}h overtime for ${date} (${taskOrJobTitle}).`,
          },
        });
      }
    } catch (notifErr) {
      console.warn('Notification error:', notifErr);
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('Overtime POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/overtime - approve or reject overtime request (admin)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { requestId, status, approvedHours, adminNotes, adminId } = body;

    if (!requestId || !status) {
      return NextResponse.json({ success: false, error: 'Missing requestId or status.' }, { status: 400 });
    }

    const validStatus = status.toUpperCase();
    if (!['APPROVED', 'REJECTED'].includes(validStatus)) {
      return NextResponse.json({ success: false, error: 'Invalid status. Must be APPROVED or REJECTED.' }, { status: 400 });
    }

    const existing = await prisma.overtimeRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Overtime request not found.' }, { status: 404 });
    }

    const finalHours =
      validStatus === 'APPROVED'
        ? approvedHours !== undefined && approvedHours !== null
          ? parseFloat(approvedHours)
          : existing.hours
        : 0;

    const updated = await prisma.overtimeRequest.update({
      where: { id: requestId },
      data: {
        status: validStatus,
        approvedHours: validStatus === 'APPROVED' ? finalHours : null,
        adminNotes: adminNotes || null,
        reviewedById: adminId || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // Notify employee of review outcome
    try {
      await prisma.notification.create({
        data: {
          userId: existing.userId,
          text:
            validStatus === 'APPROVED'
              ? `✅ Your overtime request of ${finalHours}h for ${existing.date} was approved.`
              : `❌ Your overtime request for ${existing.date} was rejected.${adminNotes ? ` Note: ${adminNotes}` : ''}`,
        },
      });
    } catch (notifErr) {
      console.warn('Notification error:', notifErr);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Overtime PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
