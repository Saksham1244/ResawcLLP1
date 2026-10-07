import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Leave categories and annual quotas (in days)
export const LEAVE_QUOTAS = {
  CASUAL: 12,
  SICK: 12,
  PAID: 15,
  WFH: 12,
};

function getDaysBetween(startStr: string, endStr: string): number {
  try {
    const s = new Date(startStr);
    const e = new Date(endStr);
    const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  } catch {
    return 1;
  }
}

function getDatesInRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  try {
    const curr = new Date(startStr);
    const end = new Date(endStr);
    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
  } catch {
    dates.push(startStr);
  }
  return dates;
}

// GET /api/leaves - fetch leave requests with accurate balance computations
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const status = searchParams.get('status');

    const isAdmin = role?.toUpperCase() === 'ADMIN';

    let userFilter: any = {};
    if (!isAdmin && userId) {
      userFilter = { id: userId };
    } else if (userId && userId !== 'all') {
      userFilter = { id: userId };
    } else {
      // Exclude admins from employee leave lists
      userFilter = { role: { notIn: ['ADMIN', 'admin'] } };
    }

    const users = await prisma.user.findMany({
      where: userFilter,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        leaveRequests: {
          where: {
            startDate: { startsWith: year },
            ...(status && status !== 'ALL' ? { status } : {}),
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const results = users.map((u) => {
      let usedCL = 0;
      let usedSL = 0;
      let usedPL = 0;
      let usedWFH = 0;
      let usedUnpaid = 0;
      let usedHalfDay = 0;

      u.leaveRequests.forEach((req) => {
        if (req.status === 'Approved') {
          const days = getDaysBetween(req.startDate, req.endDate);
          const t = req.type.toLowerCase();

          if (t.includes('casual') || t === 'cl') {
            usedCL += days;
          } else if (t.includes('sick') || t === 'sl') {
            usedSL += days;
          } else if (t.includes('paid') || t === 'pl') {
            usedPL += days;
          } else if (t.includes('wfh') || t.includes('work from home')) {
            usedWFH += days;
          } else if (t.includes('half day')) {
            usedHalfDay += days * 0.5;
            usedCL += days * 0.5;
          } else if (t.includes('unpaid') || t.includes('lwp')) {
            usedUnpaid += days;
          } else {
            usedCL += days;
          }
        }
      });

      const totalApprovedDays = usedCL + usedSL + usedPL + usedWFH + usedUnpaid;

      return {
        user: { id: u.id, name: u.name, email: u.email, role: u.role },
        requests: u.leaveRequests,
        balances: {
          year,
          quotas: LEAVE_QUOTAS,
          used: {
            casual: usedCL,
            sick: usedSL,
            paid: usedPL,
            wfh: usedWFH,
            unpaid: usedUnpaid,
            halfDay: usedHalfDay,
            totalDays: totalApprovedDays,
          },
          remaining: {
            casual: Math.max(0, LEAVE_QUOTAS.CASUAL - usedCL),
            sick: Math.max(0, LEAVE_QUOTAS.SICK - usedSL),
            paid: Math.max(0, LEAVE_QUOTAS.PAID - usedPL),
            wfh: Math.max(0, LEAVE_QUOTAS.WFH - usedWFH),
          },
        },
      };
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Leave GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/leaves - submit a new leave request
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, startDate, endDate, type, reason } = body;

    if (!userId || !startDate || !endDate || !type || !reason) {
      return NextResponse.json(
        { success: false, error: 'All fields (Start Date, End Date, Type, Reason) are required.' },
        { status: 400 }
      );
    }

    if (new Date(endDate) < new Date(startDate)) {
      return NextResponse.json(
        { success: false, error: 'End date cannot be earlier than start date.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        userId,
        startDate,
        endDate,
        type,
        reason: reason.trim(),
        status: 'Pending',
      },
    });

    // Notify all admins of the new leave request
    try {
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'admin'] } },
      });
      const daysCount = getDaysBetween(startDate, endDate);
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            text: `🌴 ${user.name} applied for ${type} (${daysCount} day${daysCount > 1 ? 's' : ''}: ${startDate} to ${endDate}).`,
          },
        });
      }
    } catch (notifErr) {
      console.warn('Notification error:', notifErr);
    }

    return NextResponse.json({ success: true, data: leave });
  } catch (error) {
    console.error('Leave POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/leaves - approve or reject leave request (admin)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { leaveId, status, adminNotes, adminId } = body;

    if (!leaveId || !status) {
      return NextResponse.json({ success: false, error: 'Missing leaveId or status' }, { status: 400 });
    }

    const validStatus = status === 'Approved' ? 'Approved' : status === 'Rejected' ? 'Rejected' : status;

    const existing = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Leave request not found' }, { status: 404 });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: validStatus,
        adminNotes: adminNotes || null,
        reviewedBy: adminId || null,
      },
    });

    // If Approved, sync with Attendance table
    if (validStatus === 'Approved') {
      const dates = getDatesInRange(existing.startDate, existing.endDate);
      const isWFH = existing.type.toLowerCase().includes('wfh');
      const isHalfDay = existing.type.toLowerCase().includes('half day');
      const attStatus = isWFH ? 'WFH' : isHalfDay ? 'Half Day' : 'On Leave';

      for (const d of dates) {
        const attRecord = await prisma.attendance.findFirst({
          where: { userId: existing.userId, date: d },
        });

        if (attRecord) {
          await prisma.attendance.update({
            where: { id: attRecord.id },
            data: {
              status: attStatus,
              notes: `${existing.type} (Approved)`,
            },
          });
        } else {
          await prisma.attendance.create({
            data: {
              userId: existing.userId,
              date: d,
              timeIn: isWFH ? '10:00 AM' : '--',
              timeOut: isWFH ? '06:30 PM' : '--',
              status: attStatus,
              notes: `${existing.type} (Approved)`,
            },
          });
        }
      }
    }

    // Send notification to employee
    try {
      await prisma.notification.create({
        data: {
          userId: existing.userId,
          text:
            validStatus === 'Approved'
              ? `✅ Your leave request (${existing.type}: ${existing.startDate} to ${existing.endDate}) has been APPROVED.`
              : `❌ Your leave request (${existing.type}: ${existing.startDate} to ${existing.endDate}) was REJECTED.${adminNotes ? ` Reason: ${adminNotes}` : ''}`,
        },
      });
    } catch (notifErr) {
      console.warn('Notification error:', notifErr);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Leave PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
