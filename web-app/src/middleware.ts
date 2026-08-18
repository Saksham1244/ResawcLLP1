import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose'; // Next.js middleware requires Edge-compatible 'jose', not 'jsonwebtoken'

export async function middleware(req: NextRequest) {
  // Only protect /api routes, exclude /api/auth and /api/monitor/sync (has its own auth)
  if (req.nextUrl.pathname.startsWith('/api/auth') || req.nextUrl.pathname.startsWith('/api/monitor/sync')) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }
  
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 403 });
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
