import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    // Get all conversations this user is part of
    const participants = await prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: { user: { select: { id: true, name: true } } }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    const conversations = participants.map(p => p.conversation);
    return NextResponse.json({ success: true, data: conversations });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, type, memberIds } = await req.json(); // memberIds should be array of user IDs

    if (!memberIds || memberIds.length === 0) {
      return NextResponse.json({ success: false, error: 'memberIds are required' }, { status: 400 });
    }

    const conversation = await prisma.conversation.create({
      data: {
        name: name || null,
        type: type || 'DIRECT',
        participants: {
          create: memberIds.map((id: string) => ({ userId: id }))
        }
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true } } }
        }
      }
    });

    return NextResponse.json({ success: true, data: conversation });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to create conversation' }, { status: 500 });
  }
}
