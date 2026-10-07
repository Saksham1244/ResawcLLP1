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

    const allConversations = participants.map(p => p.conversation);

    // Deduplicate DIRECT conversations with same other participant
    const seenDirectPartners = new Set<string>();
    const deduplicated: typeof allConversations = [];

    for (const conv of allConversations) {
      if (conv.type === 'DIRECT') {
        const otherParticipant = conv.participants.find(p => p.user.id !== userId);
        const otherId = otherParticipant?.user.id || conv.id;
        if (seenDirectPartners.has(otherId)) {
          continue; // Skip duplicate direct conversation
        }
        seenDirectPartners.add(otherId);
      }
      deduplicated.push(conv);
    }

    // Sort by most recent message or conversation creation
    deduplicated.sort((a, b) => {
      const timeA = a.messages?.[0]?.createdAt || (a as any).createdAt || '';
      const timeB = b.messages?.[0]?.createdAt || (b as any).createdAt || '';
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });

    return NextResponse.json({ success: true, data: deduplicated });
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

    const convType = type ? type.toUpperCase() : (memberIds.length === 2 ? 'DIRECT' : 'GROUP');

    // For DIRECT messages between 2 users, reuse existing conversation if one exists
    if (convType === 'DIRECT' && memberIds.length === 2) {
      const existing = await prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          AND: [
            { participants: { some: { userId: memberIds[0] } } },
            { participants: { some: { userId: memberIds[1] } } },
          ],
        },
        include: {
          participants: {
            include: { user: { select: { id: true, name: true } } }
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (existing) {
        return NextResponse.json({ success: true, data: existing });
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        name: name || null,
        type: convType,
        participants: {
          create: memberIds.map((id: string) => ({ userId: id }))
        }
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true } } }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    return NextResponse.json({ success: true, data: conversation });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to create conversation' }, { status: 500 });
  }
}
