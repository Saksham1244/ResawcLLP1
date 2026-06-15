import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, userId, outcome, notes, status } = body;

    if (!leadId || !userId || !outcome || !status) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    await prisma.leadInteraction.create({
      data: {
        leadId,
        userId,
        status: outcome,
        notes: notes || null
      }
    });

    // Update lead status
    await prisma.lead.update({
      where: { id: leadId },
      data: { status }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Leads Interactions POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
