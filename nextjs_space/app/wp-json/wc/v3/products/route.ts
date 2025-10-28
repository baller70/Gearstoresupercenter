
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
export async function POST(request: NextRequest) {
  console.log('[WooCommerce API] POST /wp-json/wc/v3/products');
  
  // Verify authentication
  const auth = await verifyWooCommerceAuth(request);
  if (!auth.valid) {
    return createUnauthorizedResponse();
  }
  
  try {
    const body = await request.json();
    console.log('[WooCommerce API] Product data received:', JSON.stringify(body, null, 2));
    
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
    
    // Create the product
    const product = await prisma.product.create({
      data: {
        name,
        description: description || short_description || '',
        price: parseFloat(finalPrice),
        category: (categoryNames.join(', ') || 'POD Products') as any, // Cast to any to handle Category enum
        imageUrl: mainImage,
        images: imageUrls,
        stock: status === 'publish' ? 100 : 0,
        sku: sku || `${podProvider}-${Date.now()}`,
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
          metaData: meta_data
        }
      }
    });
    
    console.log(`[WooCommerce API] ✅ Created product: ${product.id} - ${product.name}`);
    
    // Map to WooCommerce format and return
    const wcProduct = mapProductToWooCommerce(product);
    
    return NextResponse.json(wcProduct, { status: 201 });
  } catch (error) {
    console.error('[WooCommerce API] Error creating product:', error);
    return NextResponse.json(
      {
        code: 'woocommerce_rest_error',
        message: error instanceof Error ? error.message : 'Failed to create product',
        data: { status: 500 }
      },
      { status: 500 }
    );
  }
}
