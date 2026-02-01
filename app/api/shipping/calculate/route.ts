
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, destination } = body;

    // Calculate total weight (simplified - in production, use actual product weights)
    const totalWeight = items.reduce((sum: number, item: any) => sum + (item.quantity * 0.5), 0);

    // Get shipping options
    const shippingOptions = await prisma.shippingOption.findMany({
      where: { active: true },
      orderBy: { priority: 'asc' },
    });

    // Calculate rates based on weight and destination
    const rates = shippingOptions.map((option: any) => {
      // Simplified rate calculation
      let calculatedPrice = option.basePrice;
      
      // Add weight-based surcharge
      if (totalWeight > 5) {
        calculatedPrice += (totalWeight - 5) * 2;
      }

      // Add distance-based surcharge (simplified)
      if (destination.state && destination.state !== 'CA') {
        calculatedPrice += 5;
      }

      return {
        id: option.id,
        name: option.name,
        description: option.description,
        price: Math.round(calculatedPrice * 100) / 100,
        estimatedDays: option.estimatedDays,
      };
    });

    return NextResponse.json(rates);
  } catch (error) {
    console.error('Shipping calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate shipping' }, { status: 500 });
  }
}
