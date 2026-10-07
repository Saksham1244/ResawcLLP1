import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to generate next Job Number (e.g. ED-1001 for photo, VD-1001 for video)
async function generateJobNumber(category: string): Promise<string> {
  const prefix = category.toUpperCase() === 'VIDEO' ? 'VD' : 'ED';
  const lastJob = await prisma.editingJob.findFirst({
    where: { category: category.toUpperCase() },
    orderBy: { createdAt: 'desc' },
    select: { jobNumber: true },
  });

  if (!lastJob || !lastJob.jobNumber.startsWith(`${prefix}-`)) {
    return `${prefix}-1001`;
  }

  const numPart = parseInt(lastJob.jobNumber.replace(`${prefix}-`, ''), 10);
  if (isNaN(numPart)) return `${prefix}-1001`;
  return `${prefix}-${numPart + 1}`;
}

// GET /api/jobs
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const editorId = searchParams.get('editorId');
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (id) {
      const job = await prisma.editingJob.findUnique({
        where: { id },
        include: {
          client: true,
          assignedEditor: { select: { id: true, name: true, role: true, email: true } },
          qcReviewer: { select: { id: true, name: true, role: true, email: true } },
        },
      });

      if (!job) {
        return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: job });
    }

    const andConditions: any[] = [];

    if (category && category !== 'ALL') {
      andConditions.push({ category: category.toUpperCase() });
    }
    if (editorId) {
      if (editorId === 'unassigned') {
        andConditions.push({ assignedEditorId: null });
      } else {
        andConditions.push({ assignedEditorId: editorId });
      }
    }
    if (clientId) {
      andConditions.push({ clientId });
    }
    if (status && status !== 'ALL') {
      andConditions.push({ status: status.toUpperCase() });
    }
    if (search) {
      andConditions.push({
        OR: [
          { jobNumber: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { serviceType: { contains: search, mode: 'insensitive' } },
          { client: { companyName: { contains: search, mode: 'insensitive' } } },
        ]
      });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    const jobs = await prisma.editingJob.findMany({
      where,
      include: {
        client: { select: { id: true, clientId: true, companyName: true, contactPerson: true } },
        assignedEditor: { select: { id: true, name: true, role: true } },
        qcReviewer: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: jobs });
  } catch (error) {
    console.error('Error fetching editing jobs:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/jobs
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      serviceType,
      category, // PHOTO or VIDEO
      clientId,
      totalImages,
      durationMinutes,
      deliverableNotes,
      assignedEditorId,
      qcReviewerId,
      receivedDate,
      deadlineDate,
      priority,
      status,
    } = body;

    if (!title || !serviceType || !clientId) {
      return NextResponse.json(
        { success: false, error: 'Title, Service Type, and Client are required' },
        { status: 400 }
      );
    }

    const finalCategory = (category || 'PHOTO').toUpperCase();
    const jobNumber = await generateJobNumber(finalCategory);

    const todayStr = new Date().toISOString().split('T')[0];

    const job = await prisma.editingJob.create({
      data: {
        jobNumber,
        title,
        serviceType,
        category: finalCategory,
        clientId,
        totalImages: totalImages ? parseInt(totalImages, 10) : 0,
        completedImages: 0,
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 0,
        deliverableNotes: deliverableNotes || null,
        assignedEditorId: assignedEditorId || null,
        qcReviewerId: qcReviewerId || null,
        receivedDate: receivedDate || todayStr,
        deadlineDate: deadlineDate || todayStr,
        priority: priority ? priority.toUpperCase() : 'MEDIUM',
        status: status ? status.toUpperCase() : (assignedEditorId ? 'ASSIGNED' : 'RECEIVED'),
        workLink: body.workLink || null,
        rawFilesLink: body.rawFilesLink || null,
        qcStatus: body.qcStatus || 'PENDING',
      },
      include: {
        client: true,
        assignedEditor: true,
      },
    });

    // ── Push to assigned editor's Task List ──────────────────────────────────
    if (job.assignedEditorId) {
      try {
        const adminUser = await prisma.user.findFirst({ where: { role: { in: ['ADMIN', 'admin'] } } });
        await prisma.task.create({
          data: {
            title: `Editing Job #${job.jobNumber}: ${job.title}`,
            description: `Client: ${job.client?.companyName || 'Client'} • Service: ${job.serviceType}. Raw assets attached.`,
            assignedToId: job.assignedEditorId,
            createdById: adminUser?.id || job.assignedEditorId,
            status: 'ASSIGNED',
            priority: job.priority || 'MEDIUM',
            dueDate: job.deadlineDate,
            rawFilesLink: job.rawFilesLink || null,
            workLink: job.workLink || null,
            editingJobId: job.id,
          },
        });

        await prisma.notification.create({
          data: {
            userId: job.assignedEditorId,
            text: `Job #${job.jobNumber} (${job.title}) has been assigned to your task list with raw folder link.`,
          },
        });
      } catch (taskErr) {
        console.warn('Error pushing task on job create:', taskErr);
      }
    }

    return NextResponse.json({ success: true, data: job });
  } catch (error) {
    console.error('Error creating editing job:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/jobs
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Job ID is required' }, { status: 400 });
    }

    const dataToUpdate: any = {};

    if (updateFields.title !== undefined) dataToUpdate.title = updateFields.title;
    if (updateFields.serviceType !== undefined) dataToUpdate.serviceType = updateFields.serviceType;
    if (updateFields.deadlineDate !== undefined) dataToUpdate.deadlineDate = updateFields.deadlineDate;
    if (updateFields.priority !== undefined) dataToUpdate.priority = updateFields.priority.toUpperCase();
    if (updateFields.deliverableNotes !== undefined) dataToUpdate.deliverableNotes = updateFields.deliverableNotes;
    
    // Link fields
    if (updateFields.workLink !== undefined) dataToUpdate.workLink = updateFields.workLink?.trim() || null;
    if (updateFields.rawFilesLink !== undefined) dataToUpdate.rawFilesLink = updateFields.rawFilesLink?.trim() || null;
    
    // QC Status fields
    if (updateFields.qcStatus !== undefined) {
      dataToUpdate.qcStatus = updateFields.qcStatus.toUpperCase();
      if (updateFields.qcStatus.toUpperCase() === 'APPROVED') {
        dataToUpdate.approvedAt = new Date();
      }
    }

    if (updateFields.assignedEditorId !== undefined) {
      dataToUpdate.assignedEditorId = updateFields.assignedEditorId ? updateFields.assignedEditorId : null;
      if (updateFields.assignedEditorId && !updateFields.status) {
        const currentJob = await prisma.editingJob.findUnique({ where: { id }, select: { status: true } });
        if (currentJob?.status === 'RECEIVED') {
          dataToUpdate.status = 'ASSIGNED';
        }
      }
    }
    if (updateFields.qcReviewerId !== undefined) {
      dataToUpdate.qcReviewerId = updateFields.qcReviewerId ? updateFields.qcReviewerId : null;
    }

    if (updateFields.totalImages !== undefined) {
      dataToUpdate.totalImages = parseInt(updateFields.totalImages, 10);
    }
    if (updateFields.completedImages !== undefined) {
      dataToUpdate.completedImages = parseInt(updateFields.completedImages, 10);
    }
    if (updateFields.durationMinutes !== undefined) {
      dataToUpdate.durationMinutes = parseInt(updateFields.durationMinutes, 10);
    }

    if (updateFields.status !== undefined) {
      dataToUpdate.status = updateFields.status.toUpperCase();
    }
    if (updateFields.qcNotes !== undefined) {
      dataToUpdate.qcNotes = updateFields.qcNotes;
    }
    if (updateFields.revisionNotes !== undefined) {
      dataToUpdate.revisionNotes = updateFields.revisionNotes;
    }

    const updated = await prisma.editingJob.update({
      where: { id },
      data: dataToUpdate,
      include: {
        client: true,
        assignedEditor: true,
        qcReviewer: true,
      },
    });

    // ── Task Sync & Notifications ───────────────────────────────────────────
    try {
      const editorName = updated.assignedEditor?.name || 'Editor';

      // 1. Sync corresponding Task in Employee's Task List
      const existingTask = await prisma.task.findFirst({
        where: { editingJobId: updated.id },
      });

      if (dataToUpdate.assignedEditorId) {
        if (existingTask) {
          await prisma.task.update({
            where: { id: existingTask.id },
            data: {
              assignedToId: dataToUpdate.assignedEditorId,
              title: `Editing Job #${updated.jobNumber}: ${updated.title}`,
              rawFilesLink: updated.rawFilesLink || existingTask.rawFilesLink,
              dueDate: updated.deadlineDate,
              priority: updated.priority,
              status: updated.status === 'DELIVERED' || updated.status === 'QC' ? 'COMPLETED' : 'ASSIGNED',
            },
          });
        } else {
          const adminUser = await prisma.user.findFirst({ where: { role: { in: ['ADMIN', 'admin'] } } });
          await prisma.task.create({
            data: {
              title: `Editing Job #${updated.jobNumber}: ${updated.title}`,
              description: `Client: ${updated.client?.companyName || 'Client'} • Service: ${updated.serviceType}. Raw assets attached.`,
              assignedToId: dataToUpdate.assignedEditorId,
              createdById: adminUser?.id || dataToUpdate.assignedEditorId,
              status: updated.status === 'DELIVERED' || updated.status === 'QC' ? 'COMPLETED' : 'ASSIGNED',
              priority: updated.priority || 'MEDIUM',
              dueDate: updated.deadlineDate,
              rawFilesLink: updated.rawFilesLink || null,
              workLink: updated.workLink || null,
              editingJobId: updated.id,
            },
          });
        }

        // Assignment notification to editor
        await prisma.notification.create({
          data: {
            userId: dataToUpdate.assignedEditorId,
            text: `Job #${updated.jobNumber} (${updated.title}) has been assigned to your task list.`,
          },
        });
      } else if (existingTask && (updateFields.rawFilesLink !== undefined || updateFields.workLink !== undefined || updateFields.deadlineDate !== undefined)) {
        await prisma.task.update({
          where: { id: existingTask.id },
          data: {
            rawFilesLink: updated.rawFilesLink,
            workLink: updated.workLink,
            dueDate: updated.deadlineDate,
          },
        });
      }

      // 2. Editor Submitted Work for QC / Review -> Notify All Admins
      if (updateFields.status === 'QC' || (updateFields.workLink && !updateFields.qcStatus)) {
        // Mark linked task as completed
        if (existingTask) {
          await prisma.task.update({
            where: { id: existingTask.id },
            data: {
              status: 'COMPLETED',
              workLink: updated.workLink,
              submissionNotes: updateFields.submissionNotes || 'Submitted for QC review',
            },
          });
        }

        // Notify Admins
        const admins = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'admin'] } } });
        for (const admin of admins) {
          await prisma.notification.create({
            data: {
              userId: admin.id,
              text: `🚀 ${editorName} submitted Job #${updated.jobNumber} (${updated.title}) for QC Review! Deliverables: ${updated.workLink || 'Attached in Job'}. Click to review & approve.`,
            },
          });
        }

        // Log in Activity Timeline
        try {
          await prisma.activityLog.create({
            data: {
              userId: updated.assignedEditorId || admins[0]?.id || null,
              category: 'PROJECTS',
              action: 'JOB_SUBMITTED_FOR_QC',
              entityType: 'JOB',
              entityId: updated.id,
              entityTitle: `Job #${updated.jobNumber}`,
              description: `${editorName} submitted deliverables for Job #${updated.jobNumber} (${updated.title}). Work Link: ${updated.workLink || 'Pending'}.`,
            },
          });
        } catch {}
      }

      // 3. Admin Approved work -> Notify Editor & Complete Task
      if (updated.assignedEditorId && (updateFields.qcStatus === 'APPROVED' || updateFields.status === 'FINAL_QC' || updateFields.status === 'DELIVERED')) {
        if (existingTask) {
          await prisma.task.update({
            where: { id: existingTask.id },
            data: { status: 'COMPLETED' },
          });
        }

        await prisma.notification.create({
          data: {
            userId: updated.assignedEditorId,
            text: `✅ Job #${updated.jobNumber} (${updated.title}) deliverables APPROVED by Admin!`,
          },
        });

        try {
          await prisma.activityLog.create({
            data: {
              userId: updated.assignedEditorId,
              category: 'PROJECTS',
              action: 'JOB_APPROVED',
              entityType: 'JOB',
              entityId: updated.id,
              entityTitle: `Job #${updated.jobNumber}`,
              description: `Deliverables for Job #${updated.jobNumber} (${updated.title}) have been approved.`,
            },
          });
        } catch {}
      }

      // 4. Admin requested Revision (Not OK) -> Notify Editor & Reopen Task
      if (updated.assignedEditorId && (updateFields.qcStatus === 'REVISION' || updateFields.status === 'REVISION')) {
        const notes = updateFields.revisionNotes || updateFields.qcNotes || 'Please check feedback';
        if (existingTask) {
          await prisma.task.update({
            where: { id: existingTask.id },
            data: { status: 'IN_PROGRESS' },
          });
        }

        await prisma.notification.create({
          data: {
            userId: updated.assignedEditorId,
            text: `⚠️ Revision requested for Job #${updated.jobNumber}: ${notes}`,
          },
        });

        try {
          await prisma.activityLog.create({
            data: {
              userId: updated.assignedEditorId,
              category: 'PROJECTS',
              action: 'JOB_REVISION_REQUESTED',
              entityType: 'JOB',
              entityId: updated.id,
              entityTitle: `Job #${updated.jobNumber}`,
              description: `Changes required for Job #${updated.jobNumber}: ${notes}`,
            },
          });
        } catch {}
      }
    } catch (notifErr) {
      console.warn('Task sync or notification error:', notifErr);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating editing job:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/jobs
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Job ID is required' }, { status: 400 });
    }

    await prisma.editingJob.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting editing job:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
