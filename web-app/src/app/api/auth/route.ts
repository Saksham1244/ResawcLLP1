import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    // Look up user by email (case-insensitive)
    const user = await prisma.user.findFirst({ 
      where: { 
        email: { equals: email, mode: 'insensitive' } 
      } 
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.passwordHash !== password) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    // Auto-record system login time in attendance
    const d = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const timeNow = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

    const existingAtt = await prisma.attendance.findFirst({ where: { userId: user.id, date: today } });
    if (existingAtt) {
      // Update systemLoginTime if not already set
      if (!existingAtt.systemLoginTime) {
        await prisma.attendance.update({
          where: { id: existingAtt.id },
          data: { systemLoginTime: timeNow }
        });
      }
    } else {
      await prisma.attendance.create({
        data: {
          userId: user.id,
          date: today,
          timeIn: timeNow,
          systemLoginTime: timeNow,
          status: 'Present',
        }
      });
    }


    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase()
      },
      token: `mock-token-${user.id}`
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
