
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateAllMockups } from '@/lib/real-mockup-generator';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const logoFile = formData.get('logo') as File;
    const designName = formData.get('name') as string;

    if (!logoFile || !designName) {
      return NextResponse.json({ error: 'Logo file and design name are required' }, { status: 400 });
    }

    // Save logo temporarily
    const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
    const tempLogoPath = path.join(process.cwd(), 'public/temp', `logo-${Date.now()}.png`);
    
    // Ensure temp directory exists
    const tempDir = path.dirname(tempLogoPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    await fs.promises.writeFile(tempLogoPath, logoBuffer);

    // Generate mockups with the logo
    console.log('Generating mockups...');
    const mockupPaths = await generateAllMockups(tempLogoPath);
    
    console.log('Mockups generated:', mockupPaths);

    // Analyze each mockup with Vision AI
    const analyses: Record<string, any> = {};
    
    for (const [mockupType, mockupPath] of Object.entries(mockupPaths)) {
      try {
        const imageBuffer = await fs.promises.readFile(mockupPath);
        const base64Image = imageBuffer.toString('base64');

        const visionResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
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
                    text: `Analyze this basketball apparel mockup with a logo. Provide feedback on placement, size, balance, and professional quality.

Respond in JSON format:
{
  "placement": {"score": 0-10, "feedback": "text"},
  "size": {"score": 0-10, "feedback": "text"},
  "balance": {"score": 0-10, "feedback": "text"},
  "professional": {"score": 0-10, "feedback": "text"},
  "overallScore": 0-10,
  "recommendations": ["recommendation 1", "recommendation 2"],
  "approved": boolean
}

Respond with raw JSON only.`
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
            max_tokens: 800
          })
        });

        if (visionResponse.ok) {
          const visionData = await visionResponse.json();
          const analysis = JSON.parse(visionData.choices[0].message.content);
          analyses[mockupType] = analysis;
          console.log(`Vision AI analysis for ${mockupType}:`, analysis);
        } else {
          console.error(`Vision AI failed for ${mockupType}`);
          analyses[mockupType] = { error: 'Analysis failed', overallScore: 5 };
        }
      } catch (error) {
        console.error(`Error analyzing ${mockupType}:`, error);
        analyses[mockupType] = { error: 'Analysis error', overallScore: 5 };
      }
    }

    // Calculate average score across all mockups
    const scores = Object.values(analyses)
      .filter((a: any) => a.overallScore)
      .map((a: any) => a.overallScore);
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : 0;

    // Save design to database
    const design = await prisma.design.create({
      data: {
        name: designName,
        logoUrl: `/temp/${path.basename(tempLogoPath)}`,
        imageUrl: `/temp/${path.basename(tempLogoPath)}`,
        status: averageScore >= 7 ? 'APPROVED' : 'PENDING',
        aiAnalysis: JSON.stringify(analyses),
        averageScore: averageScore
      }
    });

    // Clean up temp logo
    try {
      await fs.promises.unlink(tempLogoPath);
    } catch (e) {
      console.error('Failed to clean up temp logo:', e);
    }

    return NextResponse.json({
      success: true,
      design: {
        id: design.id,
        name: design.name,
        status: design.status,
        averageScore: averageScore
      },
      mockups: Object.entries(mockupPaths).map(([type, path]) => ({
        type,
        path: path.replace(process.cwd() + '/public', ''),
        analysis: analyses[type]
      })),
      aiAnalysis: analyses
    });
  } catch (error) {
    console.error('Upload with AI error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
