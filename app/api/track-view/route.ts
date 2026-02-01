
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Not authenticated' });
    }

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Create or update product view
    await prisma.productView.create({
      data: {
        userId: session.user.id,
        productId,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Track view error:', error);
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}
