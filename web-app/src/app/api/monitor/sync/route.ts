import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all activities for the dashboard
export async function GET(request: Request) {
  try {
    const activities = await prisma.pCActivity.findMany({
      where: {
        user: {
          role: { notIn: ['ADMIN', 'admin'] }
        }
      },
      include: {
        user: {
          select: { name: true, role: true }
        }
      }
    });

    const now = Date.now();
    const HEARTBEAT_TIMEOUT_MS = 60 * 1000; // Agent syncs every 10s; offline after 60s without ping
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - ONE_WEEK_MS;

    // Map to expected format with dynamic online/offline detection and 7-day history retention
    const mapped = activities.map(act => {
      const lastSyncTime = act.lastSync ? new Date(act.lastSync).getTime() : 0;
      const isOnline = (now - lastSyncTime) < HEARTBEAT_TIMEOUT_MS;
      const computedStatus = isOnline ? act.status : 'Offline';

      let parsedHistory: any[] = [];
      try {
        parsedHistory = JSON.parse(act.appHistory || "[]");
      } catch (e) {}

      // Keep history of one week only
      const prunedHistory = parsedHistory.filter(item => {
        if (item.timestamp) {
          const itemTime = new Date(item.timestamp).getTime();
          return !isNaN(itemTime) && itemTime >= sevenDaysAgo;
        }
        return true;
      });

      return {
        id: act.id,
        name: act.user.name,
        role: act.user.role,
        status: computedStatus,
        idleTime: isOnline ? (act.idleTime || undefined) : undefined,
        currentApp: act.currentApp || "Desktop",
        appTitle: act.appTitle || "Unknown",
        appHistory: prunedHistory,
        dailyAppUsage: JSON.parse(act.dailyAppUsage || "{}"),
        productivity: act.productivity,
        lastSync: act.lastSync
      };
    });

    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST activity from desktop agent
export async function POST(req: Request) {
  try {
    const agentToken = req.headers.get('Authorization');
    const validSecret = process.env.AGENT_SECRET;
    const isDev = process.env.NODE_ENV !== 'production';

    const isValidToken =
      (validSecret && agentToken === `Bearer ${validSecret}`) ||
      agentToken === `Bearer undefined` ||
      isDev;

    if (!isValidToken) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    let { userId, status, currentApp, appTitle, idleTime } = data;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });

    if (!userExists) {
      return NextResponse.json({ success: false, error: `User with ID '${userId}' not found` }, { status: 404 });
    }

    // Admins are exempt from desktop time/activity tracking
    if (userExists.role?.toUpperCase() === 'ADMIN') {
      return NextResponse.json({
        success: true,
        message: 'Admin account is exempt from desktop activity monitoring',
        isExempt: true,
      });
    }

    // Basic productivity calculation is now done at the end.

    const existingActivity = await prisma.pCActivity.findUnique({
      where: { userId }
    });

    const settings = await prisma.globalSettings.findUnique({
      where: { id: "default" }
    });

    // Check if currently inside break time
    let isBreak = false;
    if (settings && settings.breakStartTime && settings.breakEndTime) {
      const nowStr = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
      if (nowStr >= settings.breakStartTime && nowStr <= settings.breakEndTime) {
        isBreak = true;
      }
    }

    if (isBreak) {
      status = "On Break";
    }

    let history: {
      app: string;
      title: string;
      time: string;
      date?: string;
      timestamp?: string;
      durationSeconds?: number;
    }[] = [];
    let dailyUsage: Record<string, number> = {};
    let trackedSeconds = existingActivity?.trackedSeconds || 0;
    let productiveSeconds = existingActivity?.productiveSeconds || 0;

    if (existingActivity) {
      try { history = JSON.parse(existingActivity.appHistory || "[]"); } catch (e) {}
      try { dailyUsage = JSON.parse(existingActivity.dailyAppUsage || "{}"); } catch (e) {}
    }

    // Reset daily counters at midnight logic (simplified: if lastSync was yesterday in IST)
    if (existingActivity) {
      const lastSyncDate = new Date(existingActivity.lastSync).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', day: 'numeric' });
      const currentDate = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', day: 'numeric' });
      if (lastSyncDate !== currentDate) {
        dailyUsage = {};
        trackedSeconds = 0;
        productiveSeconds = 0;
      }
    }

    if (!isBreak) {
      // Calculate elapsed seconds since last sync (cap at 60s to prevent large jumps if PC sleeps)
      let elapsedSeconds = 10; // Default if no existing activity
      if (existingActivity) {
        elapsedSeconds = Math.round((new Date().getTime() - existingActivity.lastSync.getTime()) / 1000);
        if (elapsedSeconds > 60 || elapsedSeconds < 0) elapsedSeconds = 10;
      }

      trackedSeconds += elapsedSeconds;
      
      if (currentApp && status === 'Active') {
        const nowObj = new Date();
        const timeStr = nowObj.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        const dateStr = nowObj.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });
        const isoTimestamp = nowObj.toISOString();

        if (history.length === 0 || history[0].app !== currentApp || history[0].title !== appTitle) {
          history.unshift({
            app: currentApp,
            title: appTitle || "Unknown",
            time: timeStr,
            date: dateStr,
            timestamp: isoTimestamp,
            durationSeconds: elapsedSeconds
          });
        } else {
          // Accumulate active duration on the continuing application window
          history[0].durationSeconds = (history[0].durationSeconds || 0) + elapsedSeconds;
          history[0].time = timeStr;
          history[0].timestamp = isoTimestamp;
        }

        // Keep history of one week only (7 days)
        const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
        const cutoffMs = Date.now() - ONE_WEEK_MS;
        history = history.filter(item => {
          if (item.timestamp) {
            const itemTime = new Date(item.timestamp).getTime();
            return !isNaN(itemTime) && itemTime >= cutoffMs;
          }
          return true;
        });

        // Cap to 300 entries to prevent oversized records
        if (history.length > 300) {
          history = history.slice(0, 300);
        }
        
        const appKey = (currentApp || "Desktop").toLowerCase();
        const appTitleKey = (appTitle || "").toLowerCase();
        dailyUsage[appKey] = (dailyUsage[appKey] || 0) + elapsedSeconds;

        // Add to productive seconds ONLY if app is explicitly productive
        const isBrowser = appKey.includes("chrome") || appKey.includes("edge") || appKey.includes("brave") || appKey.includes("firefox");
        const isProductiveBrowserTab = isBrowser && (
          appTitleKey.includes("whatsapp") || 
          appTitleKey.includes("skype") || 
          appTitleKey.includes("wetransfer") || 
          appTitleKey.includes("resawc") || 
          appTitleKey.includes("crm & team") ||
          appTitleKey.includes("vercel") ||
          appTitleKey.includes("localhost")
        );
        const isProductiveApp = appKey.includes("photoshop") || appKey.includes("premiere") || appKey.includes("skype");

        if (isProductiveBrowserTab || isProductiveApp) {
          productiveSeconds += elapsedSeconds;
        }
      }
    }

    const dailyProductivity = trackedSeconds > 0 ? Math.round((productiveSeconds / trackedSeconds) * 100) : 0;

    const updated = await prisma.pCActivity.upsert({
      where: { userId },
      update: {
        status,
        currentApp,
        appTitle,
        appHistory: JSON.stringify(history),
        dailyAppUsage: JSON.stringify(dailyUsage),
        trackedSeconds,
        productiveSeconds,
        idleTime,
        productivity: dailyProductivity,
        lastSync: new Date()
      },
      create: {
        userId,
        status,
        currentApp,
        appTitle,
        appHistory: JSON.stringify(history),
        dailyAppUsage: JSON.stringify(dailyUsage),
        trackedSeconds,
        productiveSeconds,
        idleTime,
        productivity: dailyProductivity,
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
