import { NextRequest, NextResponse } from 'next/server';

// Basketball team color schemes
const TEAM_COLOR_SCHEMES = [
  // Rise As One / Basketball Factory colors
  { primary: '#DC2626', secondary: '#000000', accent: '#FFFFFF', name: 'Rise As One Red' },
  { primary: '#1F2937', secondary: '#DC2626', accent: '#FFFFFF', name: 'Factory Dark' },
  
  // Classic basketball colors
  { primary: '#1D4ED8', secondary: '#FFFFFF', accent: '#F59E0B', name: 'Classic Blue' },
  { primary: '#7C3AED', secondary: '#FFFFFF', accent: '#F59E0B', name: 'Purple Dynasty' },
  { primary: '#059669', secondary: '#FFFFFF', accent: '#000000', name: 'Court Green' },
  { primary: '#EA580C', secondary: '#000000', accent: '#FFFFFF', name: 'Blaze Orange' },
  { primary: '#0891B2', secondary: '#FFFFFF', accent: '#000000', name: 'Teal Wave' },
  { primary: '#BE185D', secondary: '#FFFFFF', accent: '#000000', name: 'Pink Power' },
];

// Product color options
const PRODUCT_COLORS = [
  { hex: '#FFFFFF', name: 'White' },
  { hex: '#000000', name: 'Black' },
  { hex: '#1F2937', name: 'Charcoal' },
  { hex: '#374151', name: 'Gray' },
  { hex: '#DC2626', name: 'Red' },
  { hex: '#1D4ED8', name: 'Royal Blue' },
  { hex: '#1E3A8A', name: 'Navy' },
  { hex: '#7C3AED', name: 'Purple' },
  { hex: '#059669', name: 'Green' },
  { hex: '#EA580C', name: 'Orange' },
  { hex: '#F59E0B', name: 'Gold' },
];

export async function POST(request: NextRequest) {
  try {
    const { designId, logoUrl } = await request.json();

    // Simulate AI color analysis
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    // Select a random team color scheme (in production, this would analyze the logo)
    const selectedScheme = TEAM_COLOR_SCHEMES[Math.floor(Math.random() * TEAM_COLOR_SCHEMES.length)];

    // Generate complementary product colors
    const recommendedProductColors = PRODUCT_COLORS.filter(color => {
      // Recommend colors that complement the scheme
      return color.hex !== selectedScheme.primary && 
             (color.hex === '#FFFFFF' || color.hex === '#000000' || 
              color.hex === selectedScheme.secondary);
    }).slice(0, 5);

    return NextResponse.json({
      success: true,
      scheme: selectedScheme,
      colors: [
        selectedScheme.primary,
        selectedScheme.secondary,
        selectedScheme.accent,
      ],
      productColors: recommendedProductColors,
      suggestions: [
        {
          type: 'color',
          title: `${selectedScheme.name} Color Scheme`,
          description: `Primary: ${selectedScheme.primary}, Secondary: ${selectedScheme.secondary}`,
          confidence: 0.88,
        },
        {
          type: 'color',
          title: 'Recommended Product Colors',
          description: recommendedProductColors.map(c => c.name).join(', '),
          confidence: 0.82,
        },
      ],
    });
  } catch (error) {
    console.error('AI color scheme error:', error);
    return NextResponse.json(
      { error: 'Failed to generate color scheme' },
      { status: 500 }
    );
  }
}

