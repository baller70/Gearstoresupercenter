
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const wishlist = await prisma.wishlist.findMany({
      where: { userId: session.user.id },
      include: {
        user: true,
      },
      orderBy: { addedAt: 'desc' },
    });

    // Get product details for each wishlist item
    const productIds = wishlist.map((w) => w.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const wishlistWithProducts = wishlist.map((w) => ({
      ...w,
      product: products.find((p) => p.id === w.productId),
    }));

    return NextResponse.json(wishlistWithProducts);
  } catch (error) {
    console.error('Wishlist error:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, notes } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId: session.user.id,
        productId,
        notes,
      },
    });

    return NextResponse.json(wishlistItem);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Item already in wishlist' }, { status: 400 });
    }
    console.error('Wishlist add error:', error);
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    await prisma.wishlist.delete({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Wishlist remove error:', error);
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
  }
}
