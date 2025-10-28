
import { NextRequest, NextResponse } from 'next/server';
import { verifyWooCommerceAuth, createUnauthorizedResponse } from '@/lib/woocommerce-auth';
import { mapProductToWooCommerce } from '@/lib/woocommerce-mapper';
import { prisma } from '@/lib/db';

/**
 * GET /wp-json/wc/v3/products/[id]
 * Get a single product by ID
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
    const productId = params.id;
    
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      return NextResponse.json(
        {
          code: 'woocommerce_rest_product_invalid_id',
          message: 'Invalid product ID',
          data: { status: 404 }
        },
        { status: 404 }
      );
    }
    
    const wcProduct = mapProductToWooCommerce(product);
    
    console.log(`[WooCommerce API] ✅ Returning product: ${product.id} - ${product.name}`);
    
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

/**
 * PUT /wp-json/wc/v3/products/[id]
 * Update a product
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[WooCommerce API] PUT /wp-json/wc/v3/products/${params.id}`);
  
  // Verify authentication
  const auth = await verifyWooCommerceAuth(request);
  if (!auth.valid) {
    return createUnauthorizedResponse();
  }
  
  try {
    const productId = params.id;
    const body = await request.json();
    
    console.log(`[WooCommerce API] Update data:`, JSON.stringify(body, null, 2));
    
    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!existingProduct) {
      return NextResponse.json(
        {
          code: 'woocommerce_rest_product_invalid_id',
          message: 'Invalid product ID',
          data: { status: 404 }
        },
        { status: 404 }
      );
    }
    
    // Extract update data
    const {
      name,
      status,
      description,
      short_description,
      sku,
      regular_price,
      sale_price,
      price,
      categories,
      images,
      attributes,
      meta_data
    } = body;
    
    // Prepare update data
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    
    // Handle price updates
    if (price !== undefined) {
      updateData.price = parseFloat(price);
    } else if (sale_price !== undefined) {
      updateData.price = parseFloat(sale_price);
    } else if (regular_price !== undefined) {
      updateData.price = parseFloat(regular_price);
    }
    
    // Handle status updates - if status is 'publish', make sure product is in stock
    if (status !== undefined) {
      updateData.inStock = status === 'publish';
      if (status === 'publish' && existingProduct.stock === 0) {
        updateData.stock = 100; // Set default stock for published products
      }
    }
    
    // Handle SKU update
    if (sku !== undefined) updateData.sku = sku;
    
    // Handle images
    if (images !== undefined && Array.isArray(images)) {
      const imageUrls = images.map((img: any) => img.src || img.url || img).filter(Boolean);
      if (imageUrls.length > 0) {
        updateData.imageUrl = imageUrls[0];
        updateData.images = imageUrls;
      }
    }
    
    // Update metadata
    if (meta_data || categories || attributes) {
      const metadata = existingProduct.metadata as any || {};
      
      if (status !== undefined) {
        metadata.status = status;
      }
      
      if (categories) {
        metadata.categories = categories.map((cat: any) => cat.name || cat);
      }
      
      if (attributes) {
        metadata.attributes = attributes;
      }
      
      if (meta_data) {
        meta_data.forEach((item: any) => {
          metadata[item.key] = item.value;
        });
      }
      
      updateData.metadata = metadata;
    }
    
    console.log(`[WooCommerce API] Updating product ${productId} with:`, JSON.stringify(updateData, null, 2));
    
    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData
    });
    
    console.log(`[WooCommerce API] ✅ Updated product: ${updatedProduct.id} - ${updatedProduct.name}`);
    
    // Map to WooCommerce format and return
    const wcProduct = mapProductToWooCommerce(updatedProduct);
    
    return NextResponse.json(wcProduct);
  } catch (error) {
    console.error('[WooCommerce API] ❌ Error updating product:', error);
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
 * PATCH /wp-json/wc/v3/products/[id]
 * Partial update of a product (same as PUT in our case)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return PUT(request, { params });
}

/**
 * DELETE /wp-json/wc/v3/products/[id]
 * Delete a product
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[WooCommerce API] DELETE /wp-json/wc/v3/products/${params.id}`);
  
  // Verify authentication
  const auth = await verifyWooCommerceAuth(request);
  if (!auth.valid) {
    return createUnauthorizedResponse();
  }
  
  try {
    const productId = params.id;
    
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      return NextResponse.json(
        {
          code: 'woocommerce_rest_product_invalid_id',
          message: 'Invalid product ID',
          data: { status: 404 }
        },
        { status: 404 }
      );
    }
    
    // Delete the product
    await prisma.product.delete({
      where: { id: productId }
    });
    
    console.log(`[WooCommerce API] ✅ Deleted product: ${productId}`);
    
    // Return the deleted product data
    const wcProduct = mapProductToWooCommerce(product);
    
    return NextResponse.json(wcProduct);
  } catch (error) {
    console.error('[WooCommerce API] Error:', error);
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
