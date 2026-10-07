import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/finance/salary-structure
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (userId) {
      let structure = await prisma.employeeSalaryStructure.findUnique({
        where: { userId },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      });

      if (!structure) {
        // Create default structure if none exists
        structure = await prisma.employeeSalaryStructure.create({
          data: {
            userId,
            baseSalary: 25000,
            hourlyOvertimeRate: 150,
            allowance: 0,
          },
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        });
      }

      return NextResponse.json({ success: true, data: structure });
    }

    // Return structures for all users
    const users = await prisma.user.findMany({
      where: {
        role: { not: 'ADMIN' }, // Admins don't have salary logging
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        salaryStructure: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching salary structures:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/finance/salary-structure
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      baseSalary,
      hourlyOvertimeRate,
      allowance,
      bankName,
      bankAccountNumber,
      ifscCode,
      panNumber,
      upiId,
      dob,
      doj,
      designation,
      location,
      uanNumber,
      esiNumber,
    } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const structure = await prisma.employeeSalaryStructure.upsert({
      where: { userId },
      create: {
        userId,
        baseSalary: parseFloat(baseSalary) || 25000,
        hourlyOvertimeRate: parseFloat(hourlyOvertimeRate) || 150,
        allowance: parseFloat(allowance) || 0,
        bankName: bankName || '',
        bankAccountNumber: bankAccountNumber || '',
        ifscCode: ifscCode || '',
        panNumber: panNumber || '',
        upiId: upiId || '',
        dob: dob || '',
        doj: doj || '',
        designation: designation || '',
        location: location || '',
        uanNumber: uanNumber || '',
        esiNumber: esiNumber || '',
      },
      update: {
        baseSalary: parseFloat(baseSalary) || 25000,
        hourlyOvertimeRate: parseFloat(hourlyOvertimeRate) || 150,
        allowance: parseFloat(allowance) || 0,
        bankName: bankName !== undefined ? bankName : undefined,
        bankAccountNumber: bankAccountNumber !== undefined ? bankAccountNumber : undefined,
        ifscCode: ifscCode !== undefined ? ifscCode : undefined,
        panNumber: panNumber !== undefined ? panNumber : undefined,
        upiId: upiId !== undefined ? upiId : undefined,
        dob: dob !== undefined ? dob : undefined,
        doj: doj !== undefined ? doj : undefined,
        designation: designation !== undefined ? designation : undefined,
        location: location !== undefined ? location : undefined,
        uanNumber: uanNumber !== undefined ? uanNumber : undefined,
        esiNumber: esiNumber !== undefined ? esiNumber : undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return NextResponse.json({ success: true, data: structure });
  } catch (error) {
    console.error('Error updating salary structure:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
