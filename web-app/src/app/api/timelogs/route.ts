import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/timelogs
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const editingJobId = searchParams.get('editingJobId');
    const taskId = searchParams.get('taskId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: any = {};
    if (userId) where.userId = userId;
    if (editingJobId) where.editingJobId = editingJobId;
    if (taskId) where.taskId = taskId;
    if (activeOnly) {
      where.status = { in: ['RUNNING', 'PAUSED'] };
    }

    const logs = await prisma.timeLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, role: true } },
        editingJob: { select: { id: true, jobNumber: true, title: true, client: { select: { companyName: true } } } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Calculate total duration for this query
    const totalSeconds = logs.reduce((acc, log) => acc + (log.durationSec || 0), 0);

    return NextResponse.json({
      success: true,
      data: logs,
      totalSeconds,
      formattedTotal: formatDuration(totalSeconds),
    });
  } catch (error) {
    console.error('Error fetching time logs:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/timelogs
// Body: { action: "START" | "PAUSE" | "RESUME" | "STOP", userId, editingJobId?, taskId?, notes?, logId? }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, userId, editingJobId, taskId, notes, logId } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    const now = new Date();

    // ── 1. START WORK ────────────────────────────────────────────────────────
    if (action === 'START') {
      // If there is already an active timer running for this user, pause it first
      const activeRunning = await prisma.timeLog.findFirst({
        where: { userId, status: 'RUNNING' },
      });

      if (activeRunning) {
        const elapsed = Math.max(0, Math.round((now.getTime() - activeRunning.startTime.getTime()) / 1000));
        await prisma.timeLog.update({
          where: { id: activeRunning.id },
          data: {
            durationSec: activeRunning.durationSec + elapsed,
            status: 'PAUSED',
          },
        });
      }

      // Create new timer session
      const newLog = await prisma.timeLog.create({
        data: {
          userId,
          editingJobId: editingJobId || null,
          taskId: taskId || null,
          startTime: now,
          status: 'RUNNING',
          durationSec: 0,
          notes: notes || null,
        },
        include: {
          editingJob: { select: { jobNumber: true, title: true } },
          task: { select: { title: true } },
        },
      });

      // If tied to an editing job, ensure the job status is at least EDITING
      if (editingJobId) {
        try {
          await prisma.editingJob.update({
            where: { id: editingJobId },
            data: { status: 'EDITING' },
          });
        } catch {}
      }

      return NextResponse.json({ success: true, data: newLog, message: 'Timer started' });
    }

    // ── 2. PAUSE WORK ────────────────────────────────────────────────────────
    if (action === 'PAUSE') {
      const targetLog = logId
        ? await prisma.timeLog.findUnique({ where: { id: logId } })
        : await prisma.timeLog.findFirst({ where: { userId, status: 'RUNNING' }, orderBy: { createdAt: 'desc' } });

      if (!targetLog) {
        return NextResponse.json({ success: false, error: 'No active running timer found' }, { status: 404 });
      }

      const elapsed = Math.max(0, Math.round((now.getTime() - targetLog.startTime.getTime()) / 1000));
      const updated = await prisma.timeLog.update({
        where: { id: targetLog.id },
        data: {
          durationSec: targetLog.durationSec + elapsed,
          status: 'PAUSED',
          notes: notes !== undefined ? notes : targetLog.notes,
        },
      });

      return NextResponse.json({ success: true, data: updated, message: 'Timer paused' });
    }

    // ── 3. RESUME WORK ───────────────────────────────────────────────────────
    if (action === 'RESUME') {
      const targetLog = logId
        ? await prisma.timeLog.findUnique({ where: { id: logId } })
        : await prisma.timeLog.findFirst({ where: { userId, status: 'PAUSED' }, orderBy: { createdAt: 'desc' } });

      if (!targetLog) {
        return NextResponse.json({ success: false, error: 'No paused timer found' }, { status: 404 });
      }

      const updated = await prisma.timeLog.update({
        where: { id: targetLog.id },
        data: {
          startTime: now, // reset session start for running calculation
          status: 'RUNNING',
        },
      });

      return NextResponse.json({ success: true, data: updated, message: 'Timer resumed' });
    }

    // ── 4. STOP / COMPLETE ───────────────────────────────────────────────────
    if (action === 'STOP' || action === 'COMPLETE') {
      const targetLog = logId
        ? await prisma.timeLog.findUnique({ where: { id: logId } })
        : await prisma.timeLog.findFirst({ where: { userId, status: { in: ['RUNNING', 'PAUSED'] } }, orderBy: { createdAt: 'desc' } });

      if (!targetLog) {
        return NextResponse.json({ success: false, error: 'No active timer found to complete' }, { status: 404 });
      }

      let extraSeconds = 0;
      if (targetLog.status === 'RUNNING') {
        extraSeconds = Math.max(0, Math.round((now.getTime() - targetLog.startTime.getTime()) / 1000));
      }

      const finalDuration = targetLog.durationSec + extraSeconds;

      const completed = await prisma.timeLog.update({
        where: { id: targetLog.id },
        data: {
          durationSec: finalDuration,
          endTime: now,
          status: 'COMPLETED',
          notes: notes !== undefined ? notes : targetLog.notes,
        },
      });

      return NextResponse.json({
        success: true,
        data: completed,
        message: `Task completed (${formatDuration(finalDuration)} logged)`,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling time log:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m ${seconds % 60}s`;
}
