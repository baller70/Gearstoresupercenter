
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const ABACUS_API_KEY = process.env.ABACUSAI_API_KEY;
const ABACUS_API_URL = 'https://api.abacus.ai/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { height, weight, chest, waist, preferredFit, category } = body;

    // Use AI to recommend size
    const prompt = `As a sizing expert for basketball apparel, recommend the best size based on these measurements:
- Height: ${height} inches (${Math.floor(height / 12)}' ${height % 12}")
- Weight: ${weight} lbs
- Chest: ${chest ? chest + ' inches' : 'not provided'}
- Waist: ${waist ? waist + ' inches' : 'not provided'}
- Preferred Fit: ${preferredFit}
- Category: ${category}

Respond in JSON format with:
{
  "recommendedSize": "size (S, M, L, XL, etc.)",
  "confidence": "high/medium/low",
  "reasoning": "brief explanation",
  "alternativeSizes": ["size1", "size2"],
  "fitTips": "specific fit advice"
}`;

    const response = await fetch(ABACUS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ABACUS_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are an expert sizing consultant for athletic apparel.' },
          { role: 'user', content: prompt },
        ],
        model: 'gpt-4o',
        temperature: 0.3,
      }),
    });

    const aiData = await response.json();
    const recommendation = JSON.parse(aiData.choices[0].message.content);

    // Save customer fit profile if logged in
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (user) {
        await prisma.customerFit.upsert({
          where: { userId: user.id },
          update: {
            height: parseFloat(height),
            weight: parseFloat(weight),
            chest: chest ? parseFloat(chest) : null,
            waist: waist ? parseFloat(waist) : null,
            preferredFit,
          },
          create: {
            userId: user.id,
            height: parseFloat(height),
            weight: parseFloat(weight),
            chest: chest ? parseFloat(chest) : null,
            waist: waist ? parseFloat(waist) : null,
            preferredFit,
          },
        });
      }
    }

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error('Size recommendation error:', error);
    return NextResponse.json({ error: 'Failed to generate size recommendation' }, { status: 500 });
  }
}
