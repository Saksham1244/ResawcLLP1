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
    let role = searchParams.get('role')?.toLowerCase() || 'marketing';
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        if (decoded.role) role = decoded.role.toLowerCase();
      } catch (err) {
        // Fallback to query role if token is expired/invalid
      }
    }

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

    // 1. Single lead creation
    if (body.name) {
      const { name, company, phone, email, notes, assignedToId, status } = body;
      const newLead = await prisma.lead.create({
        data: {
          name: name.trim(),
          company: company?.trim() || null,
          phone: phone ? String(phone).trim() : null,
          email: email?.trim() || null,
          notes: notes?.trim() || null,
          status: status || 'NEW',
          assignedToId: assignedToId || null,
        },
        include: {
          assignedTo: { select: { name: true } },
          interactions: true,
        }
      });

      if (assignedToId) {
        try {
          await prisma.notification.create({
            data: {
              userId: assignedToId,
              text: `A new lead (${name}) has been assigned to you.`
            }
          });
        } catch (e) {}
      }

      const mappedLead = {
        _id: newLead.id,
        _assignee: newLead.assignedTo?.name || 'Unassigned',
        _status: newLead.status,
        Name: newLead.name,
        Company: newLead.company || '',
        Phone: newLead.phone || '',
        Email: newLead.email || '',
        Notes: newLead.notes || '',
        _interactions: []
      };

      return NextResponse.json({ success: true, lead: mappedLead });
    }

    // 2. Bulk lead distribution
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

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const jwt = require('jsonwebtoken');
    let userRole = '';

    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        userRole = decoded.role?.toLowerCase() || '';
      } catch (e) {
        console.warn('JWT verification fallback in DELETE /api/leads');
      }
    }

    const { searchParams } = new URL(req.url);
    const queryRole = searchParams.get('role')?.toLowerCase();
    const effectiveRole = userRole || queryRole;

    if (effectiveRole !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required to delete leads' }, { status: 403 });
    }

    let targetIds: string[] = [];
    const queryId = searchParams.get('id');
    if (queryId) {
      targetIds.push(queryId);
    }

    try {
      const body = await req.json().catch(() => null);
      if (body) {
        if (body.id && typeof body.id === 'string') {
          targetIds.push(body.id);
        }
        if (Array.isArray(body.ids)) {
          targetIds.push(...body.ids.map((id: any) => String(id)));
        }
      }
    } catch (e) {}

    targetIds = Array.from(new Set(targetIds)).filter(Boolean);

    if (targetIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No lead IDs provided for deletion' }, { status: 400 });
    }

    // First delete dependent interactions to maintain referential integrity
    await prisma.leadInteraction.deleteMany({
      where: { leadId: { in: targetIds } }
    });

    // Delete leads
    const deleteResult = await prisma.lead.deleteMany({
      where: { id: { in: targetIds } }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.count} lead(s)`,
      count: deleteResult.count
    });
  } catch (error) {
    console.error('Leads DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
