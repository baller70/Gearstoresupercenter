
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const trackingNumber = searchParams.get('trackingNumber');

    if (!orderId && !trackingNumber) {
      return NextResponse.json({ error: 'Order ID or tracking number required' }, { status: 400 });
    }

    const shipment = await prisma.shipment.findFirst({
      where: orderId ? { orderId } : { trackingNumber: trackingNumber || undefined },
      include: {
        trackingEvents: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    return NextResponse.json(shipment);
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.json({ error: 'Failed to fetch tracking info' }, { status: 500 });
  }
}
