
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateAllMockups } from '@/lib/real-mockup-generator';
import { uploadFile } from '@/lib/s3';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    
    console.log('[Upload with AI] Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userRole: (session?.user as any)?.role
    });
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        message: 'Please sign in to upload designs. Use john@doe.com / johndoe123 for admin access.'
      }, { status: 401 });
    }
    
    if ((session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: `Access denied. Admin role required. Current role: ${(session.user as any).role || 'none'}`
      }, { status: 403 });
    }

    const formData = await request.formData();
    const logoFile = formData.get('logo') as File;
    const designName = formData.get('name') as string;

    if (!logoFile || !designName) {
      return NextResponse.json({ error: 'Logo file and design name are required' }, { status: 400 });
    }

    // Save logo to S3
    const logoBuffer = Buffer.from(await logoFile.arrayBuffer());
    const logoFileExtension = path.extname(logoFile.name) || '.png';
    const logoS3Key = await uploadFile(
      logoBuffer,
      `designs/${Date.now()}-${designName.replace(/[^a-zA-Z0-9]/g, '-')}${logoFileExtension}`
    );
    
    console.log('[Upload with AI] Logo uploaded to S3:', logoS3Key);
    
    // Create temp logo file for mockup generation (will be deleted after use)
    const tempLogoPath = path.join(os.tmpdir(), `logo-${Date.now()}${logoFileExtension}`);
    await fs.promises.writeFile(tempLogoPath, logoBuffer);

    // Generate mockups with the logo
    console.log('[Upload with AI] Generating mockups...');
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

    // Save design to database with S3 key
    const design = await prisma.design.create({
      data: {
        name: designName,
        logoUrl: logoS3Key,
        imageUrl: logoS3Key,
        status: averageScore >= 7 ? 'APPROVED' : 'PENDING',
        aiAnalysis: JSON.stringify(analyses),
        averageScore: averageScore
      }
    });
    
    console.log('[Upload with AI] Design created:', design.id);

    // Clean up temp logo
    try {
      await fs.promises.unlink(tempLogoPath);
      console.log('[Upload with AI] Temp logo cleaned up');
    } catch (e) {
      console.error('[Upload with AI] Failed to clean up temp logo:', e);
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
