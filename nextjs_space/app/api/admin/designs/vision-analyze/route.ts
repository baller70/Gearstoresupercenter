
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mockupImagePath } = await request.json();

    if (!mockupImagePath) {
      return NextResponse.json({ error: 'Mockup image path is required' }, { status: 400 });
    }

    // Read the mockup image and convert to base64
    const imageBuffer = await fs.promises.readFile(mockupImagePath);
    const base64Image = imageBuffer.toString('base64');

    // Call Vision AI to analyze the logo placement
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
                text: `Analyze this basketball apparel mockup with a logo placed on it. Provide detailed feedback on:

1. Logo Placement: Is the logo well-positioned on the garment? Is it centered properly?
2. Logo Size: Is the logo appropriately sized? Too large, too small, or just right?
3. Visual Balance: Does the logo complement the garment design?
4. Professional Quality: Does this look like a professional product mockup?
5. Recommendations: What specific adjustments would improve this mockup?

Please respond in JSON format with the following structure:
{
  "placement": {
    "score": 0-10,
    "feedback": "detailed feedback"
  },
  "size": {
    "score": 0-10,
    "feedback": "detailed feedback"
  },
  "balance": {
    "score": 0-10,
    "feedback": "detailed feedback"
  },
  "professional": {
    "score": 0-10,
    "feedback": "detailed feedback"
  },
  "overallScore": 0-10,
  "recommendations": [
    "specific recommendation 1",
    "specific recommendation 2"
  ],
  "approved": boolean
}

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Vision AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const analysisResult = JSON.parse(data.choices[0].message.content);

    return NextResponse.json({
      success: true,
      analysis: analysisResult
    });
  } catch (error) {
    console.error('Vision analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze mockup', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
