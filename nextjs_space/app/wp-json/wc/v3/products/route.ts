
import { NextRequest, NextResponse } from 'next/server';
import { verifyWooCommerceAuth, createUnauthorizedResponse } from '@/lib/woocommerce-auth';
import { mapProductToWooCommerce } from '@/lib/woocommerce-mapper';
import { prisma } from '@/lib/db';

/**
 * GET /wp-json/wc/v3/products
 * List all products
 */
export async function GET(request: NextRequest) {
  console.log('[WooCommerce API] GET /wp-json/wc/v3/products');
  
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
    
    console.log(`[WooCommerce API] Found ${products.length} products`);
    
    // Map to WooCommerce format
    const wcProducts = products.map(mapProductToWooCommerce);
    
    // Get total count for pagination headers
    const totalProducts = await prisma.product.count({ where });
    const totalPages = Math.ceil(totalProducts / perPage);
    
    console.log(`[WooCommerce API] ✅ Returning ${wcProducts.length} products`);
    
    return NextResponse.json(wcProducts, {
      headers: {
        'X-WP-Total': totalProducts.toString(),
        'X-WP-TotalPages': totalPages.toString(),
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[WooCommerce API] Error:', error);
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

/**
 * POST /wp-json/wc/v3/products
 * Create a new product
 */
async function logToDebugger(logData: any) {
  try {
    await fetch('http://localhost:3000/api/admin/debug/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    });
  } catch (error) {
    // Silently fail - debug logging shouldn't break the main flow
  }
}

export async function POST(request: NextRequest) {
  console.log('[WooCommerce API] POST /wp-json/wc/v3/products');
  
  // Log the raw headers for debugging
  const headersList: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headersList[key] = value;
  });
  console.log('[WooCommerce API] Request headers:', JSON.stringify(headersList, null, 2));
  
  // Verify authentication
  const auth = await verifyWooCommerceAuth(request);
  console.log('[WooCommerce API] Auth result:', { valid: auth.valid, userId: auth.userId });
  
  if (!auth.valid) {
    console.log('[WooCommerce API] ❌ AUTH FAILED - Returning 401');
    
    // Log to debugger
    await logToDebugger({
      method: 'POST',
      url: '/wp-json/wc/v3/products',
      headers: headersList,
      body: null,
      status: 401,
      response: { error: 'Authentication failed' },
      error: 'Invalid or missing authentication credentials'
    });
    
    return createUnauthorizedResponse();
  }
  
  let body: any;
  try {
    body = await request.json();
  } catch (jsonError) {
    console.error('[WooCommerce API] ❌ Failed to parse JSON body:', jsonError);
    return NextResponse.json(
      {
        code: 'woocommerce_rest_invalid_json',
        message: 'Invalid JSON in request body',
        data: { status: 400 }
      },
      { status: 400 }
    );
  }
  
  console.log('[WooCommerce API] ===== NEW PRODUCT REQUEST =====');
  console.log('[WooCommerce API] Timestamp:', new Date().toISOString());
  console.log('[WooCommerce API] Auth User:', auth.userId);
  console.log('[WooCommerce API] Product data received:', JSON.stringify(body, null, 2));
  
  try {
    // Extract product data from WooCommerce format
    const {
      name,
      type = 'simple',
      status = 'publish',
      description = '',
      short_description = '',
      sku = '',
      regular_price,
      sale_price,
      price,
      categories = [],
      images = [],
      attributes = [],
      variations = [],
      meta_data = []
    } = body;
    
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        {
          code: 'woocommerce_rest_product_invalid_name',
          message: 'Product name is required',
          data: { status: 400 }
        },
        { status: 400 }
      );
    }
    
    // Extract POD metadata
    const podProvider = meta_data?.find((m: any) => m.key === '_pod_provider')?.value || 'jetprint';
    const podProductId = meta_data?.find((m: any) => m.key === '_pod_product_id')?.value;
    const podVariantId = meta_data?.find((m: any) => m.key === '_pod_variant_id')?.value;
    
    // Determine final price
    const finalPrice = price || sale_price || regular_price || '0';
    
    // Process images - extract URLs
    const imageUrls = images.map((img: any) => img.src || img.url || img).filter(Boolean);
    const mainImage = imageUrls[0] || '';
    
    // Process categories - extract names
    const categoryNames = categories.map((cat: any) => cat.name || cat).filter(Boolean);
    
    // Determine the category - default to POD_PRODUCTS for POD items
    let productCategory: 'PERFORMANCE_APPAREL' | 'CASUAL_WEAR' | 'ACCESSORIES' | 'POD_PRODUCTS' = 'POD_PRODUCTS';
    
    // Try to map to existing categories if specified
    const categoryString = categoryNames.join(' ').toLowerCase();
    if (categoryString.includes('performance') || categoryString.includes('apparel') || categoryString.includes('athletic')) {
      productCategory = 'PERFORMANCE_APPAREL';
    } else if (categoryString.includes('casual') || categoryString.includes('wear')) {
      productCategory = 'CASUAL_WEAR';
    } else if (categoryString.includes('accessories') || categoryString.includes('accessory')) {
      productCategory = 'ACCESSORIES';
    }
    
    // Generate SKU if not provided, but use provided SKU if available
    const productSku = sku || `${podProvider}-${Date.now()}`;
    
    console.log('[WooCommerce API] Creating product with SKU:', productSku);
    
    // Create the product
    const product = await prisma.product.create({
      data: {
        name,
        description: description || short_description || '',
        price: parseFloat(finalPrice),
        category: productCategory,
        imageUrl: mainImage,
        images: imageUrls,
        stock: status === 'publish' ? 100 : 0,
        sku: productSku,
        inStock: status === 'publish',
        // Store POD metadata in JSON fields
        metadata: {
          podProvider,
          podProductId,
          podVariantId,
          type,
          status,
          regularPrice: regular_price,
          salePrice: sale_price,
          categories: categoryNames,
          attributes: attributes,
          variations: variations,
          metaData: meta_data,
          originalSku: sku  // Store the original SKU from POD provider
        }
      }
    });
    
    console.log(`[WooCommerce API] ✅ Created product: ${product.id} - ${product.name}`);
    
    // Map to WooCommerce format and return
    const wcProduct = mapProductToWooCommerce(product);
    
    // Log success to debugger
    await logToDebugger({
      method: 'POST',
      url: '/wp-json/wc/v3/products',
      headers: headersList,
      body,
      status: 201,
      response: wcProduct
    });
    
    return NextResponse.json(wcProduct, { status: 201 });
  } catch (error) {
    console.error('[WooCommerce API] ❌ ERROR creating product');
    console.error('[WooCommerce API] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[WooCommerce API] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[WooCommerce API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    const errorResponse = {
      code: 'woocommerce_rest_error',
      message: error instanceof Error ? error.message : 'Failed to create product',
      data: { 
        status: 500,
        error_details: error instanceof Error ? error.message : String(error)
      }
    };
    
    // Log error to debugger
    await logToDebugger({
      method: 'POST',
      url: '/wp-json/wc/v3/products',
      headers: headersList,
      body,
      status: 500,
      response: errorResponse,
      error: error instanceof Error ? error.stack || error.message : String(error)
    });
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
