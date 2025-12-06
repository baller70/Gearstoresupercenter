import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { printfulClient, BASKETBALL_PRODUCTS } from '@/lib/printful-client';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessId, productTypes, profitMarginPercent = 100 } = await req.json();

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const typesToSync = productTypes || Object.keys(BASKETBALL_PRODUCTS);
    const syncedProducts = [];

    for (const productType of typesToSync) {
      const printfulProduct = BASKETBALL_PRODUCTS[productType as keyof typeof BASKETBALL_PRODUCTS];
      
      if (!printfulProduct) {
        console.warn(`Unknown product type: ${productType}`);
        continue;
      }

      const variants = await printfulClient.getProductVariants(printfulProduct.id);
      const pricing = await printfulClient.calculateProductPricing(printfulProduct.id, profitMarginPercent);

      const colorGroups = new Map<string, typeof variants>();
      for (const variant of variants) {
        if (!colorGroups.has(variant.color)) {
          colorGroups.set(variant.color, []);
        }
        colorGroups.get(variant.color)!.push(variant);
      }

      for (const [color, colorVariants] of colorGroups) {
        const firstVariant = colorVariants[0];
        const variantPricing = pricing.get(firstVariant.id);

        if (!variantPricing) continue;

        const sizes = colorVariants.map(v => v.size).filter(Boolean);
        const availableSizes = [...new Set(sizes)];

        const product = await prisma.product.create({
          data: {
            businessId,
            name: `${printfulProduct.name} - ${color}`,
            description: `High-quality ${productType} in ${color}`,
            price: variantPricing.retail,
            category: 'POD_PRODUCTS',
            imageUrl: firstVariant.image || '',
            sizes: availableSizes,
            colors: [color],
            printifyProductId: printfulProduct.id.toString(),
            printifyVariantId: firstVariant.id,
            metadata: {
              printfulProductId: printfulProduct.id,
              printfulVariants: colorVariants.map(v => ({
                id: v.id,
                size: v.size,
                color: v.color,
                colorCode: v.color_code,
                cost: parseFloat(v.price),
                retail: variantPricing.retail,
                inStock: v.in_stock,
              })),
              profitMargin: profitMarginPercent,
              baseCost: variantPricing.cost,
              profit: variantPricing.profit,
            },
          },
        });

        syncedProducts.push({
          id: product.id,
          name: product.name,
          color,
          sizes: availableSizes,
          price: product.price,
          printfulProductId: printfulProduct.id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedProducts.length} products from Printful`,
      products: syncedProducts,
    });

  } catch (error: any) {
    console.error('[Printful Sync Error]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync products' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productType = searchParams.get('productType');

    if (productType) {
      const printfulProduct = BASKETBALL_PRODUCTS[productType as keyof typeof BASKETBALL_PRODUCTS];
      
      if (!printfulProduct) {
        return NextResponse.json({ error: 'Invalid product type' }, { status: 400 });
      }

      const variants = await printfulClient.getProductVariants(printfulProduct.id);
      const pricing = await printfulClient.calculateProductPricing(printfulProduct.id);

      return NextResponse.json({
        product: printfulProduct,
        variants,
        pricing: Array.from(pricing.entries()).map(([id, p]) => ({ variantId: id, ...p })),
      });
    }

    const catalog = await printfulClient.getCatalogProducts();
    
    return NextResponse.json({
      catalog: catalog.slice(0, 50),
      basketballProducts: BASKETBALL_PRODUCTS,
    });

  } catch (error: any) {
    console.error('[Printful Catalog Error]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch catalog' },
      { status: 500 }
    );
  }
}
