
import { NextRequest, NextResponse } from 'next/server';
import { verifyWooCommerceAuth } from '@/lib/woocommerce-auth';

/**
 * GET /wp-json/wc/v3/system_status
 * System status endpoint for POD providers to verify connectivity
 */
export async function GET(request: NextRequest) {
  console.log('[WooCommerce API] GET /wp-json/wc/v3/system_status');
  
  // Verify authentication
  const auth = await verifyWooCommerceAuth(request);
  
  return NextResponse.json({
    environment: {
      home_url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      site_url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      version: '1.0.0',
      wc_version: '8.0.0', // Simulate WooCommerce version
      permalink_structure: '/%postname%/',
      https_status: true
    },
    database: {
      wc_database_version: '8.0.0',
      database_prefix: 'wp_',
      maxmind_geoip_database: 'Not installed',
      database_tables: {
        woocommerce: true,
        'woocommerce-products': true,
        'woocommerce-orders': true
      }
    },
    active_plugins: [
      'woocommerce/8.0.0'
    ],
    theme: {
      name: 'Basketball Factory',
      version: '1.0.0',
      author: 'Basketball Factory'
    },
    settings: {
      api_enabled: true,
      force_ssl: false,
      currency: 'USD',
      currency_symbol: '$',
      currency_position: 'left',
      thousand_separator: ',',
      decimal_separator: '.',
      number_of_decimals: 2,
      geolocation_enabled: false,
      taxonomies: {
        product_cat: 'product_cat',
        product_tag: 'product_tag'
      }
    },
    security: {
      secure_connection: true,
      hide_errors: true
    },
    pages: {
      shop_base: '/products',
      cart: '/cart',
      checkout: '/checkout',
      account: '/account'
    },
    authentication: {
      authenticated: auth.valid,
      user_id: auth.userId || null,
      permissions: ['read', 'write']
    },
    pod_integration: {
      jetprint_ready: true,
      interestprint_ready: true,
      product_creation: 'enabled',
      order_webhooks: 'enabled'
    }
  });
}
