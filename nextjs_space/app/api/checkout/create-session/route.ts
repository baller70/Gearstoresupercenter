import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createCheckoutSession } from '@/lib/stripe';

// Default business ID for the platform
const DEFAULT_BUSINESS_ID = 'default-basketball-factory';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      shippingName,
      shippingEmail,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      shippingCountry = 'US'
    } = body;

    // Get user's cart items
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        cartItems: {
          include: { product: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.cartItems || user.cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Calculate total
    const subtotal = user.cartItems.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    // Determine the business ID (use user's business or default)
    const businessId = user.businessId || DEFAULT_BUSINESS_ID;

    // Create a pending order first
    const order = await prisma.order.create({
      data: {
        businessId,
        userId: user.id,
        total: subtotal,
        status: 'PENDING_PAYMENT',
        shippingName: shippingName || user.firstName || 'Customer',
        shippingEmail: shippingEmail || user.email,
        shippingAddress: shippingAddress || '',
        shippingCity: shippingCity || '',
        shippingState: shippingState || '',
        shippingZip: shippingZip || '',
        shippingCountry: shippingCountry,
        items: {
          create: user.cartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
            size: item.size,
            color: item.color,
          }))
        }
      }
    });

    // Create Stripe checkout session
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    const checkoutSession = await createCheckoutSession({
      orderId: order.id,
      customerEmail: user.email,
      lineItems: user.cartItems.map(item => ({
        name: item.product.name,
        description: `Size: ${item.size || 'N/A'}, Color: ${item.color || 'N/A'}`,
        price: item.product.price,
        quantity: item.quantity,
        imageUrl: item.product.imageUrl || undefined,
      })),
      successUrl: `${baseUrl}/orders/${order.id}/success`,
      cancelUrl: `${baseUrl}/checkout?canceled=true`,
      metadata: {
        userId: user.id,
      }
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      orderId: order.id,
    });

  } catch (error: any) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

