import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to generate next client ID (e.g. CL-1001)
async function generateClientId(): Promise<string> {
  const lastClient = await prisma.client.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { clientId: true },
  });

  if (!lastClient || !lastClient.clientId.startsWith('CL-')) {
    return 'CL-1001';
  }

  const numPart = parseInt(lastClient.clientId.replace('CL-', ''), 10);
  if (isNaN(numPart)) return 'CL-1001';
  return `CL-${numPart + 1}`;
}

// Helper to generate next job number (ED-1001 or VD-1001)
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

// POST /api/leads/convert
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      leadId,
      userId,
      companyName,
      contactPerson,
      phone,
      email,
      notes,
      orderType, // 'SAMPLE' | 'ORDER' | 'NONE'
      createSampleJob, // backwards compatibility
      sampleJobCategory,
      sampleJobService,
      sampleJobImages,
      sampleJobEditorId,
      sampleJobDeadline,
      jobTitle,
      durationMinutes,
      deliverableNotes,
    } = body;

    if (!leadId) {
      return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const finalCompany = (companyName || lead.company || lead.name).trim();
    const finalContact = (contactPerson || lead.name).trim();
    const finalPhone = (phone || lead.phone || '').trim() || null;
    const finalEmail = (email || lead.email || '').trim() || null;

    // Determine workflow mode
    const isSample = orderType === 'SAMPLE' || (createSampleJob === true && orderType !== 'ORDER');
    const isDirectOrder = orderType === 'ORDER';
    const shouldCreateJob = isSample || isDirectOrder;

    const clientStatus = isSample ? 'TRIAL' : 'ACTIVE';

    // 1. Create or Find Client
    let client = await prisma.client.findFirst({
      where: {
        OR: [
          { companyName: { equals: finalCompany, mode: 'insensitive' as const } },
          ...(finalEmail ? [{ email: { equals: finalEmail, mode: 'insensitive' as const } }] : []),
        ],
      },
    });

    if (!client) {
      const nextClientId = await generateClientId();
      client = await prisma.client.create({
        data: {
          clientId: nextClientId,
          companyName: finalCompany,
          contactPerson: finalContact,
          phone: finalPhone,
          email: finalEmail,
          country: 'India',
          currency: 'INR',
          paymentTerms: 'Due on Receipt',
          status: clientStatus,
          notes: notes || lead.notes || null,
          assignedMarketingId: userId || lead.assignedToId || null,
        },
      });
    } else {
      // Update existing client to ACTIVE or TRIAL
      client = await prisma.client.update({
        where: { id: client.id },
        data: {
          status: clientStatus,
          country: 'India',
          currency: 'INR',
        },
      });
    }

    // 2. Mark Lead as CONVERTED
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: 'CONVERTED' },
    });

    // 3. Create Sample or Direct Order Job if requested
    let createdJob = null;
    if (shouldCreateJob) {
      const cat = (sampleJobCategory || 'PHOTO').toUpperCase();
      const nextJobNumber = await generateJobNumber(cat);
      const todayStr = new Date().toISOString().split('T')[0];
      const deadline = sampleJobDeadline || new Date(Date.now() + (isSample ? 2 : 4) * 86400000).toISOString().split('T')[0];
      
      const defaultImgs = isSample ? 25 : 500;
      const totalImgs = cat === 'PHOTO' ? (sampleJobImages ? parseInt(sampleJobImages, 10) : defaultImgs) : 0;
      const totalDuration = cat === 'VIDEO' ? (durationMinutes ? parseInt(durationMinutes, 10) : 3) : null;

      const title = jobTitle || (isSample 
        ? `Trial Sample - ${finalCompany}` 
        : `Production Order - ${finalCompany}`);

      const service = sampleJobService || (cat === 'PHOTO' 
        ? (isSample ? 'Trial Photo Edit' : 'Wedding Batch Photo Editing') 
        : (isSample ? 'Trial Video Teaser Reel' : 'Cinematic Wedding Film'));

      createdJob = await prisma.editingJob.create({
        data: {
          jobNumber: nextJobNumber,
          title,
          serviceType: service,
          category: cat,
          clientId: client.id,
          totalImages: totalImgs,
          completedImages: 0,
          durationMinutes: totalDuration,
          assignedEditorId: sampleJobEditorId || null,
          receivedDate: todayStr,
          deadlineDate: deadline,
          priority: isSample ? 'HIGH' : 'MEDIUM',
          status: sampleJobEditorId ? 'ASSIGNED' : 'RECEIVED',
          deliverableNotes: deliverableNotes || (isSample 
            ? 'Client Trial Sample Job created upon Lead Conversion.' 
            : 'Direct Production Order created upon Lead Conversion.'),
        },
        include: {
          assignedEditor: { select: { id: true, name: true, role: true } },
        },
      });

      // If an editor was assigned, send them a notification
      if (sampleJobEditorId) {
        try {
          await prisma.notification.create({
            data: {
              userId: sampleJobEditorId,
              text: `New ${isSample ? 'Sample' : 'Production'} Job #${nextJobNumber} assigned to you for client "${finalCompany}".`,
            },
          });
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      message: `Lead successfully converted to Client ${client.clientId}${createdJob ? ` with Job #${createdJob.jobNumber}` : ''}`,
      client,
      job: createdJob,
    });
  } catch (error) {
    console.error('Error converting lead:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
