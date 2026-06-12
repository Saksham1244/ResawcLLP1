import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST — record check-in or check-out
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, date, timeIn, source } = body;

    if (!userId || !date || !timeIn || !source) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // ── CHECKOUT ──────────────────────────────────────────────────────────────
    if (source === 'checkout') {
      // Find the latest open (no timeOut) record for today
      const openRecord = await prisma.attendance.findFirst({
        where: { userId, date, timeOut: null },
        orderBy: { createdAt: 'desc' },
      });

      if (!openRecord) {
        // No open check-in found — maybe already checked out or never checked in
        return NextResponse.json({ success: false, error: 'No active check-in found for today.' }, { status: 404 });
      }

      await prisma.attendance.update({
        where: { id: openRecord.id },
        data: { timeOut: timeIn },
      });

      return NextResponse.json({ success: true, message: 'Checked out successfully' });
    }

    // ── CHECK-IN (mobile or system) ───────────────────────────────────────────
    const existing = await prisma.attendance.findFirst({
      where: { userId, date, timeOut: null }, // find an OPEN record (no checkout yet)
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      // Update the existing open record with the login time if not already set
      const updateData: any = {};
      if (source === 'mobile' && !existing.mobileLoginTime) {
        updateData.mobileLoginTime = timeIn;
      } else if (source === 'system' && !existing.systemLoginTime) {
        updateData.systemLoginTime = timeIn;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.attendance.update({ where: { id: existing.id }, data: updateData });
      }

      return NextResponse.json({ success: true, message: 'Check-in updated' });
    }

    // No open record — create a fresh one
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    await prisma.attendance.create({
      data: {
        userId,
        date,
        timeIn,
        mobileLoginTime: source === 'mobile' ? timeIn : null,
        systemLoginTime: source === 'system' ? timeIn : null,
        status: 'Present',
      },
    });

    // Notify admins
    try {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            text: `${user.name} checked in at ${timeIn} (${source === 'mobile' ? '📱 Mobile' : '💻 System'})`,
          },
        });
      }
    } catch {
      // Notifications are non-critical — don't fail the whole request
    }

    return NextResponse.json({ success: true, message: 'Checked in successfully' });

  } catch (error) {
    console.error('Attendance POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET — fetch attendance records
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
        ...(userId ? { userId } : {}),
        ...(email ? { user: { email: { equals: email, mode: 'insensitive' } } } : {}),
      },
      include: { user: { select: { name: true, role: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error('Attendance GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
