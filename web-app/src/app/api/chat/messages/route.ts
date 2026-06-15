import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'conversationId is required' }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { conversationId, senderId, text } = await req.json();

    if (!conversationId || !senderId || !text) {
      return NextResponse.json({ success: false, error: 'conversationId, senderId, and text are required' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        text
      },
      include: {
        sender: { select: { id: true, name: true } }
      }
    });

    // Update lastReadAt for the sender
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: senderId
        }
      },
      data: {
        lastReadAt: new Date()
      }
    });

    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to create message' }, { status: 500 });
  }
}
