
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = session.user.email.endsWith('@admin.com');
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const logoFile = formData.get('logo') as File;
    const garmentType = formData.get('garmentType') as string;
    const currentX = parseFloat(formData.get('x') as string) || 50;
    const currentY = parseFloat(formData.get('y') as string) || 35;

    if (!logoFile) {
      return NextResponse.json({ error: 'Logo file is required' }, { status: 400 });
    }

    // Convert logo to base64
    const logoBuffer = await logoFile.arrayBuffer();
    const logoBase64 = Buffer.from(logoBuffer).toString('base64');

    // Use Vision AI to analyze optimal positioning
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this logo and provide optimal positioning for placing it on the chest area of a ${garmentType}. 
                
The logo should be:
- Centered horizontally on the chest
- Positioned on the upper chest area (not too high near neck, not too low near stomach)
- Sized appropriately (not too large or small)

Current position: X=${currentX}%, Y=${currentY}%

Respond in JSON format with the following structure:
{
  "x": number (percentage from left, 0-100),
  "y": number (percentage from top, 0-100),
  "scale": number (size multiplier, 0.5-2.0),
  "recommendation": "Brief explanation of positioning",
  "optimal": boolean (whether current position is already optimal)
}

For chest placement on garments:
- X should typically be 50% (centered)
- Y should be between 30-40% for upper chest placement
- Scale should be 0.8-1.2 for most logos

Respond with raw JSON only.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${logoFile.type};base64,${logoBase64}`
                }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error('Vision AI analysis failed');
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error: any) {
    console.error('Position analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze position' },
      { status: 500 }
    );
  }
}
