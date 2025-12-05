
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { downloadFile, uploadFile } from '@/lib/storage.server';
import { advancedMockupGenerator } from '@/lib/advanced-mockup-generator';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

export async function POST(request: NextRequest) {
  let tempLogoPath: string | null = null;

  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { designId, productTypes, positionX, positionY, scale } = body;

    if (!designId || !productTypes || !Array.isArray(productTypes)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get design
    const design = await prisma.userDesign.findFirst({
      where: {
        id: designId,
        userId: user.id,
      },
    });

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      );
    }

    // Update design status
    await prisma.userDesign.update({
      where: { id: designId },
      data: { status: 'PROCESSING' },
    });

    // Download logo to temp file
    const logoBuffer = await downloadFile(design.logoUrl);
    const tempDir = os.tmpdir();
    const logoExt = path.extname(design.logoUrl) || '.png';
    tempLogoPath = path.join(tempDir, `logo-${design.id}${logoExt}`);
    await fs.writeFile(tempLogoPath, logoBuffer);

    console.log(`[Generate Mockups] Logo downloaded to: ${tempLogoPath}`);

    const position = {
      x: positionX || 50,
      y: positionY || 35,
      scale: scale || 1.0,
    };

    let mockupsCreated = 0;
    const errors: string[] = [];

    // Generate mockups for each product type
    for (const productType of productTypes) {
      console.log(`[Generate Mockups] Generating ${productType} in all colors...`);

      // Generate all color variants
      const colorVariants = await advancedMockupGenerator.generateAllColorVariants(
        tempLogoPath,
        productType,
        position
      );

      // Upload each variant to S3 and create database record
      for (const [colorId, mockupBuffer] of colorVariants.entries()) {
        try {
          const mockupPath = await uploadFile(
            mockupBuffer,
            `user-mockups/${design.id}/${productType}-${colorId}-${Date.now()}.png`
          );

          // Delete old mockup if exists
          await prisma.userMockup.deleteMany({
            where: {
              designId: design.id,
              productType,
              color: colorId,
            },
          });

          // Create new mockup record
          await prisma.userMockup.create({
            data: {
              designId: design.id,
              productType,
              angle: 'front',
              color: colorId,
              mockupUrl: mockupPath,
              positionX: position.x,
              positionY: position.y,
              scale: position.scale,
              approved: false,
            },
          });

          mockupsCreated++;
          console.log(`[Generate Mockups] ✅ Created ${productType} - ${colorId}`);
        } catch (error) {
          const errorMsg = `Failed to create ${productType} - ${colorId}: ${error}`;
          console.error(`[Generate Mockups] ❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }
    }

    // Update design status
    await prisma.userDesign.update({
      where: { id: designId },
      data: {
        status: 'READY',
        mockupsGenerated: true,
      },
    });

    // Clean up temp file
    if (tempLogoPath) {
      try {
        await fs.unlink(tempLogoPath);
      } catch (error) {
        console.error('Failed to clean up temp file:', error);
      }
    }

    return NextResponse.json({
      success: true,
      mockupsCreated,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully generated ${mockupsCreated} mockups`,
    });
  } catch (error) {
    console.error('Mockup generation error:', error);

    // Clean up temp file on error
    if (tempLogoPath) {
      try {
        await fs.unlink(tempLogoPath);
      } catch (cleanupError) {
        console.error('Failed to clean up temp file:', cleanupError);
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate mockups' },
      { status: 500 }
    );
  }
}
