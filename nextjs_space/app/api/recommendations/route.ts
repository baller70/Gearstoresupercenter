
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      // For non-logged in users, return popular/featured products
      const products = await prisma.product.findMany({
        where: { featured: true, inStock: true },
        take: 6,
        orderBy: { createdAt: 'desc' },
      });
      
      return NextResponse.json({ recommendations: products });
    }

    // Get user's recently viewed products
    const recentViews = await prisma.productView.findMany({
      where: { userId: session.user.id },
      orderBy: { viewedAt: 'desc' },
      take: 10,
      include: { product: true },
    });

    // Get user's order history for better recommendations
    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        orderItems: {
          include: { product: true },
        },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    // Extract categories and products the user has interacted with
    const viewedProductIds = recentViews.map((v: { productId: string }) => v.productId);
    const purchasedProductIds = orders.flatMap((o: { orderItems: any[] }) => 
      o.orderItems.map((i: { productId: string }) => i.productId)
    );
    const allInteractedIds = [...new Set([...viewedProductIds, ...purchasedProductIds])];

    // Get categories from viewed/purchased products
    const interactedProducts = await prisma.product.findMany({
      where: { id: { in: allInteractedIds } },
      select: { category: true },
    });
    
    const preferredCategories = [...new Set(interactedProducts.map((p: { category: string }) => p.category))];

    // Generate recommendations based on user behavior
    let recommendations = await prisma.product.findMany({
      where: {
        inStock: true,
        id: { notIn: allInteractedIds },
        ...(preferredCategories.length > 0 
          ? { category: { in: preferredCategories as any } }
          : {}),
      },
      take: 6,
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // If not enough recommendations, add popular products
    if (recommendations.length < 6) {
      const popular = await prisma.product.findMany({
        where: {
          AND: [
            { inStock: true },
            { id: { notIn: [...allInteractedIds, ...recommendations.map(r => r.id)] } },
          ],
        },
        take: 6 - recommendations.length,
        orderBy: { createdAt: 'desc' },
      });
      
      recommendations = [...recommendations, ...popular];
    }

    return NextResponse.json({ 
      recommendations,
      reason: preferredCategories.length > 0 
        ? 'Based on your browsing and purchase history'
        : 'Popular items you might like'
    });

  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 });
  }
}
