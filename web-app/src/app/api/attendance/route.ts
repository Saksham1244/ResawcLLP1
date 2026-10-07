import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to convert time strings (e.g. "10:15 AM", "10:15:30 AM", "18:30") to minutes since midnight
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || timeStr === '--') return -1;
  const parts = timeStr.trim().split(' ');
  const timePart = parts[0];
  const modifier = parts[1]?.toUpperCase();

  const [rawH, rawM] = timePart.split(':').map(Number);
  let hours = isNaN(rawH) ? 0 : rawH;
  const minutes = isNaN(rawM) ? 0 : rawM;

  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

// POST — record check-in or check-out with automatic late & half-day detection
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, date, timeIn, source, isAdminBypass, requestorRole } = body;

    if (!userId || !date || !timeIn || !source) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Admins are strictly exempt from attendance time logging
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (user.role?.toUpperCase() === 'ADMIN') {
      return NextResponse.json({
        success: true,
        message: 'Administrators are exempt from attendance time logging',
        isExempt: true,
      });
    }

    // Fetch workspace attendance policy
    const settings = await prisma.globalSettings.findUnique({ where: { id: 'default' } });
    const workStartTimeStr = settings?.workStartTime || '10:00'; // Default 10:00 AM
    const workEndTimeStr = settings?.workEndTime || '18:30';     // Default 06:30 PM
    const graceMinutes = settings?.lateGrace ?? 15;               // Default 15 min grace

    const workStartMins = parseTimeToMinutes(workStartTimeStr);
    const workEndMins = parseTimeToMinutes(workEndTimeStr);
    const lateCutoffMins = workStartMins + graceMinutes;
    const halfDayCutoffMins = workStartMins + 210; // 3.5h after start, ~01:30 PM

    // ── CHECKOUT ──────────────────────────────────────────────────────────────
    if (source === 'checkout') {
      const openRecord = await prisma.attendance.findFirst({
        where: {
          userId,
          date,
          OR: [{ timeOut: null }, { timeOut: '' }, { timeOut: '--' }],
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!openRecord) {
        return NextResponse.json({ success: false, error: 'No active check-in found for today.' }, { status: 404 });
      }

      const checkInMins = parseTimeToMinutes(openRecord.timeIn);
      const checkOutMins = parseTimeToMinutes(timeIn);
      const durationMins = checkOutMins >= checkInMins ? checkOutMins - checkInMins : 0;
      const totalHours = Math.round((durationMins / 60) * 10) / 10;

      let earlyExitMinutes = 0;
      if (workEndMins > 0 && checkOutMins > 0 && checkOutMins < workEndMins) {
        earlyExitMinutes = workEndMins - checkOutMins;
      }

      // If worked less than 4.5 hours (270 mins), automatically mark as Half Day
      let updatedStatus = openRecord.status;
      if (durationMins > 0 && durationMins < 270 && updatedStatus === 'Present') {
        updatedStatus = 'Half Day';
      }

      await prisma.attendance.update({
        where: { id: openRecord.id },
        data: {
          timeOut: timeIn,
          totalHours,
          earlyExitMinutes,
          status: updatedStatus,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Checked out successfully',
        totalHours,
        earlyExitMinutes,
        status: updatedStatus,
      });
    }

    // ── CHECK-IN (mobile or system) ───────────────────────────────────────────
    const existing = await prisma.attendance.findFirst({
      where: {
        userId,
        date,
        OR: [{ timeOut: null }, { timeOut: '' }, { timeOut: '--' }],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      const updateData: any = {};
      if (source === 'mobile' && !existing.mobileLoginTime) {
        updateData.mobileLoginTime = timeIn;
      } else if ((source === 'system' || source === 'web') && !existing.systemLoginTime) {
        updateData.systemLoginTime = timeIn;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.attendance.update({ where: { id: existing.id }, data: updateData });
      }

      return NextResponse.json({ success: true, message: 'Check-in updated' });
    }

    // Determine Status based on Policy
    const currentMins = parseTimeToMinutes(timeIn);
    let initialStatus = 'Present';
    let lateMinutes = 0;

    if (currentMins >= 0 && workStartMins >= 0) {
      if (currentMins > halfDayCutoffMins) {
        initialStatus = 'Half Day';
        lateMinutes = Math.max(0, currentMins - workStartMins);
      } else if (currentMins > lateCutoffMins) {
        initialStatus = 'Late';
        lateMinutes = Math.max(0, currentMins - workStartMins);
      } else {
        initialStatus = 'Present';
        lateMinutes = 0;
      }
    }

    const newRecord = await prisma.attendance.create({
      data: {
        userId,
        date,
        timeIn,
        mobileLoginTime: source === 'mobile' ? timeIn : null,
        systemLoginTime: (source === 'system' || source === 'web') ? timeIn : null,
        status: initialStatus,
        lateMinutes,
      },
    });

    // Notify admins if employee arrives Late
    try {
      const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'admin'] } } });
      const statusIcon = initialStatus === 'Late' ? '⚠️' : initialStatus === 'Half Day' ? '🌓' : '✅';
      const lateNote = lateMinutes > 0 ? ` (${lateMinutes}m past shift start)` : '';

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            text: `${statusIcon} ${user.name} checked in at ${timeIn} — ${initialStatus}${lateNote} [${source === 'mobile' ? 'Mobile' : 'Web'}]`,
          },
        });
      }
    } catch {
      // Non-critical notification error
    }

    return NextResponse.json({
      success: true,
      message: `Checked in successfully as ${initialStatus}`,
      data: newRecord,
    });

  } catch (error) {
    console.error('Attendance POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET — fetch attendance records with policy stats
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const startDate = searchParams.get('start') || date;
    const endDate = searchParams.get('end') || date;
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    const records = await prisma.attendance.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        ...(userId ? { userId } : { user: { role: { notIn: ['ADMIN', 'admin'] } } }),
        ...(email ? { user: { email: { equals: email, mode: 'insensitive' } } } : {}),
      },
      include: {
        user: { select: { id: true, name: true, role: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute summary breakdown
    let presentCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;
    let onLeaveCount = 0;
    let wfhCount = 0;
    let totalLateMinutes = 0;

    records.forEach((r) => {
      const s = r.status.toLowerCase();
      if (s === 'present') presentCount++;
      else if (s === 'late') {
        lateCount++;
        totalLateMinutes += r.lateMinutes || 0;
      } else if (s === 'half day') halfDayCount++;
      else if (s === 'on leave' || s.includes('leave')) onLeaveCount++;
      else if (s === 'wfh') wfhCount++;
    });

    return NextResponse.json({
      success: true,
      data: records,
      summary: {
        totalRecords: records.length,
        presentCount,
        lateCount,
        halfDayCount,
        onLeaveCount,
        wfhCount,
        totalLateMinutes,
      },
    });
  } catch (error) {
    console.error('Attendance GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
