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
    const { title, description, assignedToId, createdById, priority, dueDate, status, rawFilesLink, workLink } = await req.json();
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
        rawFilesLink: rawFilesLink?.trim() || null,
        workLink: workLink?.trim() || null,
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

// PATCH update task status, assignment, and links
export async function PATCH(req: Request) {
  try {
    const { id, status, assignedToId, rawFilesLink, workLink, priority, dueDate, submissionNotes } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: 'Task ID required' }, { status: 400 });
    
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId || null;
    if (rawFilesLink !== undefined) updateData.rawFilesLink = rawFilesLink?.trim() || null;
    if (workLink !== undefined) updateData.workLink = workLink?.trim() || null;
    if (submissionNotes !== undefined) updateData.submissionNotes = submissionNotes?.trim() || null;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate || null;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: { select: { id: true, name: true, role: true } },
        editingJob: true,
      },
    });

    // ── If Task is Completed / Work Submitted: Sync & Notify Admins ──────────
    if (updateData.status === 'COMPLETED' || updateData.workLink) {
      const assigneeName = task.assignedTo?.name || 'Employee';

      // 1. Sync linked Editing Job to QC
      if (task.editingJobId) {
        try {
          await prisma.editingJob.update({
            where: { id: task.editingJobId },
            data: {
              status: 'QC',
              workLink: task.workLink || updateData.workLink,
              qcStatus: 'PENDING',
            },
          });
        } catch (jobSyncErr) {
          console.warn('Error syncing editing job from task:', jobSyncErr);
        }
      }

      // 2. Notify Admins
      try {
        const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'admin'] } } });
        for (const admin of admins) {
          await prisma.notification.create({
            data: {
              userId: admin.id,
              text: `🚀 ${assigneeName} submitted task: "${task.title}"! Deliverables: ${task.workLink || 'Completed'}. Click to review what was done.`,
            },
          });
        }

        // 3. Activity Log
        await prisma.activityLog.create({
          data: {
            userId: task.assignedToId || admins[0]?.id || null,
            category: 'PROJECTS',
            action: 'TASK_COMPLETED_SUBMITTED',
            entityType: 'TASK',
            entityId: task.id,
            entityTitle: task.title,
            description: `${assigneeName} marked task "${task.title}" completed. Work link: ${task.workLink || 'Done'}.`,
          },
        });
      } catch (notifErr) {
        console.warn('Error sending task completion notification:', notifErr);
      }
    }

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
