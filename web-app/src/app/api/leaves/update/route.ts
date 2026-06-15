import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { leaveId, adminId, status, startDate, endDate, type } = body;

    if (!leaveId) {
      return NextResponse.json({ success: false, error: 'Leave ID required' }, { status: 400 });
    }

    const leave = await prisma.leaveRequest.findUnique({ where: { id: leaveId } });
    if (!leave) {
       return NextResponse.json({ success: false, error: 'Leave not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (startDate) updateData.startDate = startDate;
    if (endDate) updateData.endDate = endDate;
    if (type) updateData.type = type;

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: updateData
    });

    if (status) {
      // Notify the user about status change
      await prisma.notification.create({
        data: {
          userId: leave.userId,
          text: `Your ${leave.type} from ${leave.startDate} to ${leave.endDate} was marked as ${status}.`
        }
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Leave PUT error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
