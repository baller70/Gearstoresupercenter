
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subtotal, shippingAddress } = body;

    const { state, zipCode } = shippingAddress;

    // Get applicable tax rates
    const taxRates = await prisma.taxRate.findMany({
      where: {
        active: true,
        state,
        OR: [
          { zipCode: null },
          { zipCode },
        ],
        effectiveFrom: { lte: new Date() },
        AND: [
          {
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: new Date() } },
            ],
          },
        ],
      },
    });

    // Calculate total tax rate
    const totalTaxRate = taxRates.reduce((sum: number, rate: any) => sum + rate.rate, 0);
    const taxAmount = Math.round(subtotal * totalTaxRate * 100) / 100;

    return NextResponse.json({
      taxRate: totalTaxRate,
      taxAmount,
      breakdown: taxRates.map((rate: any) => ({
        type: rate.type,
        rate: rate.rate,
        amount: Math.round(subtotal * rate.rate * 100) / 100,
      })),
    });
  } catch (error) {
    console.error('Tax calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate tax' }, { status: 500 });
  }
}
