
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { downloadFile } from '@/lib/storage.server'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { designId } = await request.json()
    
    if (!designId) {
      return NextResponse.json(
        { error: 'Design ID is required' },
        { status: 400 }
      )
    }
    
    // Get design from database
    const design = await prisma.design.findUnique({
      where: { id: designId },
    })
    
    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      )
    }
    
    // Get signed URL for the design image
    const imageUrl = await downloadFile(design.imageUrl)
    
    // Call LLM API for image analysis
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this basketball-related design/logo. Extract:
1. Dominant colors (as hex codes, up to 5 colors)
2. Basketball elements present (basketball icon, hoop, player silhouettes, team name, etc.)
3. Text content (team names, motivational phrases, etc.)
4. Design style (modern, vintage, minimalist, bold, etc.)
5. Recommended product types (jerseys, hoodies, t-shirts, caps, bags, etc.)
6. Best placement suggestions for each product type (chest, back, sleeve, center, etc.)

Respond in JSON format with the following structure:
{
  "colors": ["#hexcode1", "#hexcode2"],
  "basketballElements": ["element1", "element2"],
  "textContent": "extracted text",
  "designStyle": "style description",
  "recommendedProducts": ["product1", "product2"],
  "placementSuggestions": {
    "jersey": "chest",
    "hoodie": "center",
    "tshirt": "center",
    "cap": "front",
    "bag": "front panel"
  }
}
Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl
              }
            }
          ]
        }],
        max_tokens: 1000,
        response_format: { type: "json_object" }
      }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to analyze design with AI')
    }
    
    const aiResponse = await response.json()
    const analysis = JSON.parse(aiResponse.choices[0].message.content)
    
    // Update design with analysis results
    const updatedDesign = await prisma.design.update({
      where: { id: designId },
      data: {
        colors: analysis.colors || [],
        basketballElements: JSON.stringify(analysis),
      },
    })
    
    return NextResponse.json({
      success: true,
      analysis,
      design: updatedDesign,
    })
  } catch (error) {
    console.error('Design analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze design' },
      { status: 500 }
    )
  }
}
