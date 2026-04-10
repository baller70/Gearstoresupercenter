
/**
 * WooCommerce Legacy API Endpoint - /wc-api/v3/orders
 * Redirects to modern endpoint: /wp-json/wc/v3/orders
 * 
 * This provides backward compatibility for POD companies
 * using the older WooCommerce API path format.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWooCommerceAuth, createUnauthorizedResponse } from '@/lib/woocommerce-auth';
import { mapOrderToWooCommerce } from '@/lib/woocommerce-mapper';
import { prisma } from '@/lib/db';

/**
 * GET /wc-api/v3/orders
 * List all orders (legacy endpoint)
 */
export async function GET(request: NextRequest) {
  console.log('[WooCommerce API - Legacy] GET /wc-api/v3/orders');
  
  // Verify authentication
  const auth = await verifyWooCommerceAuth(request);
  if (!auth.valid) {
    console.log('[WooCommerce API - Legacy] ❌ Unauthorized');
    return createUnauthorizedResponse();
  }
  
  console.log('[WooCommerce API - Legacy] ✅ Authenticated');
  
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('per_page') || '10');
    const status = url.searchParams.get('status');
    const after = url.searchParams.get('after');
    
    // Build where clause
    const where: any = {};
    
    if (status) {
      const statusMap: Record<string, string> = {
        'pending': 'PENDING',
        'processing': 'PROCESSING',
        'completed': 'SHIPPED',
        'cancelled': 'CANCELLED'
      };
      where.status = statusMap[status] || 'PENDING';
    }
    
    if (after) {
      where.createdAt = {
        gte: new Date(after)
      };
    }
    
    // Fetch orders with items
    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * perPage,
      take: perPage
    });
    
    console.log(`[WooCommerce API - Legacy] Found ${orders.length} orders`);
    
    // Fetch all products referenced in orders
    const productIds = [...new Set(orders.flatMap(o => o.items.map(i => i.productId)))];
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      }
    });
    
    // Map to WooCommerce format
    const wcOrders = orders.map(order => mapOrderToWooCommerce(order, products));
    
    // Get total count for pagination headers
    const totalOrders = await prisma.order.count({ where });
    const totalPages = Math.ceil(totalOrders / perPage);
    
    console.log(`[WooCommerce API - Legacy] ✅ Returning ${wcOrders.length} orders`);
    
    return NextResponse.json(wcOrders, {
      headers: {
        'X-WP-Total': totalOrders.toString(),
        'X-WP-TotalPages': totalPages.toString(),
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[WooCommerce API - Legacy] ❌ Error:', error);
    return NextResponse.json(
      {
        code: 'woocommerce_rest_error',
        message: 'Failed to fetch orders',
        data: { status: 500 }
      },
      { status: 500 }
    );
  }
}

/**
 * POST /wc-api/v3/orders
 * Create a new order (legacy endpoint)
 */
export async function POST(request: NextRequest) {
  console.log('[WooCommerce API - Legacy] POST /wc-api/v3/orders');
  
  // Verify authentication
  const auth = await verifyWooCommerceAuth(request);
  if (!auth.valid) {
    return createUnauthorizedResponse();
  }
  
  try {
    const body = await request.json();
    console.log('[WooCommerce API - Legacy] Creating order:', body);
    
    return NextResponse.json(
      {
        code: 'woocommerce_rest_not_implemented',
        message: 'Order creation via API is not yet implemented',
        data: { status: 501 }
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('[WooCommerce API - Legacy] Error:', error);
    return NextResponse.json(
      {
        code: 'woocommerce_rest_error',
        message: 'Failed to create order',
        data: { status: 500 }
      },
      { status: 500 }
    );
  }
}
