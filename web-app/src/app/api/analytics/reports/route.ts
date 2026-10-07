import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'all'; // 'month', 'quarter', 'year', 'all'

    // 1. INVOICES & FINANCIAL METRICS
    const invoices = await prisma.invoice.findMany({
      include: {
        client: { select: { id: true, companyName: true, clientId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalTaxAmount = 0;

    const monthlyRevenueMap: Record<string, { month: string; billed: number; collected: number; count: number }> = {};
    const invoiceStatusCount: Record<string, number> = { PAID: 0, SENT: 0, DRAFT: 0, OVERDUE: 0, PARTIALLY_PAID: 0 };
    const clientRevenueMap: Record<string, { clientId: string; companyName: string; billed: number; paid: number; jobs: number }> = {};

    invoices.forEach((inv) => {
      totalBilled += inv.totalAmount;
      totalCollected += inv.amountPaid;
      totalOutstanding += Math.max(0, inv.totalAmount - inv.amountPaid);
      totalTaxAmount += inv.taxAmount;

      const st = inv.status.toUpperCase();
      invoiceStatusCount[st] = (invoiceStatusCount[st] || 0) + 1;

      // Monthly aggregation (using issueDate YYYY-MM or createdAt)
      const mKey = inv.issueDate?.slice(0, 7) || inv.createdAt.toISOString().slice(0, 7);
      if (!monthlyRevenueMap[mKey]) {
        monthlyRevenueMap[mKey] = { month: mKey, billed: 0, collected: 0, count: 0 };
      }
      monthlyRevenueMap[mKey].billed += inv.totalAmount;
      monthlyRevenueMap[mKey].collected += inv.amountPaid;
      monthlyRevenueMap[mKey].count += 1;

      // Client aggregation
      if (inv.clientId && inv.client) {
        if (!clientRevenueMap[inv.clientId]) {
          clientRevenueMap[inv.clientId] = {
            clientId: inv.client.clientId,
            companyName: inv.client.companyName,
            billed: 0,
            paid: 0,
            jobs: 0,
          };
        }
        clientRevenueMap[inv.clientId].billed += inv.totalAmount;
        clientRevenueMap[inv.clientId].paid += inv.amountPaid;
      }
    });

    const monthlyRevenueTrend = Object.values(monthlyRevenueMap).sort((a, b) => a.month.localeCompare(b.month));
    const topClientsByRevenue = Object.values(clientRevenueMap)
      .sort((a, b) => b.billed - a.billed)
      .slice(0, 6);

    // 2. EDITING JOBS & PRODUCTION METRICS
    const jobs = await prisma.editingJob.findMany({
      include: {
        client: { select: { id: true, companyName: true, clientId: true } },
        assignedEditor: { select: { id: true, name: true, role: true } },
      },
    });

    let totalJobs = jobs.length;
    let deliveredJobs = 0;
    let inProgressJobs = 0;
    let totalPhotosTarget = 0;
    let totalPhotosCompleted = 0;
    let totalVideoMinutes = 0;
    let overdueJobs = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const jobStatusMap: Record<string, number> = {};
    const categoryMap: Record<string, number> = { PHOTO: 0, VIDEO: 0, REEL: 0 };
    const editorPerformanceMap: Record<string, { id: string; name: string; role: string; assignedCount: number; deliveredCount: number; photosCompleted: number; videoMinutes: number }> = {};

    jobs.forEach((job) => {
      const st = job.status.toUpperCase();
      jobStatusMap[st] = (jobStatusMap[st] || 0) + 1;

      const cat = (job.category || 'PHOTO').toUpperCase();
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;

      totalPhotosTarget += job.totalImages || 0;
      totalPhotosCompleted += job.completedImages || 0;
      totalVideoMinutes += job.durationMinutes || 0;

      if (st === 'DELIVERED') {
        deliveredJobs += 1;
      } else {
        inProgressJobs += 1;
        if (job.deadlineDate && job.deadlineDate < todayStr) {
          overdueJobs += 1;
        }
      }

      // Update client jobs count in clientRevenueMap
      if (job.clientId && clientRevenueMap[job.clientId]) {
        clientRevenueMap[job.clientId].jobs += 1;
      }

      // Editor throughput
      if (job.assignedEditorId && job.assignedEditor) {
        const edId = job.assignedEditorId;
        if (!editorPerformanceMap[edId]) {
          editorPerformanceMap[edId] = {
            id: edId,
            name: job.assignedEditor.name,
            role: job.assignedEditor.role,
            assignedCount: 0,
            deliveredCount: 0,
            photosCompleted: 0,
            videoMinutes: 0,
          };
        }
        editorPerformanceMap[edId].assignedCount += 1;
        if (st === 'DELIVERED') editorPerformanceMap[edId].deliveredCount += 1;
        editorPerformanceMap[edId].photosCompleted += job.completedImages || 0;
        editorPerformanceMap[edId].videoMinutes += job.durationMinutes || 0;
      }
    });

    const editorLeaderboard = Object.values(editorPerformanceMap).sort((a, b) => b.photosCompleted - a.photosCompleted);

    // 3. MARKETING & PIPELINE METRICS
    const leads = await prisma.lead.findMany();
    const totalLeads = leads.length;
    const leadFunnel: Record<string, number> = { NEW: 0, CONTACTED: 0, TRIAL: 0, CONVERTED: 0 };

    leads.forEach((l) => {
      const st = (l.status || 'NEW').toUpperCase();
      leadFunnel[st] = (leadFunnel[st] || 0) + 1;
    });

    const conversionRate = totalLeads > 0 ? Math.round(((leadFunnel.CONVERTED || 0) / totalLeads) * 100) : 0;
    const followUps = await prisma.marketingFollowUp.findMany();
    const followUpsDone = followUps.filter(f => f.status === 'COMPLETED').length;

    // 4. HR & PAYROLL METRICS
    const teamMembers = await prisma.user.findMany({
      where: { role: { not: 'ADMIN' } },
      select: { id: true, name: true, role: true },
    });

    const overtimeRequests = await prisma.overtimeRequest.findMany();
    const totalOtHours = overtimeRequests.reduce((sum, ot) => sum + (ot.hours || 0), 0);
    const approvedOtHours = overtimeRequests.filter(ot => ot.status === 'APPROVED').reduce((sum, ot) => sum + (ot.approvedHours || ot.hours || 0), 0);

    const payslips = await prisma.payslip.findMany();
    const totalPayrollSpent = payslips.reduce((sum, p) => sum + p.netSalary, 0);

    return NextResponse.json({
      success: true,
      data: {
        finance: {
          totalBilled,
          totalCollected,
          totalOutstanding,
          collectionRate: totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100,
          totalTaxAmount,
          cgstAmount: Math.round(totalTaxAmount / 2),
          sgstAmount: Math.round(totalTaxAmount / 2),
          invoiceStatusCount,
          monthlyRevenueTrend,
          topClientsByRevenue,
        },
        production: {
          totalJobs,
          deliveredJobs,
          inProgressJobs,
          overdueJobs,
          deliveryRate: totalJobs > 0 ? Math.round((deliveredJobs / totalJobs) * 100) : 0,
          totalPhotosTarget,
          totalPhotosCompleted,
          totalVideoMinutes,
          categoryBreakdown: categoryMap,
          statusPipeline: jobStatusMap,
          editorLeaderboard,
        },
        marketing: {
          totalLeads,
          funnel: leadFunnel,
          conversionRate,
          totalFollowUps: followUps.length,
          followUpsDone,
        },
        team: {
          totalEmployees: teamMembers.length,
          totalOtHours,
          approvedOtHours,
          totalPayrollSpent,
          payslipsGenerated: payslips.length,
        },
      },
    });
  } catch (error) {
    console.error('Error generating analytics report:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate analytics report' }, { status: 500 });
  }
}
