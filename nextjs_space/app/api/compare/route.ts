
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productIds, sessionId, userId } = body;

    if (!productIds || productIds.length < 2 || productIds.length > 4) {
      return NextResponse.json(
        { error: 'Please select 2-4 products to compare' },
        { status: 400 }
      );
    }

    // Save comparison
    await prisma.productComparison.create({
      data: {
        userId,
        sessionId,
        productIds,
      },
    });

    // Fetch products
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Product comparison error:', error);
    return NextResponse.json({ error: 'Failed to compare products' }, { status: 500 });
  }
}
