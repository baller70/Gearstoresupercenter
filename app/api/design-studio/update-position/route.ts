
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { mockupId, positionX, positionY, scale } = body;

    if (!mockupId) {
      return NextResponse.json(
        { error: 'Mockup ID is required' },
        { status: 400 }
      );
    }

    // Update mockup position
    const mockup = await prisma.userMockup.update({
      where: { id: mockupId },
      data: {
        positionX: positionX || 50,
        positionY: positionY || 35,
        scale: scale || 1.0,
      },
    });

    return NextResponse.json({
      success: true,
      mockup,
    });
  } catch (error) {
    console.error('Failed to update position:', error);
    return NextResponse.json(
      { error: 'Failed to update position' },
      { status: 500 }
    );
  }
}
