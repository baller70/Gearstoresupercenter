
/**
 * WooCommerce Legacy API Endpoint - /wc-api/v3/products
 * List all products (legacy endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWooCommerceAuth, createUnauthorizedResponse } from '@/lib/woocommerce-auth';
import { mapProductToWooCommerce } from '@/lib/woocommerce-mapper';
import { prisma } from '@/lib/db';

/**
 * GET /wc-api/v3/products
 * List all products (legacy endpoint)
 */
export async function GET(request: NextRequest) {
  console.log('[WooCommerce API - Legacy] GET /wc-api/v3/products');
  
  // Verify authentication
  const auth = await verifyWooCommerceAuth(request);
  if (!auth.valid) {
    return createUnauthorizedResponse();
  }
  
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('per_page') || '10');
    const search = url.searchParams.get('search');
    
    // Build where clause
    const where: any = {};
    
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }
    
    // Fetch products
    const products = await prisma.product.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * perPage,
      take: perPage
    });
    
    console.log(`[WooCommerce API - Legacy] Found ${products.length} products`);
    
    // Map to WooCommerce format
    const wcProducts = products.map(mapProductToWooCommerce);
    
    // Get total count for pagination headers
    const totalProducts = await prisma.product.count({ where });
    const totalPages = Math.ceil(totalProducts / perPage);
    
    console.log(`[WooCommerce API - Legacy] ✅ Returning ${wcProducts.length} products`);
    
    return NextResponse.json(wcProducts, {
      headers: {
        'X-WP-Total': totalProducts.toString(),
        'X-WP-TotalPages': totalPages.toString(),
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[WooCommerce API - Legacy] Error:', error);
    return NextResponse.json(
      {
        code: 'woocommerce_rest_error',
        message: 'Failed to fetch products',
        data: { status: 500 }
      },
      { status: 500 }
    );
  }
}
