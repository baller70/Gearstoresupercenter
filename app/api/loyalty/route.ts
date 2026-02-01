
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user's loyalty points
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { loyaltyPoints: true },
    });

    // Get loyalty transaction history
    const transactions = await prisma.loyaltyTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ 
      points: user?.loyaltyPoints || 0,
      transactions,
    });

  } catch (error) {
    console.error('Loyalty points error:', error);
    return NextResponse.json({ error: 'Failed to get loyalty points' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { points, type, description, orderId } = await request.json();

    if (!points || !type || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create loyalty transaction
    const transaction = await prisma.loyaltyTransaction.create({
      data: {
        userId: session.user.id,
        points,
        type,
        description,
        orderId,
      },
    });

    // Update user's total points
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        loyaltyPoints: {
          increment: points,
        },
      },
    });

    return NextResponse.json({ success: true, transaction });

  } catch (error) {
    console.error('Add loyalty points error:', error);
    return NextResponse.json({ error: 'Failed to add loyalty points' }, { status: 500 });
  }
}
