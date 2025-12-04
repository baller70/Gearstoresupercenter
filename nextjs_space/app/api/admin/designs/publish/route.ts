import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateMockupWithLogo } from '@/lib/real-mockup-generator';
import { DEFAULT_BUSINESS_ID } from '@/lib/constants';
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

    // Get logo - it's stored in S3, so we need to download it first
    let logoPath: string;
    
    // Check if the imageUrl is an S3 key (doesn't start with / or http)
    if (!design.imageUrl.startsWith('/') && !design.imageUrl.startsWith('http')) {
      // Download from S3 to a temporary location
      const { downloadFile } = await import('@/lib/s3');
      const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
      const { createS3Client, getBucketConfig } = await import('@/lib/aws-config');
      
      const s3Client = createS3Client();
      const { bucketName } = getBucketConfig();
      
      // Download the file content from S3
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: design.imageUrl,
      });
      
      const response = await s3Client.send(command);
      const chunks: Uint8Array[] = [];
      
      // @ts-ignore
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      
      const buffer = Buffer.concat(chunks);
      
      // Save to temporary file
      const tempDir = path.join(process.cwd(), 'public', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      logoPath = path.join(tempDir, `logo-${designId}-${Date.now()}.png`);
      fs.writeFileSync(logoPath, buffer);
      
      console.log(`Downloaded logo from S3 to: ${logoPath}`);
    } else {
      // Local file path
      logoPath = path.join(process.cwd(), 'public', design.imageUrl.replace(/^\/+/, ''));
      
      if (!fs.existsSync(logoPath)) {
        throw new Error('Logo file not found: ' + logoPath);
      }
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
          
          // Only generate mockup for the front view to start
          const angle = 'front';
          const positionKey = `${productType.type}-${angle}`;
          const savedPosition = positions?.[positionKey];
          
          // Use saved position or defaults
          const placement = savedPosition ? {
            x: savedPosition.x,
            y: savedPosition.y,
            width: savedPosition.scale * 20, // Convert scale to width percentage
            rotation: savedPosition.rotation,
          } : undefined;
          
          // Generate mockup with logo
          const mockupType = productType.type;
          
          console.log(`[Publish] Generating mockup for ${productType.name} - ${color.name}`, {
            mockupType,
            logoPath,
            placement,
            colorHex: color.hex
          });
          
          // Pass color tint to the mockup generator
          const mockupPath = await generateMockupWithLogo(
            logoPath,
            mockupType,
            placement,
            undefined, // outputPath (auto-generated)
            color // color tint
          );
          
          console.log(`[Publish] Generated mockup at absolute path: ${mockupPath}`);
          
          // Convert absolute path to relative URL
          const publicDir = path.join(process.cwd(), 'public');
          let relativePath: string;
          
          if (mockupPath.startsWith(publicDir)) {
            relativePath = mockupPath.substring(publicDir.length);
          } else if (mockupPath.startsWith('/home/ubuntu/basketball_ecommerce_platform/nextjs_space/public')) {
            relativePath = mockupPath.replace('/home/ubuntu/basketball_ecommerce_platform/nextjs_space/public', '');
          } else {
            relativePath = mockupPath.replace(process.cwd() + '/public', '');
          }
          
          // Ensure path starts with /
          if (!relativePath.startsWith('/')) {
            relativePath = '/' + relativePath;
          }
          
          mockupImages.push(relativePath);
          
          console.log(`[Publish] Mockup relative path: ${relativePath}`);

          // Use mockup image as both main image and gallery image
          const mainImage = relativePath;
          
          const product = await prisma.product.create({
            data: {
              businessId: design.businessId || DEFAULT_BUSINESS_ID,
              name: `${design.name} - ${productType.name}`,
              description: `Premium ${productType.name.toLowerCase()} featuring ${design.name} design in ${color.name}. Perfect for basketball teams and fans. High-quality materials with custom logo placement.`,
              price: productType.price,
              category: productType.category,
              brand: design.brand || 'Basketball Factory',
              imageUrl: mainImage,
              images: mockupImages,
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

    // Clean up temporary logo file if it was downloaded from S3
    if (!design.imageUrl.startsWith('/') && !design.imageUrl.startsWith('http')) {
      try {
        if (fs.existsSync(logoPath)) {
          fs.unlinkSync(logoPath);
          console.log(`Cleaned up temporary logo file: ${logoPath}`);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
        // Don't fail the request if cleanup fails
      }
    }

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
