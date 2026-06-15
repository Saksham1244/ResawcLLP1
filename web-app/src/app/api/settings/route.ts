import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    let settings = await prisma.globalSettings.findUnique({
      where: { id: "default" }
    });

    if (!settings) {
      settings = await prisma.globalSettings.create({
        data: { id: "default", breakStartTime: "13:00", breakEndTime: "13:30" }
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      breakStartTime, 
      breakEndTime,
      activeDays,
      saturdayMode,
      workStartTime,
      workEndTime,
      breakDuration,
      lateGrace,
      latePenalty
    } = data;

    const updateData: any = {};
    if (breakStartTime !== undefined) updateData.breakStartTime = breakStartTime;
    if (breakEndTime !== undefined) updateData.breakEndTime = breakEndTime;
    if (activeDays !== undefined) updateData.activeDays = activeDays;
    if (saturdayMode !== undefined) updateData.saturdayMode = saturdayMode;
    if (workStartTime !== undefined) updateData.workStartTime = workStartTime;
    if (workEndTime !== undefined) updateData.workEndTime = workEndTime;
    if (breakDuration !== undefined) updateData.breakDuration = breakDuration;
    if (lateGrace !== undefined) updateData.lateGrace = lateGrace;
    if (latePenalty !== undefined) updateData.latePenalty = latePenalty;

    const settings = await prisma.globalSettings.upsert({
      where: { id: "default" },
      update: updateData,
      create: { 
        id: "default", 
        breakStartTime: breakStartTime || "13:00", 
        breakEndTime: breakEndTime || "13:30",
        activeDays: activeDays || '["Mon","Tue","Wed","Thu","Fri"]',
        saturdayMode: saturdayMode || "All Saturdays",
        workStartTime: workStartTime || "09:00",
        workEndTime: workEndTime || "18:00",
        breakDuration: breakDuration || 30,
        lateGrace: lateGrace || 15,
        latePenalty: latePenalty || 3
      }
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
