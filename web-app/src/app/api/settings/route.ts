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
    const { breakStartTime, breakEndTime } = data;

    const settings = await prisma.globalSettings.upsert({
      where: { id: "default" },
      update: { breakStartTime, breakEndTime },
      create: { id: "default", breakStartTime, breakEndTime }
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
