
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

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
        { name: 'Basketball Jersey', basePrice: 49.99, sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'], placement: placementSuggestions.jersey || 'chest' },
        { name: 'Shooting Shirt', basePrice: 34.99, sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'], placement: placementSuggestions.tshirt || 'center' },
        { name: 'Basketball Shorts', basePrice: 39.99, sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'], placement: placementSuggestions.shorts || 'left leg' },
        { name: 'Compression Shirt', basePrice: 29.99, sizes: ['XS', 'S', 'M', 'L', 'XL'], placement: placementSuggestions.compression || 'chest' },
      ],
      'CASUAL_WEAR': [
        { name: 'Basketball Hoodie', basePrice: 59.99, sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'], placement: placementSuggestions.hoodie || 'center' },
        { name: 'Basketball T-Shirt', basePrice: 24.99, sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'], placement: placementSuggestions.tshirt || 'center' },
        { name: 'Joggers', basePrice: 44.99, sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'], placement: placementSuggestions.joggers || 'left leg' },
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
        // Create color variations
        const colors = design.colors.length > 0 ? design.colors : ['#000000', '#FFFFFF']
        
        const product = await prisma.product.create({
          data: {
            name: `${design.name} - ${template.name}`,
            description: `Premium ${template.name} featuring custom ${design.name} design. ${analysis.designStyle ? `${analysis.designStyle} style.` : ''} Perfect for basketball players and fans.`,
            price: template.basePrice,
            category,
            imageUrl: design.imageUrl, // In real implementation, would generate mockup
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
