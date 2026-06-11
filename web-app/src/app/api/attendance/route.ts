import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { userId, date, timeIn, status, coordinates } = data;

    if (!userId || !date || !timeIn) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // In a real app, verify the mock token from headers here
    
    // Check if attendance already exists for today
    const existing = await prisma.attendance.findFirst({
      where: {
        userId: userId,
        date: date
      }
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Already checked in today' }, { status: 400 });
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId: userId,
        date: date,
        timeIn: timeIn,
        status: status || 'Present',
      }
    });

    return NextResponse.json({ success: true, data: attendance });
  } catch (error) {
    console.error('Attendance Check-In Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    // Return today's attendance for the dashboard
    const today = new Date().toISOString().split('T')[0];
    
    const records = await prisma.attendance.findMany({
      where: {
        date: today
      },
      include: {
        user: true
      }
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
