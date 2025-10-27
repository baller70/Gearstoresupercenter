
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const design = await prisma.design.findUnique({
      where: { id: params.id },
      include: {
        products: true,
      },
    });

    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    // Extract mockups from products
    const mockups = design.products.map((product) => ({
      type: product.productType || 'unknown',
      path: product.imageUrl,
      angle: 'front' as const,
    }));

    return NextResponse.json({
      success: true,
      mockups,
      design: {
        id: design.id,
        name: design.name,
        imageUrl: design.imageUrl,
        logoPositions: design.logoPositions || {},
      },
    });

  } catch (error) {
    console.error('[Get Mockups] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mockups', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
