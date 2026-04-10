import { NextRequest, NextResponse } from 'next/server';
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
    const { templateId, colorId, customColor, selectedSizes, layers, quantity } = body;

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

    // Generate a unique design ID (for session-based storage)
    const designId = `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Return design configuration (can be stored in session/localStorage on client)
    // This allows the design to be added to cart without requiring user authentication
    return NextResponse.json({
      success: true,
      designId,
      design: {
        id: designId,
        name: `Custom ${template.name}`,
        templateId,
        colorId,
        customColor,
        layers,
        selectedSizes: validSizes,
        quantity,
      },
      template: {
        id: template.id,
        name: template.name,
        category: template.category,
      },
      color: customColor || colorId,
      sizes: validSizes,
      quantity,
      pricing: {
        basePrice,
        totalPrice,
        perItem: basePrice,
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

