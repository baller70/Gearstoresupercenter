
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const sizeGuides = await prisma.sizeGuide.findMany({
      where: category ? { category: category as any } : {},
      orderBy: [{ category: 'asc' }, { fitType: 'asc' }],
    });

    return NextResponse.json(sizeGuides);
  } catch (error) {
    console.error('Size guide error:', error);
    return NextResponse.json({ error: 'Failed to fetch size guide' }, { status: 500 });
  }
}
