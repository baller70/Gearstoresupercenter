
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, email, cartValue, itemCount } = body;

    // Check if cart already exists
    const existing = await prisma.abandonedCart.findFirst({
      where: {
        sessionId,
        recovered: false,
      },
    });

    if (existing) {
      // Update existing
      const updated = await prisma.abandonedCart.update({
        where: { id: existing.id },
        data: {
          cartValue,
          itemCount,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(updated);
    }

    // Create new abandoned cart record
    const abandonedCart = await prisma.abandonedCart.create({
      data: {
        sessionId,
        email,
        cartValue,
        itemCount,
      },
    });

    return NextResponse.json(abandonedCart);
  } catch (error) {
    console.error('Abandoned cart tracking error:', error);
    return NextResponse.json({ error: 'Failed to track abandoned cart' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get abandoned carts from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const abandonedCarts = await prisma.abandonedCart.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(abandonedCarts);
  } catch (error) {
    console.error('Fetch abandoned carts error:', error);
    return NextResponse.json({ error: 'Failed to fetch abandoned carts' }, { status: 500 });
  }
}
