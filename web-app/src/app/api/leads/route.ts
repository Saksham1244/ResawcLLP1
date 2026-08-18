import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const role = decoded.role;

    let query: any = {};
    if (role !== 'admin' && userId) {
      query.assignedToId = userId;
    }

    const leads = await prisma.lead.findMany({
      where: query,
      include: {
        interactions: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { name: true } } }
        },
        assignedTo: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Map to frontend structure
    const mappedLeads = leads.map(l => ({
      _id: l.id,
      _assignee: l.assignedTo?.name || 'Unassigned',
      _status: l.status,
      Name: l.name,
      Company: l.company || '',
      Phone: l.phone || '',
      Email: l.email || '',
      Notes: l.notes || '',
      _interactions: l.interactions.map(i => ({
        id: i.id,
        outcome: i.status,
        notes: i.notes || '',
        date: new Date(i.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        time: new Date(i.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        loggedBy: i.user?.name || 'Unknown'
      }))
    }));

    return NextResponse.json({ success: true, data: mappedLeads });
  } catch (error) {
    console.error('Leads GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leads, teamIds } = body; 
    // leads: array of { Name, Company, Phone, Email, Notes }
    // teamIds: array of marketing user IDs to distribute across

    if (!leads || !teamIds || teamIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Missing leads or team members' }, { status: 400 });
    }

    const createdLeads = [];
    for (let i = 0; i < leads.length; i++) {
      const row = leads[i];
      const assignedToId = teamIds[i % teamIds.length]; // Round-robin distribution

      const newLead = await prisma.lead.create({
        data: {
          name: row.Name || 'Unknown',
          company: row.Company || null,
          phone: String(row.Phone || ''),
          email: row.Email || null,
          notes: row.Notes || null,
          status: 'NEW',
          assignedToId: assignedToId
        }
      });
      createdLeads.push(newLead);
    }

    // Notify team
    try {
      for (const tId of teamIds) {
        await prisma.notification.create({
          data: {
            userId: tId,
            text: `New leads have been assigned to you. Please check your Leads Dashboard.`
          }
        });
      }
    } catch (e) {}

    return NextResponse.json({ success: true, count: createdLeads.length });
  } catch (error) {
    console.error('Leads POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
