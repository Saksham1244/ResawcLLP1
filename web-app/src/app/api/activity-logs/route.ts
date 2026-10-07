import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/activity-logs
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const clientId = searchParams.get('clientId');
    const entityType = searchParams.get('entityType');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {};
    if (userId) where.userId = userId;
    if (clientId) where.clientId = clientId;
    if (entityType) where.entityType = entityType;
    if (category && category !== 'ALL') where.category = category;
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { entityTitle: { contains: search, mode: 'insensitive' } },
        { userName: { contains: search, mode: 'insensitive' } },
      ];
    }

    let logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, role: true, email: true } },
        client: { select: { id: true, companyName: true, clientId: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}

// DELETE /api/activity-logs (Delete specific or all activity logs)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all');

    if (all === 'true') {
      const deleted = await prisma.activityLog.deleteMany({});
      return NextResponse.json({ success: true, count: deleted.count });
    }

    if (id) {
      await prisma.activityLog.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Provide id or all=true' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting activity log:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete activity log' }, { status: 500 });
  }
}

// POST /api/activity-logs (Manual Log / Milestone note)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      userName,
      userRole,
      action = 'NOTE_ADDED',
      category = 'GENERAL',
      entityType,
      entityId,
      entityTitle,
      clientId,
      description,
      metadata,
    } = body;

    if (!description) {
      return NextResponse.json({ success: false, error: 'Description is required' }, { status: 400 });
    }

    const log = await prisma.activityLog.create({
      data: {
        userId,
        userName,
        userRole,
        action,
        category,
        entityType,
        entityId,
        entityTitle,
        clientId,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    console.error('Error creating activity log:', error);
    return NextResponse.json({ success: false, error: 'Failed to create activity log' }, { status: 500 });
  }
}
