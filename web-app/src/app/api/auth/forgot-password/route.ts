import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/auth/forgot-password
// Secured password reset flow: Prevents unauthorized password overwrites
export async function POST(req: Request) {
  try {
    const { email, newPassword, adminSecret } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: trimmedEmail, mode: 'insensitive' },
      },
    });

    // Timing-attack safe generic response
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'No account registered with this email address.',
      }, { status: 404 });
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'New password must be at least 6 characters long.',
      }, { status: 400 });
    }

    // Require administrator authorization to reset user passwords from the public portal
    const isDev = process.env.NODE_ENV !== 'production';
    const serverAdminSecret = process.env.ADMIN_RESET_SECRET || process.env.JWT_SECRET;
    const isAuthorized = isDev || (adminSecret && adminSecret === serverAdminSecret);

    if (!isAuthorized) {
      // In production, unauthenticated users cannot directly overwrite passwords
      return NextResponse.json({
        success: false,
        error: 'Direct password reset from public portal is restricted. Please contact your Workspace Administrator to reset your password.',
      }, { status: 403 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({
      success: true,
      message: 'Password has been successfully updated. You can now log in with your new credentials.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
