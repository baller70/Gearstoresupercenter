
/**
 * WooCommerce Legacy API Endpoint - /wc-api/v3/webhooks
 * Webhook management (legacy endpoint)
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWooCommerceAuth, createUnauthorizedResponse } from '@/lib/woocommerce-auth';

/**
 * GET /wc-api/v3/webhooks
 * List all webhooks (legacy endpoint)
 */
export async function GET(request: NextRequest) {
  console.log('[WooCommerce API - Legacy] GET /wc-api/v3/webhooks');
  
  // Verify authentication
  const auth = await verifyWooCommerceAuth(request);
  if (!auth.valid) {
    return createUnauthorizedResponse();
  }
  
  try {
    // For now, return empty array as webhooks are not yet implemented
    console.log('[WooCommerce API - Legacy] ✅ Returning webhooks (empty)');
    
    return NextResponse.json([]);
  } catch (error) {
    console.error('[WooCommerce API - Legacy] Error:', error);
    return NextResponse.json(
      {
        code: 'woocommerce_rest_error',
        message: 'Failed to fetch webhooks',
        data: { status: 500 }
      },
      { status: 500 }
    );
  }
}

/**
 * POST /wc-api/v3/webhooks
 * Create a webhook (legacy endpoint)
 */
export async function POST(request: NextRequest) {
  console.log('[WooCommerce API - Legacy] POST /wc-api/v3/webhooks');
  
  // Verify authentication
  const auth = await verifyWooCommerceAuth(request);
  if (!auth.valid) {
    return createUnauthorizedResponse();
  }
  
  try {
    const body = await request.json();
    console.log('[WooCommerce API - Legacy] Creating webhook:', body);
    
    // Webhooks not yet implemented
    return NextResponse.json(
      {
        code: 'woocommerce_rest_not_implemented',
        message: 'Webhook creation is not yet implemented',
        data: { status: 501 }
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('[WooCommerce API - Legacy] Error:', error);
    return NextResponse.json(
      {
        code: 'woocommerce_rest_error',
        message: 'Failed to create webhook',
        data: { status: 500 }
      },
      { status: 500 }
    );
  }
}
