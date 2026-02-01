
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await req.json();
    const { status, refundAmount, refundMethod, trackingNumber } = body;

    const returnRequest = await prisma.return.update({
      where: { id: params.id },
      data: {
        status,
        refundAmount,
        refundMethod,
        trackingNumber,
        processedAt: status === 'APPROVED' ? new Date() : undefined,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });

    return NextResponse.json(returnRequest);
  } catch (error) {
    console.error('Update return error:', error);
    return NextResponse.json({ error: 'Failed to update return' }, { status: 500 });
  }
}
