import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * COMPLETELY NEW COMPOSITE LAYERING SYSTEM
 * Uses SVG masks and composite operations for 100% fabric coverage
 * NO PIXEL MANIPULATION - Uses Sharp.js composite blending instead
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mockupPath = searchParams.get('mockup');
    const color = searchParams.get('color');
    
    if (!mockupPath || !color) {
      return NextResponse.json(
        { error: 'Missing mockup path or color parameter' },
        { status: 400 }
      );
    }
    
    // Validate color format
    if (!/^#[0-9A-F]{6}$/i.test(color)) {
      return NextResponse.json(
        { error: 'Invalid color format. Use hex format like #FF0000' },
        { status: 400 }
      );
    }
    
    // NEW APPROACH: Use composite layering with SVG mask
    const coloredBuffer = await createCompositeLayeredMockup(mockupPath, color);
    
    // Return the colored image with no-cache headers to force refresh
    return new NextResponse(coloredBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });
    
  } catch (error) {
    console.error('Error in composite layering API:', error);
    return NextResponse.json(
      { error: 'Failed to generate composite layered mockup' },
      { status: 500 }
    );
  }
}

/**
 * COMPOSITE LAYERING APPROACH
 * Creates a solid color layer and uses SVG mask for precise fabric area targeting
 * This completely replaces pixel manipulation with Sharp.js composite operations
 */
async function createCompositeLayeredMockup(mockupPath: string, targetColor: string): Promise<Buffer> {
  try {
    console.log(`Starting composite layering for ${mockupPath} with color ${targetColor}`);
    
    // Load the original mockup image
    const mockupFilePath = path.join(process.cwd(), 'public', mockupPath);
    const originalBuffer = await readFile(mockupFilePath);
    
    // Get image dimensions
    const originalImage = sharp(originalBuffer);
    const { width, height } = await originalImage.metadata();
    
    if (!width || !height) {
      throw new Error('Could not get image dimensions');
    }

    console.log(`Image dimensions: ${width}x${height}`);

    // Step 1: Create a solid color layer the same size as the original
    const colorLayer = await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: targetColor + 'FF' // Add full alpha
      }
    })
    .png()
    .toBuffer();

    console.log('Created solid color layer');

    // Step 2: Load and render the SVG mask as a PNG
    const maskPath = path.join(process.cwd(), 'public/mockups/basketball_hoodie_mask.svg');
    const maskBuffer = await readFile(maskPath);
    
    // Render SVG mask to PNG at the same dimensions
    const renderedMask = await sharp(maskBuffer)
      .resize(width, height)
      .png()
      .toBuffer();

    console.log('Rendered SVG mask to PNG');

    // Step 3: Apply the mask to the color layer using dest-in blend
    const maskedColorLayer = await sharp(colorLayer)
      .composite([{
        input: renderedMask,
        blend: 'dest-in' // Use mask as alpha channel - only keep color where mask is white
      }])
      .png()
      .toBuffer();

    console.log('Applied mask to color layer');

    // Step 4: Composite the masked color layer over the original image
    const result = await sharp(originalBuffer)
      .composite([
        {
          input: maskedColorLayer,
          blend: 'over' // Place colored fabric over original image
        }
      ])
      .png()
      .toBuffer();

    console.log(`Successfully created composite layered mockup`);
    return result;

  } catch (error) {
    console.error('Error in composite layering:', error);
    throw error;
  }
}
