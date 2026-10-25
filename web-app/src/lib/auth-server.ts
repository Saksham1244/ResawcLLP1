import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  userId: string;
  role: string;
}

export function getAuthUser(req: Request | NextRequest): AuthUser | null {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader) return null;

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return null;

    const secret = process.env.JWT_SECRET;
    if (!secret) return null;

    const decoded = jwt.verify(token, secret) as { userId?: string; role?: string };
    if (!decoded || !decoded.userId) return null;

    return {
      userId: decoded.userId,
      role: (decoded.role || '').toLowerCase(),
    };
  } catch {
    return null;
  }
}

export function requireAdmin(req: Request | NextRequest): { authorized: boolean; user?: AuthUser } {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return { authorized: false };
  }
  return { authorized: true, user };
}
