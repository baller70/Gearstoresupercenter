import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { printfulClient } from '@/lib/printful-client';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.printifyOrderId) {
      return NextResponse.json({ 
        error: 'Order already submitted to Printful',
        printfulOrderId: order.printifyOrderId,
      }, { status: 400 });
    }

    const printfulItems = order.items.map(item => {
      const metadata = item.product.metadata as any;
      const variantId = metadata?.printfulVariants?.find(
        (v: any) => v.size === item.size && v.color === item.color
      )?.id || item.product.printifyVariantId;

      if (!variantId) {
        throw new Error(`No Printful variant found for ${item.product.name} - ${item.size} - ${item.color}`);
      }

      return {
        variant_id: variantId,
        quantity: item.quantity,
        retail_price: item.price.toFixed(2),
        name: item.product.name,
        files: item.customization ? [{
          url: (item.customization as any).logoUrl || (item.customization as any).designUrl,
        }] : undefined,
      };
    });

    const printfulOrderData = {
      recipient: {
        name: order.shippingName,
        address1: order.shippingAddress || '',
        city: order.shippingCity || '',
        state_code: order.shippingState || '',
        country_code: order.shippingCountry,
        zip: order.shippingZip || '',
        email: order.shippingEmail || order.user.email,
        phone: order.user.phone || undefined,
      },
      items: printfulItems,
      retail_costs: {
        currency: 'USD',
        subtotal: order.total.toFixed(2),
        shipping: '0.00',
        tax: '0.00',
      },
    };

    const printfulOrder = await printfulClient.createOrder(printfulOrderData, order.id);

    const confirmedOrder = await printfulClient.confirmOrder(printfulOrder.id);

    await prisma.order.update({
      where: { id: orderId },
      data: {
        printifyOrderId: confirmedOrder.id.toString(),
        status: 'PROCESSING',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Order submitted to Printful for fulfillment',
      printfulOrderId: confirmedOrder.id,
      status: confirmedOrder.status,
    });

  } catch (error: any) {
    console.error('[Printful Order Error]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Printful order' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || !order.printifyOrderId) {
      return NextResponse.json({ error: 'Printful order not found' }, { status: 404 });
    }

    const printfulOrder = await printfulClient.getOrder(parseInt(order.printifyOrderId));

    return NextResponse.json({
      printfulOrder,
      shipments: printfulOrder.shipments,
    });

  } catch (error: any) {
    console.error('[Printful Order Status Error]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch order status' },
      { status: 500 }
    );
  }
}
