import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { notificationId, userId } = await req.json();

    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });
    } else if (userId) {
      // Mark all read for user
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
