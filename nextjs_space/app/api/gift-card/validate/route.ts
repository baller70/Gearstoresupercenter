
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Gift card code required' }, { status: 400 });
    }

    const giftCard = await prisma.giftCard.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!giftCard) {
      return NextResponse.json({ error: 'Invalid gift card code' }, { status: 404 });
    }

    if (giftCard.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Gift card is not active' }, { status: 400 });
    }

    if (giftCard.balance <= 0) {
      return NextResponse.json({ error: 'Gift card has no balance' }, { status: 400 });
    }

    if (giftCard.expiresAt && new Date() > giftCard.expiresAt) {
      return NextResponse.json({ error: 'Gift card has expired' }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      balance: giftCard.balance,
      giftCard,
    });
  } catch (error) {
    console.error('Gift card validation error:', error);
    return NextResponse.json({ error: 'Failed to validate gift card' }, { status: 500 });
  }
}
