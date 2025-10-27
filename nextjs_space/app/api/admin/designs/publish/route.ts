
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { designId, positions, colorVariants } = await request.json();

    if (!designId) {
      return NextResponse.json({ error: 'Design ID required' }, { status: 400 });
    }

    const design = await prisma.design.findUnique({
      where: { id: designId },
    });

    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 });
    }

    const productTypes = [
      { type: 'basketball-tshirt', name: 'Basketball T-Shirt', category: 'PERFORMANCE_APPAREL' as const, price: 29.99 },
      { type: 'basketball-jersey', name: 'Basketball Jersey', category: 'PERFORMANCE_APPAREL' as const, price: 49.99 },
      { type: 'basketball-hoodie', name: 'Basketball Hoodie', category: 'PERFORMANCE_APPAREL' as const, price: 59.99 },
      { type: 'basketball-sweatshirt', name: 'Basketball Sweatshirt', category: 'PERFORMANCE_APPAREL' as const, price: 44.99 },
      { type: 'basketball-shorts', name: 'Basketball Shorts', category: 'PERFORMANCE_APPAREL' as const, price: 34.99 },
    ];

    const enabledColors = colorVariants || [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Black', hex: '#000000' },
    ];

    let productsCreated = 0;

    // Create products for each type and color combination
    for (const productType of productTypes) {
      for (const color of enabledColors) {
        try {
          // Check if product already exists
          const existingProduct = await prisma.product.findFirst({
            where: {
              designId: design.id,
              name: {
                contains: productType.name,
              },
              description: {
                contains: color.name,
              },
            },
          });

          if (existingProduct) {
            console.log(`Product already exists: ${productType.name} - ${color.name}`);
            continue;
          }

          const product = await prisma.product.create({
            data: {
              name: `${design.name} - ${productType.name}`,
              description: `Premium ${productType.name.toLowerCase()} featuring ${design.name} design in ${color.name}. Perfect for basketball teams and fans.`,
              price: productType.price,
              category: productType.category,
              brand: design.brand || 'Basketball Factory',
              imageUrl: design.imageUrl, // Placeholder, will be updated with mockup
              images: [design.imageUrl],
              inStock: true,
              featured: false,
              tags: ['basketball', 'custom-design', productType.type, color.name.toLowerCase()],
              sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
              colors: [color.hex],
              productType: productType.type,
              designId: design.id,
            },
          });

          productsCreated++;
        } catch (error) {
          console.error(`Error creating product for ${productType.name} - ${color.name}:`, error);
        }
      }
    }

    // Update design status to APPROVED
    await prisma.design.update({
      where: { id: designId },
      data: {
        status: 'APPROVED',
        logoPositions: positions || {},
        colorVariants: enabledColors,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Published ${productsCreated} products to store`,
      productsCreated,
    });

  } catch (error) {
    console.error('[Publish] Error:', error);
    return NextResponse.json(
      { error: 'Failed to publish design', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
