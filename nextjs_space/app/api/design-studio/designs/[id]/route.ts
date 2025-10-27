
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('[Design API] Fetching design:', params.id);
    
    const session = await getServerSession(authOptions);
    
    console.log('[Design API] Session check:', { 
      hasSession: !!session,
      userEmail: session?.user?.email 
    });
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    console.log('[Design API] User found:', !!user);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Try to fetch from UserDesign first (new system)
    const userDesign = await prisma.userDesign.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        mockups: true,
      },
    });

    console.log('[Design API] UserDesign found:', !!userDesign);

    if (userDesign) {
      return NextResponse.json({ design: userDesign });
    }

    // Fallback to Design model (admin uploaded designs)
    // First, let's check all designs to debug
    const allDesigns = await prisma.design.findMany({
      select: { id: true, name: true }
    });
    console.log('[Design API] All designs in DB:', allDesigns);
    console.log('[Design API] Looking for ID:', params.id);
    
    const design = await prisma.design.findUnique({
      where: { id: params.id },
    });

    console.log('[Design API] Design found:', !!design);

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      );
    }

    // Transform Design to match UserDesign structure for the editor
    const transformedDesign = {
      id: design.id,
      name: design.name,
      brand: design.brand || 'Rise as One AAU',
      logoUrl: design.logoUrl || design.imageUrl,
      status: design.status,
      mockupsGenerated: false,
      mockups: [],
      // Include admin-specific fields
      aiAnalysis: design.aiAnalysis,
      averageScore: design.averageScore,
      positionX: design.positionX,
      positionY: design.positionY,
      scale: design.scale,
      logoPositions: design.logoPositions,
      colorVariants: design.colorVariants,
    };

    console.log('[Design API] Returning transformed design');

    return NextResponse.json({ design: transformedDesign });
  } catch (error) {
    console.error('[Design API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch design' },
      { status: 500 }
    );
  }
}
