
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateAllMockups } from '@/lib/real-mockup-generator';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { designId, positions } = await request.json();

    if (!designId) {
      return NextResponse.json({ error: 'Design ID required' }, { status: 400 });
    }

    const design = await prisma.design.findUnique({
      where: { id: designId },
    });

    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    // Extract logo file path from design imageUrl
    // Assuming imageUrl is stored as relative path like /uploads/logo-123.png
    const logoPath = path.join(process.cwd(), 'public', design.imageUrl.replace(/^\//, ''));

    // Generate mockups with custom positions
    const mockupResults = await generateAllMockups(logoPath, positions);

    // Map results to mockup format
    const mockups = Object.entries(mockupResults).map(([type, path]) => ({
      type,
      path,
      angle: 'front' as const, // Default to front view
    }));

    return NextResponse.json({
      success: true,
      message: 'Mockups regenerated successfully',
      mockups,
    });

  } catch (error) {
    console.error('[Regenerate Mockups] Error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate mockups', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
