
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

/**
 * PUT /wc-api/v3/products/[id]
 * Update a product
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const resolvedParams = await params;
  console.log(`[WooCommerce API - Legacy] PUT /wc-api/v3/products/${resolvedParams.id}`);
  
  // Verify authentication
  const auth = await verifyWooCommerceAuth(request);
  if (!auth.valid) {
    return createUnauthorizedResponse();
  }
  
  try {
    const body = await request.json();
    console.log('[WooCommerce API - Legacy] Update data received:', JSON.stringify(body, null, 2));
    
    const productId = resolvedParams.id;
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!existingProduct) {
      return NextResponse.json(
        {
          code: 'woocommerce_rest_product_invalid_id',
          message: 'Invalid product ID.',
          data: { status: 404 }
        },
        { status: 404 }
      );
    }
    
    // Extract product data from WooCommerce format
    const {
      name,
      type,
      status,
      description,
      short_description,
      sku,
      regular_price,
      sale_price,
      price,
      categories = [],
      images = [],
      attributes = [],
      variations = [],
      meta_data = []
    } = body;
    
    // Extract POD metadata
    const podProvider = meta_data?.find((m: any) => m.key === '_pod_provider')?.value;
    const podProductId = meta_data?.find((m: any) => m.key === '_pod_product_id')?.value;
    const podVariantId = meta_data?.find((m: any) => m.key === '_pod_variant_id')?.value;
    
    // Build update data (only update provided fields)
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined || short_description !== undefined) {
      updateData.description = description || short_description || existingProduct.description;
    }
    if (sku !== undefined) updateData.sku = sku;
    
    // Handle price updates
    const finalPrice = price || sale_price || regular_price;
    if (finalPrice !== undefined) {
      updateData.price = parseFloat(finalPrice);
    }
    
    // Handle images
    if (images && images.length > 0) {
      const imageUrls = images.map((img: any) => img.src || img.url || img).filter(Boolean);
      if (imageUrls[0]) {
        updateData.imageUrl = imageUrls[0];
        updateData.images = imageUrls;
      }
    }
    
    // Handle categories
    if (categories && categories.length > 0) {
      const categoryNames = categories.map((cat: any) => cat.name || cat).filter(Boolean);
      if (categoryNames.length > 0) {
        updateData.category = categoryNames.join(', ') as any; // Cast to any to handle Category enum
      }
    }
    
    // Handle stock status
    if (status !== undefined) {
      updateData.stock = status === 'publish' ? (existingProduct.stock || 100) : 0;
    }
    
    // Update metadata with new values
    const existingMetadata = (existingProduct.metadata as any) || {};
    updateData.metadata = {
      ...existingMetadata,
      ...(type !== undefined && { type }),
      ...(status !== undefined && { status }),
      ...(regular_price !== undefined && { regularPrice: regular_price }),
      ...(sale_price !== undefined && { salePrice: sale_price }),
      ...(images && images.length > 0 && { 
        images: images.map((img: any) => img.src || img.url || img).filter(Boolean) 
      }),
      ...(categories && categories.length > 0 && { 
        categories: categories.map((cat: any) => cat.name || cat).filter(Boolean) 
      }),
      ...(attributes && attributes.length > 0 && { attributes }),
      ...(variations && variations.length > 0 && { variations }),
      ...(meta_data && meta_data.length > 0 && { metaData: meta_data }),
      ...(podProvider && { podProvider }),
      ...(podProductId && { podProductId }),
      ...(podVariantId && { podVariantId })
    };
    
    // Update the product
    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData
    });
    
    console.log(`[WooCommerce API - Legacy] ✅ Updated product: ${product.id} - ${product.name}`);
    
    // Map to WooCommerce format and return
    const wcProduct = mapProductToWooCommerce(product);
    
    return NextResponse.json(wcProduct);
  } catch (error) {
    console.error('[WooCommerce API - Legacy] Error updating product:', error);
    return NextResponse.json(
      {
        code: 'woocommerce_rest_error',
        message: error instanceof Error ? error.message : 'Failed to update product',
        data: { status: 500 }
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /wc-api/v3/products/[id]
 * Delete a product
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const resolvedParams = await params;
  console.log(`[WooCommerce API - Legacy] DELETE /wc-api/v3/products/${resolvedParams.id}`);
  
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
    
    await prisma.product.delete({
      where: { id: productId }
    });
    
    console.log(`[WooCommerce API - Legacy] ✅ Deleted product ${productId}`);
    
    return NextResponse.json({
      id: product.id,
      message: 'Product permanently deleted'
    });
  } catch (error) {
    console.error('[WooCommerce API - Legacy] Error deleting product:', error);
    return NextResponse.json(
      {
        code: 'woocommerce_rest_error',
        message: 'Failed to delete product',
        data: { status: 500 }
      },
      { status: 500 }
    );
  }
}
