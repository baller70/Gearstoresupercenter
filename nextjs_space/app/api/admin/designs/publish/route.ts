
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateMockupWithLogo } from '@/lib/real-mockup-generator';
import path from 'path';
import fs from 'fs';

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

    // Default to Red, Gray, White, Black for Rise as One
    const enabledColors = colorVariants && colorVariants.length > 0 ? colorVariants : [
      { name: 'Red', hex: '#DC2626' },
      { name: 'Gray', hex: '#6B7280' },
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Black', hex: '#000000' },
    ];

    let productsCreated = 0;

    // Get logo path
    const logoPath = path.join(process.cwd(), 'public', design.imageUrl.replace(/^\/+/, ''));
    
    if (!fs.existsSync(logoPath)) {
      throw new Error('Logo file not found: ' + logoPath);
    }

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

          // Generate mockup images for front, back, and side views
          const mockupImages: string[] = [];
          
          for (const angle of ['front', 'back', 'side']) {
            const positionKey = `${productType.type}-${angle}`;
            const savedPosition = positions?.[positionKey];
            
            // Use saved position or defaults
            const placement = savedPosition ? {
              x: savedPosition.x,
              y: savedPosition.y,
              width: savedPosition.scale * 20, // Convert scale to width percentage
              rotation: savedPosition.rotation,
            } : undefined;
            
            try {
              // Generate mockup with logo using the specific angle
              const mockupType = angle === 'front' 
                ? productType.type 
                : `${productType.type}-${angle}`;
              
              const mockupPath = await generateMockupWithLogo(
                logoPath,
                mockupType,
                placement
              );
              
              // Convert absolute path to relative URL
              const relativePath = mockupPath.replace(process.cwd() + '/public', '');
              mockupImages.push(relativePath);
              
              console.log(`Generated ${angle} mockup for ${productType.name} - ${color.name}: ${relativePath}`);
            } catch (error) {
              console.error(`Error generating ${angle} mockup:`, error);
            }
          }

          // Use first mockup as main image, all mockups in images array
          const mainImage = mockupImages.length > 0 ? mockupImages[0] : design.imageUrl;
          
          const product = await prisma.product.create({
            data: {
              name: `${design.name} - ${productType.name}`,
              description: `Premium ${productType.name.toLowerCase()} featuring ${design.name} design in ${color.name}. Perfect for basketball teams and fans. High-quality materials with custom logo placement.`,
              price: productType.price,
              category: productType.category,
              brand: design.brand || 'Basketball Factory',
              imageUrl: mainImage,
              images: mockupImages.length > 0 ? mockupImages : [design.imageUrl],
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
          console.log(`Created product: ${product.name} with ${mockupImages.length} mockup images`);
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
      message: `Published ${productsCreated} products to store with mockup images`,
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
