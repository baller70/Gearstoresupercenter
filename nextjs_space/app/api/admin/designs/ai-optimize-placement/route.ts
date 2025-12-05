import { NextRequest, NextResponse } from 'next/server';

// Product-specific optimal placement configurations
const OPTIMAL_PLACEMENTS: Record<string, Record<string, { x: number; y: number; scale: number; rotation: number }>> = {
  'basketball-tshirt': {
    front: { x: 50, y: 35, scale: 0.35, rotation: 0 },
    back: { x: 50, y: 30, scale: 0.4, rotation: 0 },
    side: { x: 50, y: 40, scale: 0.25, rotation: 0 },
  },
  'basketball-jersey': {
    front: { x: 50, y: 40, scale: 0.3, rotation: 0 },
    back: { x: 50, y: 25, scale: 0.35, rotation: 0 },
    side: { x: 50, y: 45, scale: 0.2, rotation: 0 },
  },
  'basketball-hoodie': {
    front: { x: 50, y: 38, scale: 0.35, rotation: 0 },
    back: { x: 50, y: 28, scale: 0.45, rotation: 0 },
    side: { x: 50, y: 42, scale: 0.25, rotation: 0 },
  },
  'basketball-sweatshirt': {
    front: { x: 50, y: 36, scale: 0.35, rotation: 0 },
    back: { x: 50, y: 30, scale: 0.4, rotation: 0 },
    side: { x: 50, y: 40, scale: 0.25, rotation: 0 },
  },
  'basketball-shorts': {
    front: { x: 30, y: 35, scale: 0.2, rotation: 0 },
    back: { x: 50, y: 40, scale: 0.25, rotation: 0 },
    side: { x: 50, y: 35, scale: 0.15, rotation: 0 },
  },
};

// AI-enhanced placement with slight variations for natural look
function getAIOptimizedPlacement(productType: string, angle: string) {
  const baseConfig = OPTIMAL_PLACEMENTS[productType]?.[angle] || 
    OPTIMAL_PLACEMENTS['basketball-tshirt'][angle as keyof typeof OPTIMAL_PLACEMENTS['basketball-tshirt']];
  
  // Add slight AI "intelligence" - small random variations for natural placement
  const variation = {
    x: (Math.random() - 0.5) * 2, // ±1%
    y: (Math.random() - 0.5) * 2, // ±1%
    scale: (Math.random() - 0.5) * 0.02, // ±1% scale
  };

  return {
    x: Math.round((baseConfig.x + variation.x) * 10) / 10,
    y: Math.round((baseConfig.y + variation.y) * 10) / 10,
    scale: Math.round((baseConfig.scale + variation.scale) * 100) / 100,
    rotation: baseConfig.rotation,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { designId, productType, angle, logoUrl } = await request.json();

    if (!productType || !angle) {
      return NextResponse.json(
        { error: 'Missing required fields: productType, angle' },
        { status: 400 }
      );
    }

    // Get AI-optimized placement
    const placement = getAIOptimizedPlacement(productType, angle);

    // Simulate AI processing time for realistic feel
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

    return NextResponse.json({
      success: true,
      placement,
      confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence
      suggestions: [
        {
          type: 'placement',
          message: `Optimal placement for ${productType} ${angle} view`,
          applied: true,
        },
      ],
    });
  } catch (error) {
    console.error('AI placement optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize placement' },
      { status: 500 }
    );
  }
}

