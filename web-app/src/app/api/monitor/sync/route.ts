import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all activities for the dashboard
export async function GET(request: Request) {
  try {
    const activities = await prisma.pCActivity.findMany({
      include: {
        user: {
          select: { name: true, role: true }
        }
      }
    });

    // Map to expected format
    const mapped = activities.map(act => ({
      id: act.id,
      name: act.user.name,
      role: act.user.role,
      status: act.status,
      idleTime: act.idleTime || undefined,
      currentApp: act.currentApp || "Desktop",
      appTitle: act.appTitle || "Unknown",
      appHistory: JSON.parse(act.appHistory || "[]"),
      dailyAppUsage: JSON.parse(act.dailyAppUsage || "{}"),
      productivity: act.productivity,
      lastSync: act.lastSync
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST activity from desktop agent
export async function POST(request: Request) {
  try {
    const data = await request.json();
    let { userId, status, currentApp, appTitle, idleTime } = data;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
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

    let history: { app: string; title: string; time: string }[] = [];
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
        const timeStr = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
        if (history.length === 0 || history[0].app !== currentApp || history[0].title !== appTitle) {
          history.unshift({ app: currentApp, title: appTitle || "Unknown", time: timeStr });
          if (history.length > 10) history.pop();
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
