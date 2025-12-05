
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/storage.server';

const ABACUSAI_API_KEY = process.env.ABACUSAI_API_KEY;
const ABACUSAI_API_URL = 'https://abacus.ai/v1/chat/complete';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const notes = formData.get('notes') as string;
    const productId = formData.get('productId') as string | null;

    if (!notes) {
      return NextResponse.json({ error: 'Design notes are required' }, { status: 400 });
    }

    let designUrl = null;

    // Upload design file if provided
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `customization/${Date.now()}-${file.name}`;
      designUrl = await uploadFile(buffer, fileName);
    }

    // Get AI suggestions for the customization
    const aiSuggestions = await generateCustomizationSuggestions(notes, productId);

    // Create customization request
    const customization = await prisma.productCustomization.create({
      data: {
        userId: session.user.id,
        productId,
        designUrl,
        notes,
        aiSuggestions: JSON.stringify(aiSuggestions),
        status: 'PENDING',
      },
    });

    return NextResponse.json({ 
      success: true,
      customization: {
        id: customization.id,
        status: customization.status,
        aiSuggestions,
      }
    });

  } catch (error) {
    console.error('Customization error:', error);
    return NextResponse.json({ error: 'Failed to create customization request' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const customizations = await prisma.productCustomization.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ customizations });

  } catch (error) {
    console.error('Get customizations error:', error);
    return NextResponse.json({ error: 'Failed to get customizations' }, { status: 500 });
  }
}

async function generateCustomizationSuggestions(notes: string, productId: string | null) {
  try {
    const prompt = `As a basketball apparel design expert, analyze this customization request and provide helpful suggestions:

Customer Request: ${notes}
${productId ? `Product ID: ${productId}` : 'No specific product selected'}

Provide:
1. Design recommendations (colors, placements, styles)
2. Estimated production time
3. Price estimate range
4. Any technical considerations
5. Alternative suggestions

Format your response as a helpful, concise recommendation.`;

    const response = await fetch(ABACUSAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert in basketball apparel design and customization.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI suggestions');
    }

    const data = await response.json();
    return {
      suggestions: data.choices?.[0]?.message?.content || 'Unable to generate suggestions at this time.',
      estimatedDays: '14-21',
      priceRange: '$45-$75',
    };

  } catch (error) {
    console.error('AI suggestions error:', error);
    return {
      suggestions: 'We will review your request and provide personalized recommendations within 24 hours.',
      estimatedDays: '14-21',
      priceRange: '$45-$75',
    };
  }
}
