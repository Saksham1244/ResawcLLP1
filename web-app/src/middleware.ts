import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose'; // Edge-compatible JWT verification

// ─── Rate Limiter Engine with Exponential Backoff ────────────────────────────
interface RateLimitRecord {
  count: number;
  windowStart: number;
  violations: number;   // Consecutive rate limit violations count
  blockedUntil: number; // Timestamp until which client is blocked
}

// In-memory sliding window cache per client IP/route category
const rateLimitMap = new Map<string, RateLimitRecord>();

let lastCleanup = Date.now();
function cleanupStaleRecords(now: number) {
  if (now - lastCleanup > 5 * 60 * 1000) {
    lastCleanup = now;
    for (const [key, record] of rateLimitMap.entries()) {
      if (now - record.windowStart > 10 * 60 * 1000 && now > record.blockedUntil) {
        rateLimitMap.delete(key);
      }
    }
  }
}

// Config per route type
function getRateLimitConfig(pathname: string): {
  limit: number;
  windowMs: number;
  baseBackoffSec: number;
  maxBackoffSec: number;
} {
  // 1. Auth routes (brute-force defense): 15 req / min
  if (pathname.startsWith('/api/auth')) {
    return { limit: 15, windowMs: 60 * 1000, baseBackoffSec: 2, maxBackoffSec: 60 };
  }
  // 2. High-frequency telemetry & polling routes: 120 req / min (supports 5s polling)
  if (
    pathname.startsWith('/api/monitor/sync') ||
    pathname.startsWith('/api/notifications') ||
    pathname.startsWith('/api/chat/messages')
  ) {
    return { limit: 120, windowMs: 60 * 1000, baseBackoffSec: 1, maxBackoffSec: 30 };
  }
  // 3. All standard API routes (leads, tasks, attendance, users, settings, overview): 60 req / min
  return { limit: 60, windowMs: 60 * 1000, baseBackoffSec: 1, maxBackoffSec: 60 };
}

function checkRateLimit(req: NextRequest): {
  allowed: boolean;
  retryAfter?: number;
  violations?: number;
  headers: Record<string, string>;
} {
  const now = Date.now();
  cleanupStaleRecords(now);

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const pathname = req.nextUrl.pathname;
  const config = getRateLimitConfig(pathname);
  const routeCategory = pathname.startsWith('/api/auth')
    ? 'auth'
    : pathname.startsWith('/api/monitor')
    ? 'monitor'
    : 'api';
  const key = `${ip}:${routeCategory}`;

  let record = rateLimitMap.get(key);
  if (!record) {
    record = {
      count: 0,
      windowStart: now,
      violations: 0,
      blockedUntil: 0,
    };
    rateLimitMap.set(key, record);
  }

  // 1. Check if client is currently in an exponential backoff penalty block
  if (now < record.blockedUntil) {
    const retryAfter = Math.max(1, Math.ceil((record.blockedUntil - now) / 1000));
    return {
      allowed: false,
      retryAfter,
      violations: record.violations,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(config.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(record.blockedUntil / 1000)),
        'X-RateLimit-Backoff': String(retryAfter),
      },
    };
  }

  // 2. Check if sliding window has expired
  if (now - record.windowStart > config.windowMs) {
    record.count = 0;
    record.windowStart = now;
    // Gradually decay violation level if client waited out window
    record.violations = Math.max(0, record.violations - 1);
  }

  // 3. Increment request count
  record.count += 1;

  // 4. Check if limit exceeded -> apply exponential backoff penalty
  if (record.count > config.limit) {
    record.violations += 1;
    // Exponential backoff formula: baseBackoff * 2^(violations - 1)
    const backoffSec = Math.min(
      config.maxBackoffSec,
      config.baseBackoffSec * Math.pow(2, record.violations - 1)
    );
    record.blockedUntil = now + backoffSec * 1000;

    return {
      allowed: false,
      retryAfter: backoffSec,
      violations: record.violations,
      headers: {
        'Retry-After': String(backoffSec),
        'X-RateLimit-Limit': String(config.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(record.blockedUntil / 1000)),
        'X-RateLimit-Backoff': String(backoffSec),
      },
    };
  }

  // 5. Request allowed
  const remaining = Math.max(0, config.limit - record.count);
  const resetTime = Math.ceil((record.windowStart + config.windowMs) / 1000);

  return {
    allowed: true,
    headers: {
      'X-RateLimit-Limit': String(config.limit),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(resetTime),
    },
  };
}

export async function middleware(req: NextRequest) {
  // ── Step 1: Rate Limiting with Exponential Backoff on ALL /api routes ────────
  const rateLimit = checkRateLimit(req);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Exponential backoff penalty is active.',
        retryAfter: rateLimit.retryAfter,
        violations: rateLimit.violations,
      },
      {
        status: 429,
        headers: rateLimit.headers,
      }
    );
  }

  // ── Step 2: Route Auth Protection ──────────────────────────────────────────
  // Routes with custom auth handlers: /api/auth and /api/monitor/sync
  if (
    req.nextUrl.pathname.startsWith('/api/auth') ||
    req.nextUrl.pathname.startsWith('/api/monitor/sync')
  ) {
    const res = NextResponse.next();
    for (const [k, v] of Object.entries(rateLimit.headers)) {
      res.headers.set(k, v);
    }
    return res;
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401, headers: rateLimit.headers }
    );
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');
    await jwtVerify(token, secret);

    const res = NextResponse.next();
    for (const [k, v] of Object.entries(rateLimit.headers)) {
      res.headers.set(k, v);
    }
    return res;
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid token' },
      { status: 403, headers: rateLimit.headers }
    );
  }
}

export const config = {
  matcher: ['/api/:path*'],
};
