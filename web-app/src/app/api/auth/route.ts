import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Mock backend check for mobile app login
    if (email.trim().toUpperCase() === 'ADMIN' && password === 'Admin@123') {
      return NextResponse.json({
        success: true,
        user: {
          id: 1,
          name: 'Admin',
          email: 'admin@resawc.com',
          role: 'ADMIN'
        },
        token: 'mock-jwt-token-123'
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid ID or Password' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
