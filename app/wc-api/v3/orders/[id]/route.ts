
/**
 * WooCommerce Legacy API Endpoint - /wc-api/v3/orders/[id]
 * Get or update a specific order (legacy endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWooCommerceAuth, createUnauthorizedResponse } from '@/lib/woocommerce-auth';
import { mapOrderToWooCommerce } from '@/lib/woocommerce-mapper';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /wc-api/v3/orders/[id]
 * Get a specific order
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const resolvedParams = await params;
  console.log('[WooCommerce API - Legacy] GET /wc-api/v3/orders/' + resolvedParams.id);
  
  // Verify authentication
  const auth = await verifyWooCommerceAuth(request);
  if (!auth.valid) {
    return createUnauthorizedResponse();
  }
  
  try {
    const orderId = resolvedParams.id;
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true
      }
    });
    
    if (!order) {
      return NextResponse.json(
        {
          code: 'woocommerce_rest_order_invalid_id',
          message: 'Invalid order ID.',
          data: { status: 404 }
        },
        { status: 404 }
      );
    }
    
    // Fetch products for order items
    const productIds = order.items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      }
    });
    
    const wcOrder = mapOrderToWooCommerce(order, products);
    
    console.log(`[WooCommerce API - Legacy] ✅ Returning order ${orderId}`);
    
    return NextResponse.json(wcOrder);
  } catch (error) {
    console.error('[WooCommerce API - Legacy] Error:', error);
    return NextResponse.json(
      {
        code: 'woocommerce_rest_error',
        message: 'Failed to fetch order',
        data: { status: 500 }
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /wc-api/v3/orders/[id]
 * Update order status (for fulfillment updates from POD)
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const resolvedParams = await params;
  console.log('[WooCommerce API - Legacy] PUT /wc-api/v3/orders/' + resolvedParams.id);
  
  // Verify authentication
  const auth = await verifyWooCommerceAuth(request);
  if (!auth.valid) {
    return createUnauthorizedResponse();
  }
  
  try {
    const orderId = resolvedParams.id;
    const body = await request.json();
    
    console.log('[WooCommerce API - Legacy] Updating order:', orderId, body);
    
    // Map WooCommerce status to our status
    const statusMap: Record<string, string> = {
      'pending': 'PENDING',
      'processing': 'PROCESSING',
      'completed': 'SHIPPED',
      'cancelled': 'CANCELLED'
    };
    
    const updateData: any = {};
    
    if (body.status) {
      updateData.status = statusMap[body.status] || body.status;
    }
    
    if (body.meta_data) {
      const trackingNumber = body.meta_data.find((m: any) => m.key === '_tracking_number')?.value;
      if (trackingNumber) {
        updateData.trackingNumber = trackingNumber;
      }
    }
    
    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: true
      }
    });
    
    // Fetch products for order items
    const productIds = order.items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      }
    });
    
    const wcOrder = mapOrderToWooCommerce(order, products);
    
    console.log(`[WooCommerce API - Legacy] ✅ Updated order ${orderId}`);
    
    return NextResponse.json(wcOrder);
  } catch (error) {
    console.error('[WooCommerce API - Legacy] Error:', error);
    return NextResponse.json(
      {
        code: 'woocommerce_rest_error',
        message: 'Failed to update order',
        data: { status: 500 }
      },
      { status: 500 }
    );
  }
}
