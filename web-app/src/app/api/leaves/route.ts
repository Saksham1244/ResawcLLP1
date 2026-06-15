import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    let usersQuery = {};
    if (userId) {
      usersQuery = { id: userId };
    }

    const users = await prisma.user.findMany({
      where: usersQuery,
      include: {
        leaveRequests: {
          where: {
            startDate: { startsWith: year }
          }
        },
        attendance: {
          where: {
            date: { startsWith: year },
            status: 'Absent'
          }
        }
      }
    });

    const results = users.map(user => {
      let approvedFullLeaves = 0;
      let approvedShortLeaves = 0;

      user.leaveRequests.forEach(req => {
        if (req.status === 'Approved') {
          // Calculate duration in days (inclusive)
          const start = new Date(req.startDate);
          const end = new Date(req.endDate);
          const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

          if (req.type === 'Full Day') approvedFullLeaves += days;
          else if (req.type === 'Half Day') approvedFullLeaves += (days * 0.5);
          else if (req.type.includes('Short Leave')) approvedShortLeaves += days;
        }
      });

      // Calculate unapproved absences for penalty
      let unapprovedAbsences = 0;
      user.attendance.forEach(att => {
        const attDateStr = att.date;
        const attDateObj = new Date(attDateStr);
        // check if covered by ANY approved leave
        const isCovered = user.leaveRequests.some(req => {
           if (req.status !== 'Approved') return false;
           const s = new Date(req.startDate);
           const e = new Date(req.endDate);
           return attDateObj >= s && attDateObj <= e;
        });

        if (!isCovered) {
          unapprovedAbsences += 1;
        }
      });

      const penaltyDeductions = unapprovedAbsences * 2;
      const remainingFull = 12 - approvedFullLeaves - penaltyDeductions;
      const remainingShort = 6 - approvedShortLeaves;

      return {
        user: { id: user.id, name: user.name, role: user.role },
        requests: user.leaveRequests,
        balances: {
          totalYearly: 12,
          usedApproved: approvedFullLeaves,
          unapprovedAbsences: unapprovedAbsences,
          penaltyDeductions: penaltyDeductions,
          remainingFull: remainingFull,
          totalShort: 6,
          usedShort: approvedShortLeaves,
          remainingShort: remainingShort
        }
      };
    });

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Leave GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, startDate, endDate, type, reason } = body;

    if (!userId || !startDate || !endDate || !type || !reason) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        userId,
        startDate,
        endDate,
        type,
        reason,
        status: 'Pending'
      }
    });

    // Notify Admins
    try {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      const user = await prisma.user.findUnique({ where: { id: userId } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            text: `${user?.name} has requested a ${type} from ${startDate} to ${endDate}.`
          }
        });
      }
    } catch {}

    return NextResponse.json({ success: true, data: leave });
  } catch (error) {
    console.error('Leave POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
