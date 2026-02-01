import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { mockupGenerator } from '@/lib/mockup-generator'
import { DEFAULT_BUSINESS_ID } from '@/lib/constants'

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
    
    // Get brand-specific colors
    const brandColors = design.brand === 'The Basketball Factory Inc'
      ? ['White', 'Black', 'Navy', 'Gold']
      : ['Black', 'White', 'Red', 'Grey']
    
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
        console.log(`Generating mockups for ${template.name}...`)
        
        // Note: Products are now automatically generated on upload with precise positioning
        // This endpoint is kept for manual regeneration if needed
        // For now, create basic product entries - mockups would need to be regenerated separately
        
        const product = await prisma.product.create({
          data: {
            businessId: design.businessId || DEFAULT_BUSINESS_ID,
            name: `${design.name} - ${template.name}`,
            description: `Premium ${template.name} featuring custom ${design.name} design. ${analysis.designStyle ? `${analysis.designStyle} style.` : ''} Perfect for basketball players and fans.`,
            price: template.basePrice,
            category,
            imageUrl: design.imageUrl, // Use design logo as placeholder
            images: [design.imageUrl],
            sizes: template.sizes,
            colors: brandColors,
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
