import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { downloadFile } from '@/lib/s3'

const ABACUSAI_API_KEY = process.env.ABACUSAI_API_KEY

async function generateProductMockupImage(designName: string, productType: string, designImageUrl: string): Promise<string> {
  try {
    // Get the signed URL for the design image to describe it
    const designUrl = await downloadFile(designImageUrl)
    
    // Generate a product mockup image using AI
    const mockupPrompt = `Create a professional product mockup photo of a ${productType} with a basketball logo/design on it. The ${productType} should be displayed on a clean white background, professional photography style, high quality, centered, realistic fabric texture. The logo should be prominently displayed on the ${productType}. Make it look like a professional e-commerce product photo for a basketball apparel store.`
    
    const apiUrl = 'https://abacus.ai/api/v0/generateImage'
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        prompt: mockupPrompt,
        model: 'SDXL',
        num_images: 1,
        width: 1024,
        height: 1024,
      }),
    })
    
    if (!response.ok) {
      console.error('Image generation failed:', await response.text())
      throw new Error('Failed to generate mockup image')
    }
    
    const data = await response.json()
    
    // The API returns an array of generated image URLs
    if (data.images && data.images.length > 0) {
      return data.images[0]
    }
    
    throw new Error('No image generated')
  } catch (error) {
    console.error('Error generating product mockup:', error)
    // Fallback to design image if generation fails
    return designImageUrl
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { designId, categories, autoApprove } = await request.json()
    
    if (!designId || !categories || !Array.isArray(categories)) {
      return NextResponse.json(
        { error: 'Design ID and categories are required' },
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
    
    // Parse basketball elements analysis
    const analysis = design.basketballElements ? JSON.parse(design.basketballElements) : {}
    const placementSuggestions = analysis.placementSuggestions || {}
    
    // Product templates for each category
    const productTemplates: Record<string, any[]> = {
      'PERFORMANCE_APPAREL': [
        { name: 'Basketball Jersey', basePrice: 49.99, sizes: ['YXS', 'YS', 'YM', 'YL', 'YXL', 'S', 'M', 'L', 'XL', 'XXL'], placement: placementSuggestions.jersey || 'chest' },
        { name: 'Shooting Shirt', basePrice: 34.99, sizes: ['YXS', 'YS', 'YM', 'YL', 'YXL', 'S', 'M', 'L', 'XL', 'XXL'], placement: placementSuggestions.tshirt || 'center' },
        { name: 'Basketball Shorts', basePrice: 39.99, sizes: ['YXS', 'YS', 'YM', 'YL', 'YXL', 'S', 'M', 'L', 'XL', 'XXL'], placement: placementSuggestions.shorts || 'left leg' },
        { name: 'Compression Shirt', basePrice: 29.99, sizes: ['YXS', 'YS', 'YM', 'YL', 'YXL', 'S', 'M', 'L', 'XL'], placement: placementSuggestions.compression || 'chest' },
      ],
      'CASUAL_WEAR': [
        { name: 'Basketball Hoodie', basePrice: 59.99, sizes: ['YXS', 'YS', 'YM', 'YL', 'YXL', 'S', 'M', 'L', 'XL', 'XXL'], placement: placementSuggestions.hoodie || 'center' },
        { name: 'Basketball T-Shirt', basePrice: 24.99, sizes: ['YXS', 'YS', 'YM', 'YL', 'YXL', 'S', 'M', 'L', 'XL', 'XXL'], placement: placementSuggestions.tshirt || 'center' },
        { name: 'Joggers', basePrice: 44.99, sizes: ['YXS', 'YS', 'YM', 'YL', 'YXL', 'S', 'M', 'L', 'XL', 'XXL'], placement: placementSuggestions.joggers || 'left leg' },
      ],
      'ACCESSORIES': [
        { name: 'Basketball Cap', basePrice: 19.99, sizes: ['One Size'], placement: placementSuggestions.cap || 'front' },
        { name: 'Gym Bag', basePrice: 39.99, sizes: ['One Size'], placement: placementSuggestions.bag || 'front panel' },
        { name: 'Headband', basePrice: 9.99, sizes: ['One Size'], placement: placementSuggestions.headband || 'center' },
        { name: 'Wristbands (Pair)', basePrice: 12.99, sizes: ['One Size'], placement: placementSuggestions.wristband || 'center' },
      ],
    }
    
    const createdProducts = []
    
    // Generate products for each selected category
    for (const category of categories) {
      const templates = productTemplates[category]
      
      if (!templates) continue
      
      for (const template of templates) {
        console.log(`Generating mockup for ${template.name}...`)
        
        // Generate product mockup image
        const mockupImageUrl = await generateProductMockupImage(
          design.name,
          template.name,
          design.imageUrl
        )
        
        // Create color variations
        const colors = design.colors.length > 0 ? design.colors : ['#000000', '#FFFFFF']
        
        const product = await prisma.product.create({
          data: {
            name: `${design.name} - ${template.name}`,
            description: `Premium ${template.name} featuring custom ${design.name} design. ${analysis.designStyle ? `${analysis.designStyle} style.` : ''} Perfect for basketball players and fans.`,
            price: template.basePrice,
            category,
            imageUrl: mockupImageUrl, // Use the generated mockup image
            images: [mockupImageUrl], // Add to images array as well
            sizes: template.sizes,
            colors,
            inStock: true,
            featured: false,
            designId: design.id,
            placement: template.placement,
          },
        })
        
        createdProducts.push(product)
      }
    }
    
    // If auto-approve, update design status
    if (autoApprove) {
      await prisma.design.update({
        where: { id: designId },
        data: { status: 'APPROVED' },
      })
    }
    
    return NextResponse.json({
      success: true,
      productsCreated: createdProducts.length,
      products: createdProducts,
    })
  } catch (error) {
    console.error('Product generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate products' },
      { status: 500 }
    )
  }
}
