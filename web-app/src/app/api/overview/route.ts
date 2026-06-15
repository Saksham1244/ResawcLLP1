import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    if (!userId || !role) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    const isAdmin = role === 'admin' || role === 'ADMIN';

    // Base query logic
    const leadsQuery = isAdmin ? { status: { not: 'CONVERTED' } } : { assignedToId: userId, status: { not: 'CONVERTED' } };
    const tasksQuery = isAdmin ? { status: { not: 'COMPLETED' } } : { assignedToId: userId, status: { not: 'COMPLETED' } };

    const [activeLeads, pendingTasks, teamMembers] = await Promise.all([
      prisma.lead.count({ where: leadsQuery }),
      prisma.task.count({ where: tasksQuery }),
      isAdmin ? prisma.user.count() : 0,
    ]);

    // Fetch recent activity (last 5 notifications or tasks)
    let recentActivity = [];
    if (isAdmin) {
      const recentTasks = await prisma.task.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { name: true } }, assignedTo: { select: { name: true } } }
      });
      recentActivity = recentTasks.map(t => ({
        id: t.id,
        text: `${t.createdBy?.name || 'Someone'} assigned a task to ${t.assignedTo?.name || 'Unassigned'}`,
        highlight: t.title,
        time: new Date(t.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        color: "#6366f1"
      }));
    } else {
      const recentTasks = await prisma.task.findMany({
        where: { assignedToId: userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
      });
      recentActivity = recentTasks.map(t => ({
        id: t.id,
        text: `You were assigned a task`,
        highlight: t.title,
        time: new Date(t.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        color: "#f59e0b"
      }));
    }

    return NextResponse.json({
      success: true,
      data: {
        activeLeads,
        pendingTasks,
        teamMembers,
        recentActivity
      }
    });

  } catch (error) {
    console.error('Overview GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
