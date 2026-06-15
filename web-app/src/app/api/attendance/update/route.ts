import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recordId, status, checkIn, checkOut, date, userId, adminId } = body;

    // Verify admin
    const adminUser = await prisma.user.findUnique({ where: { id: adminId } });
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    if (recordId) {
      // Update existing record
      const updateData: any = {};
      if (status) updateData.status = status;
      if (checkIn) {
        updateData.timeIn = checkIn;
        updateData.systemLoginTime = checkIn; // Override system time so it shows up in UI
      }
      if (checkOut !== undefined) {
        updateData.timeOut = checkOut === '--' ? null : checkOut;
      }

      const updated = await prisma.attendance.update({
        where: { id: recordId },
        data: updateData
      });

      return NextResponse.json({ success: true, data: updated });
    } else if (userId && date && status) {
      // Create a brand new record for a user who didn't show up but Admin is marking them (e.g. Absent or Present manually)
      const newRecord = await prisma.attendance.create({
        data: {
          userId,
          date,
          status,
          timeIn: checkIn || '',
          systemLoginTime: checkIn || null,
          timeOut: checkOut && checkOut !== '--' ? checkOut : null
        }
      });
      return NextResponse.json({ success: true, data: newRecord });
    }

    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });

  } catch (error) {
    console.error('Attendance update error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
