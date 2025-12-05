import { NextRequest, NextResponse } from 'next/server';
import { getAllTemplates, getTemplateById, getTemplatesByCategory, STANDARD_COLORS } from '@/lib/product-templates';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');
    const category = searchParams.get('category') as 'tops' | 'bottoms' | 'accessories' | null;
    const includeColors = searchParams.get('includeColors') !== 'false';

    let templates;

    if (templateId) {
      // Get single template by ID
      const template = getTemplateById(templateId);
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({
        template,
        colors: includeColors ? STANDARD_COLORS : undefined,
      });
    }

    if (category) {
      // Get templates by category
      templates = getTemplatesByCategory(category);
    } else {
      // Get all templates
      templates = getAllTemplates();
    }

    // Group templates by category for easier consumption
    const grouped = {
      tops: templates.filter(t => t.category === 'tops'),
      bottoms: templates.filter(t => t.category === 'bottoms'),
      accessories: templates.filter(t => t.category === 'accessories'),
    };

    return NextResponse.json({
      templates,
      grouped,
      colors: includeColors ? STANDARD_COLORS : undefined,
      totalCount: templates.length,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

