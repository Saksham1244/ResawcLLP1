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

    // Fetch all employees (admins are exempt)
    const allUsers = await prisma.user.findMany({
      where: { role: { notIn: ['ADMIN', 'admin'] } },
      select: { id: true, name: true, role: true }
    });

    // Fetch all attendance records for the given month
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
      let onLeave = 0;
      let wfh = 0;
      let totalLateMinutes = 0;

      // Ensure we only count 1 status per day per user (using latest record for a day if multiple exist)
      const recordsByDate: Record<string, typeof userRecords[0]> = {};
      
      userRecords.forEach(record => {
        if (!recordsByDate[record.date]) {
          recordsByDate[record.date] = record;
        } else {
          if (new Date(record.createdAt).getTime() > new Date(recordsByDate[record.date].createdAt).getTime()) {
            recordsByDate[record.date] = record;
          }
        }
      });

      Object.values(recordsByDate).forEach(record => {
        const s = record.status.toLowerCase();
        if (s === 'absent') absent++;
        else if (s === 'present') present++;
        else if (s === 'late') {
          late++;
          totalLateMinutes += record.lateMinutes || 0;
        }
        else if (s === 'half day' || s === 'short day') halfDay++;
        else if (s === 'on leave' || s.includes('leave')) onLeave++;
        else if (s === 'wfh') wfh++;
      });

      return {
        userId: user.id,
        userName: user.name,
        role: user.role,
        present,
        absent,
        late,
        halfDay,
        onLeave,
        wfh,
        totalLateMinutes,
        totalTracked: present + absent + late + halfDay + onLeave + wfh
      };
    });

    return NextResponse.json({ success: true, data: userAggregations });

  } catch (error) {
    console.error('Monthly Attendance GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
