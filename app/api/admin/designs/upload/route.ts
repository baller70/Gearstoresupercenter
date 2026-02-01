import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadFile, downloadFile } from '@/lib/storage.server'
import { prisma } from '@/lib/db'
import { advancedMockupGenerator } from '@/lib/advanced-mockup-generator'
import { DEFAULT_BUSINESS_ID } from '@/lib/constants'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'

// Brand color definitions
const BRAND_COLORS: Record<string, Array<{ name: string; hex: string }>> = {
  'Rise as One AAU': [
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Red', hex: '#DC2626' },
    { name: 'Grey', hex: '#6B7280' }
  ],
  'The Basketball Factory Inc': [
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Black', hex: '#000000' },
    { name: 'Navy', hex: '#1E3A8A' },
    { name: 'Gold', hex: '#F59E0B' }
  ]
};

export async function POST(request: NextRequest) {
  let tempLogoPath: string | null = null;
  
  try {
    const session = await getServerSession(authOptions)
    
    console.log('[Upload] Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userRole: session?.user?.role
    })
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          message: 'Please sign in to upload designs. Use admin@basketballfactory.com / admin123 for admin access.'
        },
        { status: 401 }
      )
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: `Access denied. Admin role required. Current role: ${session.user.role || 'none'}`
        },
        { status: 403 }
      )
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const brand = formData.get('brand') as string || 'Rise as One AAU'
    const positionX = parseFloat(formData.get('positionX') as string) || 50
    const positionY = parseFloat(formData.get('positionY') as string) || 35
    const scale = parseFloat(formData.get('scale') as string) || 1.0
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG, JPG, and SVG are allowed' },
        { status: 400 }
      )
    }
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Upload logo to S3
    const logoStoragePath = await uploadFile(buffer, `designs/${Date.now()}-${file.name}`)
    
    // Create design record in database
    const design = await prisma.design.create({
      data: {
        businessId: DEFAULT_BUSINESS_ID,
        name: name || file.name,
        brand: brand,
        imageUrl: logoStoragePath,
        colors: BRAND_COLORS[brand]?.map(c => c.hex) || [],
        basketballElements: null,
        positionX,
        positionY,
        scale,
        status: 'APPROVED',
      },
    })
    
    // Download logo to temp file for mockup generation
    const tempDir = os.tmpdir()
    tempLogoPath = path.join(tempDir, `logo-${design.id}${path.extname(file.name)}`)
    await fs.writeFile(tempLogoPath, buffer)
    
    // Generate products in all brand colors
    const garmentTypes = ['tshirt', 'jersey', 'hoodie']
    const colors = BRAND_COLORS[brand] || BRAND_COLORS['Rise as One AAU']
    
    let productsGenerated = 0
    let errors: string[] = []
    
    console.log(`[Upload] Starting product generation for ${garmentTypes.length} garment types x ${colors.length} colors`)
    console.log(`[Upload] Temp logo path: ${tempLogoPath}`)
    
    for (const garmentType of garmentTypes) {
      for (const color of colors) {
        try {
          console.log(`[Upload] Generating ${garmentType} in ${color.name} (${color.hex})...`)
          
          // Generate mockup with logo using advanced generator
          const mockupBuffer = await advancedMockupGenerator.generateMockup(
            tempLogoPath,
            garmentType,
            color.hex,
            { x: positionX, y: positionY, scale }
          )
          console.log(`[Upload] Mockup generated, size: ${mockupBuffer.length} bytes`)
          
          // Upload mockup to S3
          const mockupPath = await uploadFile(
            mockupBuffer,
            `products/${design.id}/${garmentType}-${color.name.toLowerCase()}.png`
          )
          console.log(`[Upload] ✅ Mockup uploaded to S3: ${mockupPath}`)
          
          // Create product
          const productName = `${name} ${garmentType.charAt(0).toUpperCase() + garmentType.slice(1)} - ${color.name}`
          
          const product = await prisma.product.create({
            data: {
              businessId: DEFAULT_BUSINESS_ID,
              name: productName,
              description: `Premium ${garmentType} featuring ${name} design in ${color.name}. Perfect for basketball players and fans. Made with high-quality materials for comfort and durability.`,
              price: garmentType === 'hoodie' ? 64.99 : garmentType === 'jersey' ? 54.99 : 39.99,
              imageUrl: mockupPath,
              images: [mockupPath],
              category: garmentType === 'hoodie' ? 'CASUAL_WEAR' : 'PERFORMANCE_APPAREL',
              sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
              colors: [color.hex],
              featured: false,
              designId: design.id,
              placement: 'chest',
            }
          })
          console.log(`[Upload] ✅ Product created: ${product.id} - ${productName}`)
          
          productsGenerated++
        } catch (error) {
          const errorMsg = `Failed to generate ${garmentType} in ${color.name}: ${error}`
          console.error(`[Upload] ❌ ${errorMsg}`)
          console.error(`[Upload] Error details:`, error)
          errors.push(errorMsg)
        }
      }
    }
    
    if (errors.length > 0) {
      console.error(`[Upload] ⚠️ Generated ${productsGenerated} products with ${errors.length} errors:`)
      errors.forEach(err => console.error(`  - ${err}`))
    } else {
      console.log(`[Upload] ✅ All ${productsGenerated} products generated successfully!`)
    }
    
    // Clean up temp file
    if (tempLogoPath) {
      try {
        await fs.unlink(tempLogoPath)
      } catch (error) {
        console.error('Failed to clean up temp file:', error)
      }
    }
    
    return NextResponse.json({
      success: true,
      designId: design.id,
      imageUrl: logoStoragePath,
      productsGenerated,
      message: `Successfully generated ${productsGenerated} products in ${colors.length} colors across ${garmentTypes.length} garment types`
    })
  } catch (error) {
    console.error('Design upload error:', error)
    
    // Clean up temp file on error
    if (tempLogoPath) {
      try {
        await fs.unlink(tempLogoPath)
      } catch (cleanupError) {
        console.error('Failed to clean up temp file:', cleanupError)
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to upload design and generate products' },
      { status: 500 }
    )
  }
}
