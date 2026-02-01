import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { DEFAULT_BUSINESS_ID } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const discounts = await prisma.discountCode.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(discounts);
  } catch (error) {
    console.error('Discounts fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchase,
      validFrom,
      validUntil,
    } = body;

    if (!code || !description || !discountType || !discountValue) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const discount = await prisma.discountCode.create({
      data: {
        businessId: DEFAULT_BUSINESS_ID,
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue,
        minPurchase,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
      },
    });

    return NextResponse.json(discount);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Discount code already exists' }, { status: 400 });
    }
    console.error('Discount creation error:', error);
    return NextResponse.json({ error: 'Failed to create discount' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, active } = body;

    const discount = await prisma.discountCode.update({
      where: { id },
      data: { active },
    });

    return NextResponse.json(discount);
  } catch (error) {
    console.error('Discount update error:', error);
    return NextResponse.json({ error: 'Failed to update discount' }, { status: 500 });
  }
}
