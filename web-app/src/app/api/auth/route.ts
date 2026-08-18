import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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

    // Compare hashed password
    // NOTE: Because passwords might be plaintext from previous setup, we check if they match directly first.
    // In a real migration we would require users to reset passwords, or re-hash on login.
    let isValid = false;
    if (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')) {
       isValid = await bcrypt.compare(password, user.passwordHash);
    } else {
       // Fallback for old plaintext passwords during migration
       isValid = user.passwordHash === password;
       // We can optionally hash it and save it now
       if (isValid) {
         const newHash = await bcrypt.hash(password, 10);
         await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash }});
       }
    }

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { userId: user.id, role: user.role.toLowerCase() },
      process.env.JWT_SECRET || 'fallback_secret',
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
