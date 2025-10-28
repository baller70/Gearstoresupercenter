
/**
 * WooCommerce Legacy API Endpoint - /wc-api/v3/products/[id]
 * Get a specific product (legacy endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWooCommerceAuth, createUnauthorizedResponse } from '@/lib/woocommerce-auth';
import { mapProductToWooCommerce } from '@/lib/woocommerce-mapper';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /wc-api/v3/products/[id]
 * Get a specific product
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const resolvedParams = await params;
  console.log('[WooCommerce API - Legacy] GET /wc-api/v3/products/' + resolvedParams.id);
  
  // Verify authentication
  const auth = await verifyWooCommerceAuth(request);
  if (!auth.valid) {
    return createUnauthorizedResponse();
  }
  
  try {
    const productId = resolvedParams.id;
    
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      return NextResponse.json(
        {
          code: 'woocommerce_rest_product_invalid_id',
          message: 'Invalid product ID.',
          data: { status: 404 }
        },
        { status: 404 }
      );
    }
    
    const wcProduct = mapProductToWooCommerce(product);
    
    console.log(`[WooCommerce API - Legacy] ✅ Returning product ${productId}`);
    
    return NextResponse.json(wcProduct);
  } catch (error) {
    console.error('[WooCommerce API - Legacy] Error:', error);
    return NextResponse.json(
      {
        code: 'woocommerce_rest_error',
        message: 'Failed to fetch product',
        data: { status: 500 }
      },
      { status: 500 }
    );
  }
}
