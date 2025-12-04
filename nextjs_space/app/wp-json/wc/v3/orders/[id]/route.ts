
import { NextRequest, NextResponse } from 'next/server';
import { verifyWooCommerceAuth, createUnauthorizedResponse } from '@/lib/woocommerce-auth';
import { mapOrderToWooCommerce, mapWooCommerceStatus } from '@/lib/woocommerce-mapper';
import { prisma } from '@/lib/db';

/**
 * GET /wp-json/wc/v3/orders/{id}
 * Get a single order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[WooCommerce API] GET /wp-json/wc/v3/orders/${params.id}`);
  
  // Verify authentication
  const auth = await verifyWooCommerceAuth(request);
  if (!auth.valid) {
    return createUnauthorizedResponse();
  }
  
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true }
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
    
    // Fetch products
    const productIds = order.items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });
    
    const wcOrder = mapOrderToWooCommerce(order, products);
    
    console.log(`[WooCommerce API] ✅ Returning order ${params.id}`);
    return NextResponse.json(wcOrder);
  } catch (error) {
    console.error('[WooCommerce API] Error:', error);
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
 * PUT /wp-json/wc/v3/orders/{id}
 * Update an order (POD company updates status when fulfilled)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[WooCommerce API] PUT /wp-json/wc/v3/orders/${params.id}`);
  
  // Verify authentication
  const auth = await verifyWooCommerceAuth(request);
  if (!auth.valid) {
    return createUnauthorizedResponse();
  }
  
  try {
    const body = await request.json();
    console.log('[WooCommerce API] Update data:', body);
    
    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true }
    });
    
    if (!existingOrder) {
      return NextResponse.json(
        {
          code: 'woocommerce_rest_order_invalid_id',
          message: 'Invalid order ID.',
          data: { status: 404 }
        },
        { status: 404 }
      );
    }
    
    // Update order
    const updateData: any = {};
    
    if (body.status) {
      updateData.status = mapWooCommerceStatus(body.status);
      console.log(`[WooCommerce API] Updating status: ${body.status} -> ${updateData.status}`);
    }
    
    // Note: We don't have notes, trackingNumber, or trackingCarrier fields in our schema
    // POD companies can still update order status
    
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: { items: true }
    });
    
    console.log(`[WooCommerce API] ✅ Order ${params.id} updated`);
    
    // Fetch products and return updated order
    const productIds = updatedOrder.items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });
    
    const wcOrder = mapOrderToWooCommerce(updatedOrder, products);
    
    return NextResponse.json(wcOrder);
  } catch (error) {
    console.error('[WooCommerce API] Error:', error);
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

/**
 * DELETE /wp-json/wc/v3/orders/{id}
 * Delete an order (usually not used by POD companies)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[WooCommerce API] DELETE /wp-json/wc/v3/orders/${params.id}`);
  
  // Verify authentication
  const auth = await verifyWooCommerceAuth(request);
  if (!auth.valid) {
    return createUnauthorizedResponse();
  }
  
  try {
    // Soft delete - update status to cancelled
    const order = await prisma.order.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
      include: { items: true }
    });
    
    const productIds = order.items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });
    
    const wcOrder = mapOrderToWooCommerce(order, products);
    
    console.log(`[WooCommerce API] ✅ Order ${params.id} deleted (cancelled)`);
    return NextResponse.json(wcOrder);
  } catch (error) {
    console.error('[WooCommerce API] Error:', error);
    return NextResponse.json(
      {
        code: 'woocommerce_rest_error',
        message: 'Failed to delete order',
        data: { status: 500 }
      },
      { status: 500 }
    );
  }
}
