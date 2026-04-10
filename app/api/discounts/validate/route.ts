import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { DEFAULT_BUSINESS_ID } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, cartTotal, cartCategories } = body;

    if (!code) {
      return NextResponse.json({ error: 'Discount code required' }, { status: 400 });
    }

    const discount = await prisma.discountCode.findFirst({
      where: {
        code: code.toUpperCase(),
        businessId: DEFAULT_BUSINESS_ID,
      },
    });

    if (!discount) {
      return NextResponse.json({ error: 'Invalid discount code' }, { status: 404 });
    }

    // Check if discount is active
    if (!discount.active) {
      return NextResponse.json({ error: 'Discount code is inactive' }, { status: 400 });
    }

    // Check date validity
    const now = new Date();
    if (now < discount.validFrom || now > discount.validUntil) {
      return NextResponse.json({ error: 'Discount code has expired' }, { status: 400 });
    }

    // Check usage limit
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      return NextResponse.json({ error: 'Discount code usage limit reached' }, { status: 400 });
    }

    // Check per-user limit
    if (discount.perUserLimit) {
      const userUsageCount = await prisma.discountUsage.count({
        where: {
          userId: session.user.id,
          discountCodeId: discount.id,
        },
      });

      if (userUsageCount >= discount.perUserLimit) {
        return NextResponse.json({ 
          error: 'You have reached the usage limit for this discount code' 
        }, { status: 400 });
      }
    }

    // Check minimum purchase
    if (discount.minPurchase && cartTotal < discount.minPurchase) {
      return NextResponse.json({ 
        error: `Minimum purchase of $${discount.minPurchase} required` 
      }, { status: 400 });
    }

    // Check applicable categories
    if (discount.applicableCategories.length > 0) {
      const hasApplicableCategory = cartCategories.some((cat: string) =>
        discount.applicableCategories.includes(cat)
      );
      if (!hasApplicableCategory) {
        return NextResponse.json({ 
          error: 'Discount code not applicable to items in your cart' 
        }, { status: 400 });
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    switch (discount.discountType) {
      case 'PERCENTAGE':
        discountAmount = (cartTotal * discount.discountValue) / 100;
        if (discount.maxDiscount) {
          discountAmount = Math.min(discountAmount, discount.maxDiscount);
        }
        break;
      case 'FIXED_AMOUNT':
        discountAmount = discount.discountValue;
        break;
      case 'FREE_SHIPPING':
        discountAmount = 0; // Handled separately in checkout
        break;
      case 'BOGO':
        // Simplified BOGO logic - would need more complex implementation
        discountAmount = cartTotal * 0.5;
        break;
    }

    return NextResponse.json({
      valid: true,
      discount,
      discountAmount: Math.min(discountAmount, cartTotal),
    });
  } catch (error) {
    console.error('Discount validation error:', error);
    return NextResponse.json({ error: 'Failed to validate discount' }, { status: 500 });
  }
}
