import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { constructWebhookEvent } from '@/lib/stripe';
import { sendOrderConfirmation, sendPaymentFailedEmail } from '@/lib/email';
import { createOrderWebhook } from '@/lib/webhooks';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = await constructWebhookEvent(body, signature);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    console.error('No orderId in session metadata');
    return;
  }

  // Update order status
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'PAID',
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
    },
    include: {
      user: true,
      items: {
        include: { product: true }
      }
    }
  });

  // Clear user's cart
  await prisma.cartItem.deleteMany({
    where: { userId: order.userId }
  });

  // Award loyalty points (10 points per dollar)
  const pointsEarned = Math.floor(order.total * 10);
  await prisma.$transaction([
    prisma.loyaltyTransaction.create({
      data: {
        userId: order.userId,
        points: pointsEarned,
        type: 'PURCHASE',
        description: `Earned ${pointsEarned} points from order #${order.id.slice(-8)}`,
        orderId: order.id,
      }
    }),
    prisma.user.update({
      where: { id: order.userId },
      data: { loyaltyPoints: { increment: pointsEarned } }
    })
  ]);

  // Send confirmation email
  await sendOrderConfirmation({
    id: order.id,
    customerEmail: order.shippingEmail || order.user.email,
    customerName: order.shippingName || order.user.firstName || 'Customer',
    total: order.total,
    items: order.items.map(item => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.price,
      size: item.size || undefined,
      color: item.color || undefined,
    })),
    shippingAddress: {
      street: order.shippingAddress || '',
      city: order.shippingCity || '',
      state: order.shippingState || '',
      zip: order.shippingZip || '',
    }
  });

  // Trigger POD webhook for fulfillment
  createOrderWebhook({
    id: order.id,
    orderNumber: `ORD-${order.id.slice(-8)}`,
    status: order.status,
    total: order.total,
    customerName: order.shippingName || '',
    customerEmail: order.shippingEmail || order.user.email,
    items: order.items.map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
      price: item.price,
    })),
    shippingAddress: {
      name: order.shippingName || '',
      street: order.shippingAddress || '',
      city: order.shippingCity || '',
      state: order.shippingState || '',
      zipCode: order.shippingZip || '',
      country: order.shippingCountry || 'US',
    }
  }).catch(err => console.error('POD webhook error:', err));

  console.log(`Order ${orderId} completed and confirmed`);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const orderId = paymentIntent.metadata?.orderId;
  if (!orderId) return;

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: 'PAYMENT_FAILED' },
    include: { user: true }
  });

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  await sendPaymentFailedEmail({
    customerEmail: order.user.email,
    customerName: order.shippingName || order.user.firstName || 'Customer',
    orderId: order.id,
    retryUrl: `${baseUrl}/checkout?retry=${order.id}`,
  });

  console.log(`Payment failed for order ${orderId}`);
}

async function handleRefund(charge: Stripe.Charge) {
  // Find order by payment intent
  const order = await prisma.order.findFirst({
    where: { stripePaymentIntentId: charge.payment_intent as string }
  });

  if (order) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'REFUNDED' }
    });
    console.log(`Order ${order.id} marked as refunded`);
  }
}
