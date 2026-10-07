import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET all users (for team page and payroll)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        salaryStructure: true,
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST create new user with employee settings
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      role,
      phone,
      dob,
      doj,
      designation,
      location,
      panNumber,
      bankName,
      bankAccountNumber,
      ifscCode,
      uanNumber,
      esiNumber,
      upiId,
      baseSalary,
      hourlyOvertimeRate,
      allowance,
    } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ success: false, error: 'Name, email, password, and role are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'A user with this email already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role.toUpperCase(),
        phone: phone || null,
        salaryStructure: {
          create: {
            dob: dob || null,
            doj: doj || null,
            designation: designation || null,
            location: location || null,
            panNumber: panNumber || null,
            bankName: bankName || null,
            bankAccountNumber: bankAccountNumber || null,
            ifscCode: ifscCode || null,
            uanNumber: uanNumber || null,
            esiNumber: esiNumber || null,
            upiId: upiId || null,
            baseSalary: parseFloat(baseSalary) || 25000,
            hourlyOvertimeRate: parseFloat(hourlyOvertimeRate) || 150,
            allowance: parseFloat(allowance) || 0,
            hraAllowance: parseFloat(body.hraAllowance) || 0,
            conveyanceAllowance: parseFloat(body.conveyanceAllowance) || 0,
            medicalAllowance: parseFloat(body.medicalAllowance) || 0,
            specialAllowance: parseFloat(body.specialAllowance) || 0,
            bonus: parseFloat(body.bonus) || 0,
            pfAmount: parseFloat(body.pfAmount) || 0,
            esiAmount: parseFloat(body.esiAmount) || 0,
            professionalTax: parseFloat(body.professionalTax) || 0,
            incomeTax: parseFloat(body.incomeTax) || 0,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        salaryStructure: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ success: false, error: 'Failed to create user' }, { status: 500 });
  }
}

// PATCH update user details, role, and salary structure
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      role,
      name,
      email,
      phone,
      password,
      dob,
      doj,
      designation,
      location,
      panNumber,
      bankName,
      bankAccountNumber,
      ifscCode,
      uanNumber,
      esiNumber,
      upiId,
      baseSalary,
      hourlyOvertimeRate,
      allowance,
      hraAllowance,
      conveyanceAllowance,
      medicalAllowance,
      specialAllowance,
      bonus,
      pfAmount,
      esiAmount,
      professionalTax,
      incomeTax,
    } = body;

    if (!id) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

    const userData: any = {};
    if (role) userData.role = role.toUpperCase();
    if (name) userData.name = name;
    if (email) userData.email = email;
    if (phone !== undefined) userData.phone = phone;
    if (password) {
      userData.passwordHash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(userData).length > 0) {
      await prisma.user.update({
        where: { id },
        data: userData,
      });
    }

    // Check if any salary / statutory profile fields were sent
    const hasStructureFields = [
      dob,
      doj,
      designation,
      location,
      panNumber,
      bankName,
      bankAccountNumber,
      ifscCode,
      uanNumber,
      esiNumber,
      upiId,
      baseSalary,
      hourlyOvertimeRate,
      allowance,
      hraAllowance,
      conveyanceAllowance,
      medicalAllowance,
      specialAllowance,
      bonus,
      pfAmount,
      esiAmount,
      professionalTax,
      incomeTax,
    ].some((v) => v !== undefined);

    if (hasStructureFields) {
      await prisma.employeeSalaryStructure.upsert({
        where: { userId: id },
        create: {
          userId: id,
          dob: dob || null,
          doj: doj || null,
          designation: designation || null,
          location: location || null,
          panNumber: panNumber || null,
          bankName: bankName || null,
          bankAccountNumber: bankAccountNumber || null,
          ifscCode: ifscCode || null,
          uanNumber: uanNumber || null,
          esiNumber: esiNumber || null,
          upiId: upiId || null,
          baseSalary: baseSalary !== undefined ? parseFloat(baseSalary) || 25000 : 25000,
          hourlyOvertimeRate: hourlyOvertimeRate !== undefined ? parseFloat(hourlyOvertimeRate) || 150 : 150,
          allowance: allowance !== undefined ? parseFloat(allowance) || 0 : 0,
          hraAllowance: hraAllowance !== undefined ? parseFloat(hraAllowance) || 0 : 0,
          conveyanceAllowance: conveyanceAllowance !== undefined ? parseFloat(conveyanceAllowance) || 0 : 0,
          medicalAllowance: medicalAllowance !== undefined ? parseFloat(medicalAllowance) || 0 : 0,
          specialAllowance: specialAllowance !== undefined ? parseFloat(specialAllowance) || 0 : 0,
          bonus: bonus !== undefined ? parseFloat(bonus) || 0 : 0,
          pfAmount: pfAmount !== undefined ? parseFloat(pfAmount) || 0 : 0,
          esiAmount: esiAmount !== undefined ? parseFloat(esiAmount) || 0 : 0,
          professionalTax: professionalTax !== undefined ? parseFloat(professionalTax) || 0 : 0,
          incomeTax: incomeTax !== undefined ? parseFloat(incomeTax) || 0 : 0,
        },
        update: {
          dob: dob !== undefined ? (dob || null) : undefined,
          doj: doj !== undefined ? (doj || null) : undefined,
          designation: designation !== undefined ? (designation || null) : undefined,
          location: location !== undefined ? (location || null) : undefined,
          panNumber: panNumber !== undefined ? (panNumber || null) : undefined,
          bankName: bankName !== undefined ? (bankName || null) : undefined,
          bankAccountNumber: bankAccountNumber !== undefined ? (bankAccountNumber || null) : undefined,
          ifscCode: ifscCode !== undefined ? (ifscCode || null) : undefined,
          uanNumber: uanNumber !== undefined ? (uanNumber || null) : undefined,
          esiNumber: esiNumber !== undefined ? (esiNumber || null) : undefined,
          upiId: upiId !== undefined ? (upiId || null) : undefined,
          baseSalary: baseSalary !== undefined ? parseFloat(baseSalary) || 0 : undefined,
          hourlyOvertimeRate: hourlyOvertimeRate !== undefined ? parseFloat(hourlyOvertimeRate) || 0 : undefined,
          allowance: allowance !== undefined ? parseFloat(allowance) || 0 : undefined,
          hraAllowance: hraAllowance !== undefined ? parseFloat(hraAllowance) || 0 : undefined,
          conveyanceAllowance: conveyanceAllowance !== undefined ? parseFloat(conveyanceAllowance) || 0 : undefined,
          medicalAllowance: medicalAllowance !== undefined ? parseFloat(medicalAllowance) || 0 : undefined,
          specialAllowance: specialAllowance !== undefined ? parseFloat(specialAllowance) || 0 : undefined,
          bonus: bonus !== undefined ? parseFloat(bonus) || 0 : undefined,
          pfAmount: pfAmount !== undefined ? parseFloat(pfAmount) || 0 : undefined,
          esiAmount: esiAmount !== undefined ? parseFloat(esiAmount) || 0 : undefined,
          professionalTax: professionalTax !== undefined ? parseFloat(professionalTax) || 0 : undefined,
          incomeTax: incomeTax !== undefined ? parseFloat(incomeTax) || 0 : undefined,
        },
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        salaryStructure: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE a user
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
  }
}
