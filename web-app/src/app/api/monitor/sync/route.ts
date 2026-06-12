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
    const { userId, status, currentApp, appTitle, idleTime } = data;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Calculate a basic productivity score
    let productivity = 0;
    if (status === 'Active') {
      const activeApp = (currentApp || "").toLowerCase();
      if (activeApp.includes("code") || activeApp.includes("chrome") || activeApp.includes("word") || activeApp.includes("excel") || activeApp.includes("edge")) {
        productivity = 95;
      } else if (activeApp.includes("spotify") || activeApp.includes("discord")) {
        productivity = 30;
      } else {
        productivity = 75; // Default active productivity
      }
    }

    const updated = await prisma.pCActivity.upsert({
      where: { userId },
      update: {
        status,
        currentApp,
        appTitle,
        idleTime,
        productivity,
        lastSync: new Date()
      },
      create: {
        userId,
        status,
        currentApp,
        appTitle,
        idleTime,
        productivity,
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
