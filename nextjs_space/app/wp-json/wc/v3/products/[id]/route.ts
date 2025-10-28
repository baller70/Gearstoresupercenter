
import { NextRequest, NextResponse } from 'next/server';
import { verifyWooCommerceAuth, createUnauthorizedResponse } from '@/lib/woocommerce-auth';
import { mapProductToWooCommerce } from '@/lib/woocommerce-mapper';
import { prisma } from '@/lib/db';

/**
 * GET /wp-json/wc/v3/products/{id}
 * Get a single product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[WooCommerce API] GET /wp-json/wc/v3/products/${params.id}`);
  
  // Verify authentication
  const auth = await verifyWooCommerceAuth(request);
  if (!auth.valid) {
    return createUnauthorizedResponse();
  }
  
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id }
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
    
    console.log(`[WooCommerce API] ✅ Returning product ${params.id}`);
    return NextResponse.json(wcProduct);
  } catch (error) {
    console.error('[WooCommerce API] Error:', error);
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
