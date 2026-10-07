import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to generate payslip number (e.g. PAY-2026-10-001)
async function generatePayslipNumber(monthYear: string): Promise<string> {
  const prefix = `PAY-${monthYear}-`;

  const lastPayslip = await prisma.payslip.findFirst({
    where: {
      payslipNumber: {
        startsWith: prefix,
      },
    },
    orderBy: { createdAt: 'desc' },
    select: { payslipNumber: true },
  });

  if (!lastPayslip) {
    return `${prefix}001`;
  }

  const parts = lastPayslip.payslipNumber.split('-');
  const lastSeq = parseInt(parts[parts.length - 1], 10);
  const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}

// GET /api/finance/payroll
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const month = searchParams.get('month'); // YYYY-MM
    const userId = searchParams.get('userId');

    if (id) {
      const payslip = await prisma.payslip.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              salaryStructure: true,
            },
          },
        },
      });

      if (!payslip) {
        return NextResponse.json({ success: false, error: 'Payslip not found' }, { status: 404 });
      }

      const settings = await prisma.globalSettings.findUnique({ where: { id: 'default' } });

      return NextResponse.json({
        success: true,
        data: { ...payslip, companySettings: settings },
      });
    }

    const where: any = {};
    if (month) where.monthYear = month;
    if (userId) where.userId = userId;

    const payslips = await prisma.payslip.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            salaryStructure: true,
          },
        },
      },
      orderBy: [{ monthYear: 'desc' }, { createdAt: 'desc' }],
    });

    // Summary calculations
    const totalPayroll = payslips.reduce((sum, p) => sum + p.netSalary, 0);
    const paidPayroll = payslips.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.netSalary, 0);
    const pendingPayroll = payslips.filter(p => p.status !== 'PAID').reduce((sum, p) => sum + p.netSalary, 0);

    return NextResponse.json({
      success: true,
      data: payslips,
      summary: {
        totalPayroll,
        paidPayroll,
        pendingPayroll,
        count: payslips.length,
      },
    });
  } catch (error) {
    console.error('Error fetching payslips:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/finance/payroll (Generate / Calculate Payroll Run)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { monthYear, userIds, bonusOverrides = {}, notes } = body;

    if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
      return NextResponse.json({ success: false, error: 'Valid monthYear (YYYY-MM) is required' }, { status: 400 });
    }

    // Determine target users (exclude ADMIN since admins are strictly exempt from logging/pay calculations)
    const userQuery: any = {
      role: { not: 'ADMIN' },
    };
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      userQuery.id = { in: userIds };
    }

    const employees = await prisma.user.findMany({
      where: userQuery,
      include: {
        salaryStructure: true,
      },
    });

    if (employees.length === 0) {
      return NextResponse.json({ success: false, error: 'No eligible employees found' }, { status: 404 });
    }

    // Number of days in this month
    const [year, month] = monthYear.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const workingDays = 26; // Standard 26 working days (Sundays off)

    const generatedPayslips = [];

    for (const emp of employees) {
      const salaryStruct = emp.salaryStructure || {
        baseSalary: 25000,
        hourlyOvertimeRate: 150,
        allowance: 0,
        hraAllowance: 0,
        conveyanceAllowance: 0,
        medicalAllowance: 0,
        specialAllowance: 0,
        bonus: 0,
        pfAmount: 0,
        esiAmount: 0,
        professionalTax: 0,
        incomeTax: 0,
      };

      // 1. Fetch attendance records for this month
      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          userId: emp.id,
          date: { startsWith: monthYear },
        },
      });

      let presentDays = 0;
      let lateDays = 0;

      attendanceRecords.forEach((att) => {
        const status = (att.status || '').toLowerCase();
        if (status === 'present' || status === 'wfh') {
          presentDays += 1;
        } else if (status === 'half day') {
          presentDays += 0.5;
        } else if (status === 'late') {
          presentDays += 1;
          lateDays += 1;
        }
      });

      // If user had no manual check-ins recorded yet, default to working days (or leave as recorded)
      if (attendanceRecords.length === 0) {
        presentDays = workingDays;
      }

      // 2. Fetch approved leaves for this month
      const approvedLeaves = await prisma.leaveRequest.findMany({
        where: {
          userId: emp.id,
          status: 'Approved',
          startDate: { startsWith: monthYear },
        },
      });

      let paidLeaves = 0;
      let unpaidLeaves = 0;

      approvedLeaves.forEach((lv) => {
        const type = (lv.type || '').toLowerCase();
        if (type.includes('unpaid') || type.includes('lwp')) {
          unpaidLeaves += 1;
        } else {
          paidLeaves += 1;
        }
      });

      // 3. Fetch approved overtime hours for this month
      const approvedOT = await prisma.overtimeRequest.findMany({
        where: {
          userId: emp.id,
          status: 'APPROVED',
          date: { startsWith: monthYear },
        },
      });

      const overtimeHours = approvedOT.reduce((acc, ot) => acc + (ot.approvedHours || ot.hours || 0), 0);

      // Calculations
      const baseSalary = salaryStruct.baseSalary;
      const dailyRate = baseSalary / workingDays;
      const effectiveDays = Math.min(workingDays, presentDays + paidLeaves);
      const earnedBasic = Math.round(effectiveDays * dailyRate);

      // Earnings Breakdown
      const hraAllowance = salaryStruct.hraAllowance || 0;
      const conveyanceAllowance = salaryStruct.conveyanceAllowance || 0;
      const medicalAllowance = salaryStruct.medicalAllowance || 0;
      const specialAllowance = salaryStruct.specialAllowance || 0;
      const totalAllowances = (salaryStruct.allowance || 0) + hraAllowance + conveyanceAllowance + medicalAllowance + specialAllowance;

      const overtimePay = Math.round(overtimeHours * salaryStruct.hourlyOvertimeRate);
      const bonus = bonusOverrides[emp.id] || salaryStruct.bonus || 0;
      const grossEarnings = earnedBasic + totalAllowances + overtimePay + bonus;

      // Statutory Deductions
      const pfAmount = salaryStruct.pfAmount || 0;
      const esiAmount = salaryStruct.esiAmount || 0;
      const professionalTax = salaryStruct.professionalTax || 0;
      const incomeTax = salaryStruct.incomeTax || 0;
      const statutoryDeductions = pfAmount + esiAmount + professionalTax + incomeTax;

      // Deductions
      // Lateness: 3 lates grace, then 0.5 day deduction per extra late
      const excessLateDays = Math.max(0, lateDays - 3);
      const lateDeductions = Math.round(excessLateDays * (dailyRate * 0.5));
      const unpaidLeaveDeductions = Math.round(unpaidLeaves * dailyRate);
      const totalDeductions = lateDeductions + unpaidLeaveDeductions + statutoryDeductions;
      const netSalary = Math.max(0, grossEarnings - totalDeductions);

      // Check if payslip already exists for this user and month
      const existing = await prisma.payslip.findFirst({
        where: {
          userId: emp.id,
          monthYear,
        },
      });

      let payslip;
      if (existing) {
        payslip = await prisma.payslip.update({
          where: { id: existing.id },
          data: {
            daysInMonth,
            workingDays,
            presentDays,
            paidLeaves,
            unpaidLeaves,
            overtimeHours,
            lateDays,
            baseSalary,
            earnedBasic,
            allowances: totalAllowances,
            overtimePay,
            bonus,
            grossEarnings,
            lateDeductions,
            unpaidLeaveDeductions,
            otherDeductions: statutoryDeductions,
            totalDeductions,
            netSalary,
            notes: notes || existing.notes,
          },
          include: {
            user: { select: { id: true, name: true, email: true, role: true, salaryStructure: true } },
          },
        });
      } else {
        const payslipNumber = await generatePayslipNumber(monthYear);
        payslip = await prisma.payslip.create({
          data: {
            payslipNumber,
            userId: emp.id,
            monthYear,
            daysInMonth,
            workingDays,
            presentDays,
            paidLeaves,
            unpaidLeaves,
            overtimeHours,
            lateDays,
            baseSalary,
            earnedBasic,
            allowances: totalAllowances,
            overtimePay,
            bonus,
            grossEarnings,
            lateDeductions,
            unpaidLeaveDeductions,
            otherDeductions: statutoryDeductions,
            totalDeductions,
            netSalary,
            status: 'GENERATED',
            notes: notes || 'Standard monthly payroll run',
          },
          include: {
            user: { select: { id: true, name: true, email: true, role: true, salaryStructure: true } },
          },
        });
      }

      generatedPayslips.push(payslip);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${generatedPayslips.length} payslips for ${monthYear}`,
      data: generatedPayslips,
    });
  } catch (error) {
    console.error('Error generating payroll:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate payroll' }, { status: 500 });
  }
}

// PATCH /api/finance/payroll
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, paymentDate, paymentReference, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Payslip ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (paymentDate !== undefined) updateData.paymentDate = paymentDate;
    if (paymentReference !== undefined) updateData.paymentReference = paymentReference;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.payslip.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating payslip:', error);
    return NextResponse.json({ success: false, error: 'Failed to update payslip' }, { status: 500 });
  }
}

// DELETE /api/finance/payroll?id=... or ?all=true
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all');

    if (all === 'true') {
      const deleted = await prisma.payslip.deleteMany({});
      return NextResponse.json({ success: true, count: deleted.count });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Payslip ID is required or use all=true' }, { status: 400 });
    }

    await prisma.payslip.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payslip:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete payslip' }, { status: 500 });
  }
}
