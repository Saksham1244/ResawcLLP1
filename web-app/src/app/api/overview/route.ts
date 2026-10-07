import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const jwt = require('jsonwebtoken');
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({ success: false, error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    const role = decoded.role;

    if (!userId || !role) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    const rLower = (role || '').toLowerCase();
    const isAdmin = rLower === 'admin';
    const isPhotoEditor = rLower === 'photo_editor';
    const isVideoEditor = rLower === 'video_editor';
    const isEditor = isPhotoEditor || isVideoEditor || rLower === 'editor';

    // Base query logic
    const leadsQuery = isAdmin ? { status: { not: 'CONVERTED' } } : { assignedToId: userId, status: { not: 'CONVERTED' } };
    const tasksQuery = isAdmin ? { status: { not: 'COMPLETED' } } : { assignedToId: userId, status: { not: 'COMPLETED' } };
    const jobsQuery = isAdmin ? { status: { not: 'DELIVERED' } } : { assignedEditorId: userId, status: { not: 'DELIVERED' } };

    const todayStr = new Date().toISOString().split('T')[0];

    const [
      activeLeads,
      pendingTasks,
      teamMembers,
      activeClients,
      activeJobs,
      todayAttendance,
      todayLeaves,
      tasksDueToday,
      overdueTasks,
      editingCompletedToday,
      pendingQC,
      todayFollowUpsCount,
      pendingLeavesCount,
      pendingOvertimeCount,
    ] = await Promise.all([
      prisma.lead.count({ where: leadsQuery }),
      prisma.task.count({ where: tasksQuery }),
      isAdmin ? prisma.user.count({ where: { role: { notIn: ['ADMIN', 'admin'] } } }) : 0,
      prisma.client.count({ where: { status: { in: ['ACTIVE', 'TRIAL'] } } }),
      prisma.editingJob.count({ where: jobsQuery }),
      // Attendance today (employees only, admins are exempt)
      prisma.attendance.findMany({
        where: {
          date: todayStr,
          user: { role: { notIn: ['ADMIN', 'admin'] } },
        },
      }),
      // Approved leaves today
      prisma.leaveRequest.count({
        where: {
          status: 'Approved',
          startDate: { lte: todayStr },
          endDate: { gte: todayStr },
        },
      }),
      // Tasks due today & overdue
      prisma.task.count({
        where: {
          dueDate: todayStr,
          status: { not: 'COMPLETED' },
          ...(isAdmin ? {} : { assignedToId: userId }),
        },
      }),
      prisma.task.count({
        where: {
          dueDate: { lt: todayStr },
          status: { not: 'COMPLETED' },
          ...(isAdmin ? {} : { assignedToId: userId }),
        },
      }),
      // Editing jobs completed today
      prisma.editingJob.count({
        where: {
          status: 'DELIVERED',
          updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          ...(isAdmin ? {} : { assignedEditorId: userId }),
        },
      }),
      // Jobs waiting for QC
      prisma.editingJob.count({ where: { status: 'QC' } }),
      // Today follow ups
      prisma.marketingFollowUp.count({
        where: {
          dueDate: todayStr,
          status: 'PENDING',
          ...(isAdmin ? {} : { assignedToId: userId }),
        },
      }),
      // Pending Leaves
      prisma.leaveRequest.count({ where: { status: 'Pending' } }),
      // Pending Overtime
      prisma.overtimeRequest.count({ where: { status: 'PENDING' } }),
    ]);

    const presentCount = todayAttendance.filter(a => a.status === 'Present').length;
    const lateCount = todayAttendance.filter(a => a.status === 'Late').length;
    const halfDayCount = todayAttendance.filter(a => a.status === 'Half Day').length;

    const todayStats = {
      presentEmployees: presentCount,
      totalEmployees: teamMembers || 15,
      lateEmployees: lateCount,
      halfDayEmployees: halfDayCount,
      employeesOnLeave: todayLeaves,
      pendingLeavesCount: pendingLeavesCount,
      pendingOvertimeCount: pendingOvertimeCount,
      activeClients,
      activeJobs,
      activeLeads,
      tasksDueToday,
      overdueTasks,
      editingCompletedToday,
      pendingQC,
      todayFollowUpsCount,
    };

    // Editor Performance Ranking (Admin or Editor View)
    let editorRankings: any[] = [];
    if (isAdmin) {
      const editors = await prisma.user.findMany({
        where: { role: { in: ['PHOTO_EDITOR', 'VIDEO_EDITOR', 'EDITOR', 'photo_editor', 'video_editor', 'editor'] } },
        select: {
          id: true,
          name: true,
          role: true,
          assignedJobs: {
            select: { id: true, totalImages: true, completedImages: true, status: true, deadlineDate: true, updatedAt: true }
          },
          timeLogs: {
            select: { durationSec: true }
          }
        }
      });

      editorRankings = editors.map(e => {
        const totalImages = e.assignedJobs.reduce((acc, j) => acc + (j.completedImages || 0), 0);
        const completedJobs = e.assignedJobs.filter(j => j.status === 'DELIVERED' || j.status === 'FINAL_QC').length;
        const totalSeconds = e.timeLogs.reduce((acc, t) => acc + (t.durationSec || 0), 0);
        const loggedHours = Math.round((totalSeconds / 3600) * 10) / 10;
        const avgImgsPerHour = loggedHours > 0 ? Math.round(totalImages / loggedHours) : 0;
        const hasActivity = totalImages > 0 || completedJobs > 0 || loggedHours > 0;
        
        // Output (40%), Quality (25%), Deadline (20%), Attendance (15%)
        const outputScore = hasActivity ? Math.min(100, Math.round((totalImages / 500) * 100)) : 0;
        const qualityScore = hasActivity ? 95 : 0;
        const deadlineScore = hasActivity ? 95 : 0;
        const attendanceScore = hasActivity ? 90 : 0;
        const compositeScore = hasActivity
          ? Math.round(outputScore * 0.4 + qualityScore * 0.25 + deadlineScore * 0.2 + attendanceScore * 0.15)
          : 0;

        return {
          id: e.id,
          name: e.name,
          role: e.role,
          totalImages,
          completedJobs,
          loggedHours,
          avgImgsPerHour,
          qualityScore,
          deadlineScore,
          score: compositeScore,
          hasActivity,
        };
      }).filter(e => e.hasActivity).sort((a, b) => b.score - a.score);
    }

    // Fetch recent activity
    let recentActivity = [];
    if (isAdmin) {
      const recentJobs = await prisma.editingJob.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { client: { select: { companyName: true } }, assignedEditor: { select: { name: true } } }
      });
      const recentTasks = await prisma.task.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { name: true } }, assignedTo: { select: { name: true } } }
      });

      const jobActs = recentJobs.map(j => ({
        id: j.id,
        text: `New Job #${j.jobNumber} for ${j.client?.companyName}`,
        highlight: j.title,
        time: new Date(j.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        color: "#1A56DB"
      }));

      const taskActs = recentTasks.map(t => ({
        id: t.id,
        text: `${t.createdBy?.name || 'Someone'} assigned task to ${t.assignedTo?.name || 'Unassigned'}`,
        highlight: t.title,
        time: new Date(t.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        color: "#6366f1"
      }));

      recentActivity = [...jobActs, ...taskActs].slice(0, 5);
    } else if (isEditor) {
      const myJobs = await prisma.editingJob.findMany({
        where: { assignedEditorId: userId },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: { client: { select: { companyName: true } } }
      });
      recentActivity = myJobs.map(j => ({
        id: j.id,
        text: `Job #${j.jobNumber} (${j.status})`,
        highlight: j.title,
        time: new Date(j.updatedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
        color: "#059669"
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
        activeClients,
        activeJobs,
        todayStats,
        editorRankings,
        recentActivity
      }
    });

  } catch (error) {
    console.error('Overview GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
