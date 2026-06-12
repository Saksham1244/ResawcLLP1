import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all tasks (or filtered by userId for non-admins)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const tasks = await prisma.task.findMany({
      where: userId ? { assignedToId: userId } : {},
      include: {
        assignedTo: { select: { id: true, name: true, role: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST create a new task
export async function POST(req: Request) {
  try {
    const { title, description, assignedToId, createdById, priority, dueDate, status } = await req.json();
    if (!title || !createdById) {
      return NextResponse.json({ success: false, error: 'Title and creator are required' }, { status: 400 });
    }
    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        assignedToId: assignedToId || null,
        createdById,
        status: status || 'PENDING',
        priority: priority || 'MEDIUM',
        dueDate: dueDate || null,
      },
      include: {
        assignedTo: { select: { id: true, name: true, role: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to create task' }, { status: 500 });
  }
}

// PATCH update task status
export async function PATCH(req: Request) {
  try {
    const { id, status } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: 'Task ID required' }, { status: 400 });
    const task = await prisma.task.update({
      where: { id },
      data: { status },
      include: {
        assignedTo: { select: { id: true, name: true, role: true } },
      },
    });
    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to update task' }, { status: 500 });
  }
}

// DELETE a task
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: 'Task ID required' }, { status: 400 });
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete task' }, { status: 500 });
  }
}
