import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { DEFAULT_BUSINESS_ID } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bulkOrders = await prisma.bulkOrder.findMany({
      where: { userId: session.user.id },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bulkOrders);
  } catch (error) {
    console.error('Bulk order fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch bulk orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { teamName, items, notes } = body;

    if (!teamName || !items || items.length === 0) {
      return NextResponse.json({ error: 'Team name and items required' }, { status: 400 });
    }

    // Calculate total amount
    const productIds = items.map((item: any) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    let totalAmount = 0;
    const validItems = items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        totalAmount += product.price * (item.quantity || 1);
      }
      return item;
    });

    // Apply team discount (15% for orders > 10 items)
    const totalItems = validItems.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
    if (totalItems >= 10) {
      totalAmount *= 0.85; // 15% discount
    }

    const bulkOrder = await prisma.bulkOrder.create({
      data: {
        businessId: DEFAULT_BUSINESS_ID,
        userId: session.user.id,
        teamName,
        totalAmount,
        notes,
        items: {
          create: validItems,
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(bulkOrder);
  } catch (error) {
    console.error('Bulk order creation error:', error);
    return NextResponse.json({ error: 'Failed to create bulk order' }, { status: 500 });
  }
}
