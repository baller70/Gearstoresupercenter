import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { printfulClient } from '@/lib/printful-client';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-printful-signature');
    const rawBody = await req.text();
    
    const webhookSecret = process.env.PRINTFUL_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('[Printful Webhook] No webhook secret configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    if (signature && !printfulClient.verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('[Printful Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = printfulClient.parseWebhookEvent(payload);

    console.log('[Printful Webhook] Received event:', event.type, event);

    switch (event.type) {
      case 'package_shipped':
        if (event.orderId && event.tracking) {
          const order = await prisma.order.findFirst({
            where: { printifyOrderId: event.orderId.toString() },
          });

          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                status: 'SHIPPED',
                trackingNumber: event.tracking.number,
                carrier: event.tracking.carrier,
                shippedAt: new Date(),
              },
            });

            console.log(`[Printful Webhook] Order ${order.id} marked as shipped`);
          }
        }
        break;

      case 'package_returned':
        if (event.orderId) {
          const order = await prisma.order.findFirst({
            where: { printifyOrderId: event.orderId.toString() },
          });

          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                status: 'CANCELLED',
                notes: 'Package returned by carrier',
              },
            });

            console.log(`[Printful Webhook] Order ${order.id} marked as returned`);
          }
        }
        break;

      case 'order_failed':
        if (event.orderId) {
          const order = await prisma.order.findFirst({
            where: { printifyOrderId: event.orderId.toString() },
          });

          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                status: 'CANCELLED',
                notes: `Order failed: ${payload.data?.reason || 'Unknown reason'}`,
              },
            });

            console.log(`[Printful Webhook] Order ${order.id} marked as failed`);
          }
        }
        break;

      case 'order_updated':
        if (event.orderId && event.status) {
          const order = await prisma.order.findFirst({
            where: { printifyOrderId: event.orderId.toString() },
          });

          if (order) {
            let newStatus = order.status;
            
            if (event.status === 'fulfilled') {
              newStatus = 'DELIVERED';
            } else if (event.status === 'canceled') {
              newStatus = 'CANCELLED';
            } else if (event.status === 'inprocess') {
              newStatus = 'PROCESSING';
            }

            await prisma.order.update({
              where: { id: order.id },
              data: { status: newStatus },
            });

            console.log(`[Printful Webhook] Order ${order.id} status updated to ${newStatus}`);
          }
        }
        break;

      case 'product_synced':
        console.log('[Printful Webhook] Product synced event received');
        break;

      case 'stock_updated':
        console.log('[Printful Webhook] Stock updated event received');
        break;

      default:
        console.log(`[Printful Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('[Printful Webhook Error]', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
