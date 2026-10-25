import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    // Look up user by email (case-insensitive)
    const user = await prisma.user.findFirst({ 
      where: { 
        email: { equals: email.trim(), mode: 'insensitive' } 
      } 
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    // Compare hashed password
    let isValid = false;
    if (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')) {
       isValid = await bcrypt.compare(password, user.passwordHash);
    } else {
       // Support one-time auto-upgrade of legacy plaintext passwords
       isValid = user.passwordHash === password;
       if (isValid) {
         const newHash = await bcrypt.hash(password, 10);
         await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash }});
       }
    }

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate JWT Token
    if (!process.env.JWT_SECRET) {
      console.error('[Auth] JWT_SECRET environment variable is not set');
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role.toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase()
      },
      token: token
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
