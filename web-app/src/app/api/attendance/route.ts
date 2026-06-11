import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST — record check-in (mobile geofencing or system login)
export async function POST(req: Request) {
  try {
    const { userId, date, timeIn, status, source } = await req.json();
    // source: "mobile" | "system"

    if (!userId || !date || !timeIn) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    const existing = await prisma.attendance.findFirst({ 
      where: { userId, date },
      orderBy: { createdAt: 'desc' }
    });

    if (existing) {
      // Already has a record — update the other login source or check out
      const updateData: any = {};
      if (source === 'mobile' && !existing.mobileLoginTime) {
        updateData.mobileLoginTime = timeIn;
      } else if (source === 'system' && !existing.systemLoginTime) {
        updateData.systemLoginTime = timeIn;
      }
      
      if (source === 'checkout') {
        updateData.timeOut = timeIn;
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.attendance.update({ where: { id: existing.id }, data: updateData });
      }

      return NextResponse.json({ success: true, message: 'Login time updated' });
    }

    // Create fresh attendance record
    const attendance = await prisma.attendance.create({
      data: {
        userId,
        date,
        timeIn,
        mobileLoginTime: source === 'mobile' ? timeIn : null,
        systemLoginTime: source === 'system' ? timeIn : null,
        status: status || 'Present',
      },
      include: { user: true }
    });

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          text: `${attendance.user?.name} checked in at ${timeIn} (${source} login)`
        }
      });
    }

    return NextResponse.json({ success: true, data: attendance });
  } catch (error) {
    console.error('Attendance error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}


// GET — fetch today's team attendance with both login times
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
        ...(email ? { user: { email: { equals: email, mode: 'insensitive' } } } : {})
      },
      include: { user: { select: { name: true, role: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
