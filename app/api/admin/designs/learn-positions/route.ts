
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { designId, positions, colorVariants } = await request.json();

    if (!designId || !positions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update design with logo positions
    const design = await prisma.design.update({
      where: { id: designId },
      data: {
        logoPositions: positions, // Store as JSON
        colorVariants: colorVariants || [],
      },
    });

    // Store learning data for AI (position preferences per product type)
    // This data can be used to train the AI for future uploads
    for (const [productType, position] of Object.entries(positions)) {
      await prisma.logoPositionLearning.upsert({
        where: {
          productType_brand: {
            productType,
            brand: design.brand || 'default',
          },
        },
        update: {
          x: (position as any).x,
          y: (position as any).y,
          scale: (position as any).scale,
          rotation: (position as any).rotation || 0,
          timesUsed: {
            increment: 1,
          },
        },
        create: {
          productType,
          brand: design.brand || 'default',
          x: (position as any).x,
          y: (position as any).y,
          scale: (position as any).scale,
          rotation: (position as any).rotation || 0,
          timesUsed: 1,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Positions saved and AI learning updated',
      design,
    });

  } catch (error) {
    console.error('[Learn Positions] Error:', error);
    return NextResponse.json(
      { error: 'Failed to save positions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
