import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTemplateById } from '@/lib/product-templates';

export interface SaveDesignRequest {
  templateId: string;
  colorId: string;
  customColor?: string;
  selectedSizes: string[];
  layers: {
    id: string;
    type: 'logo' | 'text';
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    opacity: number;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    textColor?: string;
  }[];
  quantity: number;
  businessId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveDesignRequest = await request.json();
    const { templateId, colorId, customColor, selectedSizes, layers, quantity, businessId } = body;

    // Validate template
    const template = getTemplateById(templateId);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Validate sizes
    const validSizes = selectedSizes.filter(size => 
      template.availableSizes.some(s => s.id === size)
    );
    if (validSizes.length === 0) {
      return NextResponse.json({ error: 'No valid sizes selected' }, { status: 400 });
    }

    // Calculate price
    const basePrice = template.basePrice;
    const totalPrice = basePrice * quantity;

    // Create user design record
    const userDesign = await prisma.userDesign.create({
      data: {
        name: `Custom ${template.name}`,
        productType: templateId,
        logoUrl: layers.find(l => l.type === 'logo')?.content || '',
        positions: layers as any,
        metadata: {
          templateId,
          colorId,
          customColor,
          selectedSizes: validSizes,
          quantity,
          basePrice,
          totalPrice,
        },
        businessId: businessId || undefined,
      },
    });

    return NextResponse.json({
      success: true,
      designId: userDesign.id,
      template: {
        id: template.id,
        name: template.name,
      },
      color: customColor || colorId,
      sizes: validSizes,
      quantity,
      pricing: {
        basePrice,
        totalPrice,
        currency: 'USD',
      },
    });
  } catch (error) {
    console.error('Error saving design:', error);
    return NextResponse.json(
      { error: 'Failed to save design' },
      { status: 500 }
    );
  }
}

