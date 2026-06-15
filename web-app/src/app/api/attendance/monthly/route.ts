import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // format: YYYY-MM
    
    if (!month) {
      return NextResponse.json({ success: false, error: 'Month parameter is required' }, { status: 400 });
    }

    const yearStr = month.split('-')[0];
    const monthStr = month.split('-')[1];

    // Fetch all users
    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true, role: true }
    });

    // Fetch all attendance records for the given month
    // We use a "startsWith" on the date string since dates are stored as "YYYY-MM-DD"
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: {
          startsWith: `${yearStr}-${monthStr}`
        }
      }
    });

    // Aggregate records per user
    const userAggregations = allUsers.map(user => {
      const userRecords = attendanceRecords.filter(r => r.userId === user.id);
      
      let present = 0;
      let absent = 0;
      let late = 0;
      let halfDay = 0;

      // Ensure we only count 1 status per day per user (using latest record for a day if multiple exist)
      const recordsByDate: Record<string, typeof userRecords[0]> = {};
      
      userRecords.forEach(record => {
        if (!recordsByDate[record.date]) {
          recordsByDate[record.date] = record;
        } else {
          // keep the one with the latest createdAt
          if (new Date(record.createdAt).getTime() > new Date(recordsByDate[record.date].createdAt).getTime()) {
            recordsByDate[record.date] = record;
          }
        }
      });

      Object.values(recordsByDate).forEach(record => {
        if (record.status === 'Absent') absent++;
        else if (record.status === 'Present') present++;
        else if (record.status === 'Late') late++;
        else if (record.status === 'Half Day') halfDay++;
        else if (record.status === 'Short Day') halfDay++; // Count Short Day as Half Day if not explicitly marked
      });

      return {
        userId: user.id,
        userName: user.name,
        role: user.role,
        present,
        absent,
        late,
        halfDay,
        totalTracked: present + absent + late + halfDay
      };
    });

    return NextResponse.json({ success: true, data: userAggregations });

  } catch (error) {
    console.error('Monthly Attendance GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
