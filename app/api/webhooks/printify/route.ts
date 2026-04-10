import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendShippingNotification } from '@/lib/email';
import { OrderStatus } from '@prisma/client';

/**
 * Printify Webhook Handler
 * Receives order status updates from Printify
 * 
 * Events:
 * - order:created
 * - order:updated
 * - order:shipped
 * - order:canceled
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook (Printify uses a simple API key in headers)
    const webhookSecret = process.env.PRINTIFY_WEBHOOK_SECRET;
    const providedSecret = request.headers.get('x-printify-webhook-secret');
    
    if (webhookSecret && providedSecret !== webhookSecret) {
      console.error('Invalid Printify webhook secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, resource } = body;
    console.log(`Printify webhook received: ${type}`, resource);

    switch (type) {
      case 'order:shipped': {
        await handleOrderShipped(resource);
        break;
      }
      
      case 'order:updated': {
        await handleOrderUpdated(resource);
        break;
      }
      
      case 'order:canceled': {
        await handleOrderCanceled(resource);
        break;
      }

      default:
        console.log(`Unhandled Printify event: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Printify webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleOrderShipped(resource: any) {
  const externalId = resource.external_id;
  if (!externalId) return;

  const shipments = resource.shipments || [];
  const shipment = shipments[0]; // Usually one shipment per order

  // Update order in our database
  const order = await prisma.order.update({
    where: { id: externalId },
    data: {
      status: 'SHIPPED',
      trackingNumber: shipment?.tracking_number,
      carrier: shipment?.carrier,
      shippedAt: new Date(),
    },
    include: { user: true }
  });

  // Send shipping notification email
  if (shipment?.tracking_number) {
    await sendShippingNotification({
      id: order.id,
      customerEmail: order.shippingEmail || order.user.email,
      customerName: order.shippingName || order.user.firstName || 'Customer',
      trackingNumber: shipment.tracking_number,
      carrier: shipment.carrier || 'USPS',
      trackingUrl: getTrackingUrl(shipment.carrier, shipment.tracking_number),
    });
  }

  console.log(`Order ${externalId} marked as shipped`);
}

async function handleOrderUpdated(resource: any) {
  const externalId = resource.external_id;
  if (!externalId) return;

  // Map Printify status to our status
  const statusMap: Record<string, OrderStatus> = {
    'pending': OrderStatus.PROCESSING,
    'printing': OrderStatus.PROCESSING,
    'quality-check': OrderStatus.PROCESSING,
    'shipped': OrderStatus.SHIPPED,
    'delivered': OrderStatus.DELIVERED,
    'canceled': OrderStatus.CANCELLED,
    'on-hold': OrderStatus.ON_HOLD,
  };

  const newStatus = statusMap[resource.status] || OrderStatus.PROCESSING;

  await prisma.order.update({
    where: { id: externalId },
    data: {
      status: newStatus,
      printifyOrderId: resource.id,
    }
  });

  console.log(`Order ${externalId} status updated to ${newStatus}`);
}

async function handleOrderCanceled(resource: any) {
  const externalId = resource.external_id;
  if (!externalId) return;

  await prisma.order.update({
    where: { id: externalId },
    data: { status: OrderStatus.CANCELLED }
  });

  console.log(`Order ${externalId} canceled`);
}

function getTrackingUrl(carrier: string, trackingNumber: string): string | undefined {
  const trackingUrls: Record<string, string> = {
    'USPS': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    'DHL': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
  };
  
  return trackingUrls[carrier?.toUpperCase()];
}
