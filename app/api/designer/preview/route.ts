import { NextRequest, NextResponse } from 'next/server';
import { getTemplateById, getColorById, STANDARD_COLORS } from '@/lib/product-templates';

export interface DesignLayer {
  id: string;
  type: 'logo' | 'text';
  content: string; // URL for logo, text content for text
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  // Text-specific properties
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  textColor?: string;
}

export interface PreviewConfig {
  templateId: string;
  viewId: string;
  colorId: string;
  customColor?: string;
  layers: DesignLayer[];
}

export async function POST(request: NextRequest) {
  try {
    const body: PreviewConfig = await request.json();
    const { templateId, viewId, colorId, customColor, layers } = body;

    // Validate template
    const template = getTemplateById(templateId);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Validate view
    const view = template.views.find(v => v.id === viewId);
    if (!view) {
      return NextResponse.json({ error: 'View not found' }, { status: 404 });
    }

    // Get color
    let color = customColor;
    if (!color) {
      const standardColor = getColorById(colorId);
      color = standardColor?.hex || '#FFFFFF';
    }

    // Generate preview data (client-side rendering will handle the actual compositing)
    const previewData = {
      template: {
        id: template.id,
        name: template.name,
      },
      view: {
        id: view.id,
        name: view.name,
        templatePath: view.templatePath,
        printAreas: view.printAreas,
      },
      color,
      colorName: customColor ? 'Custom' : (STANDARD_COLORS.find(c => c.id === colorId)?.name || 'White'),
      layers,
      previewUrl: null, // Client-side preview rendering
    };

    return NextResponse.json(previewData);
  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}

