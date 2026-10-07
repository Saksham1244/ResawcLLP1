import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/finance/rate-cards?clientId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (clientId) {
      let rateCard = await prisma.clientRateCard.findUnique({
        where: { clientId },
        include: {
          client: {
            select: { id: true, clientId: true, companyName: true, contactPerson: true },
          },
        },
      });

      // If no rate card exists yet for this client, return default template
      if (!rateCard) {
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client) {
          return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
        }
        rateCard = await prisma.clientRateCard.create({
          data: {
            clientId,
            photoCullingRate: 3.0,
            photoColorRate: 7.0,
            photoRetouchRate: 15.0,
            videoPerMinuteRate: 500.0,
            videoReelRate: 1200.0,
            monthlyRetainer: 0.0,
          },
          include: {
            client: {
              select: { id: true, clientId: true, companyName: true, contactPerson: true },
            },
          },
        });
      }

      return NextResponse.json({ success: true, data: rateCard });
    }

    // Return all client rate cards
    const rateCards = await prisma.clientRateCard.findMany({
      include: {
        client: {
          select: { id: true, clientId: true, companyName: true, contactPerson: true, currency: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: rateCards });
  } catch (error) {
    console.error('Error fetching rate cards:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST or PUT /api/finance/rate-cards
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      clientId,
      photoCullingRate,
      photoColorRate,
      photoRetouchRate,
      videoPerMinuteRate,
      videoReelRate,
      monthlyRetainer,
      customNotes,
    } = body;

    if (!clientId) {
      return NextResponse.json({ success: false, error: 'clientId is required' }, { status: 400 });
    }

    const rateCard = await prisma.clientRateCard.upsert({
      where: { clientId },
      create: {
        clientId,
        photoCullingRate: parseFloat(photoCullingRate) || 0,
        photoColorRate: parseFloat(photoColorRate) || 0,
        photoRetouchRate: parseFloat(photoRetouchRate) || 0,
        videoPerMinuteRate: parseFloat(videoPerMinuteRate) || 0,
        videoReelRate: parseFloat(videoReelRate) || 0,
        monthlyRetainer: parseFloat(monthlyRetainer) || 0,
        customNotes: customNotes || '',
      },
      update: {
        photoCullingRate: parseFloat(photoCullingRate) || 0,
        photoColorRate: parseFloat(photoColorRate) || 0,
        photoRetouchRate: parseFloat(photoRetouchRate) || 0,
        videoPerMinuteRate: parseFloat(videoPerMinuteRate) || 0,
        videoReelRate: parseFloat(videoReelRate) || 0,
        monthlyRetainer: parseFloat(monthlyRetainer) || 0,
        customNotes: customNotes !== undefined ? customNotes : undefined,
      },
      include: {
        client: {
          select: { id: true, clientId: true, companyName: true, contactPerson: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: rateCard });
  } catch (error) {
    console.error('Error updating rate card:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
