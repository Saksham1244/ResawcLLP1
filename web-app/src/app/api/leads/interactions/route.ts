import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, userId, notes } = body;
    const outcome = body.outcome || body.status || "PICKED_UP";
    const status = body.newLeadStatus || body.status || "CONTACTED";
    const type = body.type || "CALL";

    if (!leadId || !userId) {
      return NextResponse.json({ success: false, error: 'leadId and userId are required' }, { status: 400 });
    }

    await prisma.leadInteraction.create({
      data: {
        leadId,
        userId,
        type,
        status: outcome,
        notes: notes || null
      }
    });

    // Update lead status
    await prisma.lead.update({
      where: { id: leadId },
      data: { status }
    });

    // Auto-create Client in client list if converted or trial
    if (status.toUpperCase() === 'CONVERTED' || status.toUpperCase() === 'TRIAL') {
      try {
        const lead = await prisma.lead.findUnique({ where: { id: leadId } });
        if (lead) {
          const compName = lead.company || lead.name;
          const existing = await prisma.client.findFirst({
            where: {
              OR: [
                { companyName: { equals: compName, mode: 'insensitive' as const } },
                ...(lead.email ? [{ email: { equals: lead.email, mode: 'insensitive' as const } }] : []),
              ],
            },
          });

          if (!existing) {
            const lastClient = await prisma.client.findFirst({
              orderBy: { createdAt: 'desc' },
              select: { clientId: true },
            });
            let nextId = 'CL-1001';
            if (lastClient && lastClient.clientId.startsWith('CL-')) {
              const num = parseInt(lastClient.clientId.replace('CL-', ''), 10);
              if (!isNaN(num)) nextId = `CL-${num + 1}`;
            }

            await prisma.client.create({
              data: {
                clientId: nextId,
                companyName: compName,
                contactPerson: lead.name,
                phone: lead.phone || null,
                email: lead.email || null,
                status: status.toUpperCase() === 'CONVERTED' ? 'ACTIVE' : 'TRIAL',
                notes: notes || lead.notes || null,
                assignedMarketingId: userId || lead.assignedToId || null,
              },
            });
          }
        }
      } catch (err) {
        console.warn('Auto client creation warning:', err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Leads Interactions POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
