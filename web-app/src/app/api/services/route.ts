import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_SERVICES = [
  { name: "Photo Culling", code: "photoCullingRate", category: "PHOTO", unit: "img", defaultRate: 3.0, sacCode: "998314", description: "Culling and selecting best shots from raw batches", sortOrder: 1 },
  { name: "Color Correction", code: "photoColorRate", category: "PHOTO", unit: "img", defaultRate: 7.0, sacCode: "998314", description: "Exposure, white balance, tone grading and color consistency", sortOrder: 2 },
  { name: "Retouching", code: "photoRetouchRate", category: "PHOTO", unit: "img", defaultRate: 15.0, sacCode: "998314", description: "High-end skin smoothing, blemish removal, and compositing", sortOrder: 3 },
  { name: "Video Editing", code: "videoPerMinuteRate", category: "VIDEO", unit: "min", defaultRate: 500.0, sacCode: "998314", description: "Timeline cutting, multicam sync, transitions and audio leveling", sortOrder: 4 },
  { name: "Reels / Shorts", code: "videoReelRate", category: "VIDEO", unit: "reel", defaultRate: 1200.0, sacCode: "998314", description: "Vertical format 9:16 cuts with hooks, subtitles and sound design", sortOrder: 5 },
  { name: "Monthly Retainer", code: "monthlyRetainer", category: "RETAINER", unit: "month", defaultRate: 0.0, sacCode: "998314", description: "Fixed dedicated monthly post-production retainer contract", sortOrder: 6 },
];

// GET /api/services
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    let count = await prisma.companyService.count();
    if (count === 0) {
      // Auto seed default services if none exist
      for (const svc of DEFAULT_SERVICES) {
        await prisma.companyService.create({
          data: svc,
        });
      }
    }

    const services = await prisma.companyService.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/services (create or update service)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, code, category, unit, defaultRate, sacCode, description, isActive, sortOrder } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Service name is required' }, { status: 400 });
    }

    const rate = parseFloat(defaultRate) || 0;
    const cat = category || 'PHOTO';
    const u = unit || 'img';
    const sac = sacCode || '998314';

    if (id) {
      const updated = await prisma.companyService.update({
        where: { id },
        data: {
          name: name.trim(),
          code: code || undefined,
          category: cat,
          unit: u,
          defaultRate: rate,
          sacCode: sac,
          description: description !== undefined ? description : undefined,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
          sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 0,
        },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    // Check unique name
    const existing = await prisma.companyService.findUnique({
      where: { name: name.trim() },
    });
    if (existing) {
      return NextResponse.json({ success: false, error: 'A service with this name already exists' }, { status: 409 });
    }

    const created = await prisma.companyService.create({
      data: {
        name: name.trim(),
        code: code || name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_'),
        category: cat,
        unit: u,
        defaultRate: rate,
        sacCode: sac,
        description: description || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : 10,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error('Error saving service:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/services?id=...
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Service id is required' }, { status: 400 });
    }

    await prisma.companyService.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/services (toggle active status or quick update)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, isActive, defaultRate } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Service id is required' }, { status: 400 });
    }

    const updated = await prisma.companyService.update({
      where: { id },
      data: {
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(defaultRate !== undefined ? { defaultRate: parseFloat(defaultRate) || 0 } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating service status:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
