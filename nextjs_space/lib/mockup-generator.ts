
import sharp from 'sharp'
import { downloadFile, uploadFile } from './s3'

// Base product template mappings
const PRODUCT_TEMPLATES: Record<string, string> = {
  'Basketball Jersey': '/mockups/jersey-template.png',
  'Shooting Shirt': '/mockups/tshirt-template.png',
  'Basketball Shorts': '/mockups/shorts-template.png',
  'Compression Shirt': '/mockups/tshirt-template.png',
  'Basketball Hoodie': '/mockups/hoodie-template.png',
  'Basketball T-Shirt': '/mockups/tshirt-template.png',
  'Joggers': '/mockups/shorts-template.png',
  'Basketball Cap': '/mockups/tshirt-template.png',
  'Gym Bag': '/mockups/tshirt-template.png',
  'Headband': '/mockups/tshirt-template.png',
  'Wristbands (Pair)': '/mockups/tshirt-template.png',
}

// Logo placement configurations for different product types
const LOGO_PLACEMENTS: Record<string, { top: number; left: number; width: number; height: number }> = {
  'Basketball Jersey': { top: 300, left: 950, width: 600, height: 600 },
  'Shooting Shirt': { top: 120, left: 80, width: 100, height: 100 },
  'Basketball Shorts': { top: 100, left: 200, width: 200, height: 200 },
  'Compression Shirt': { top: 120, left: 80, width: 100, height: 100 },
  'Basketball Hoodie': { top: 600, left: 950, width: 700, height: 700 },
  'Basketball T-Shirt': { top: 120, left: 80, width: 100, height: 100 },
  'Joggers': { top: 100, left: 200, width: 200, height: 200 },
  'Basketball Cap': { top: 120, left: 80, width: 100, height: 100 },
  'Gym Bag': { top: 120, left: 80, width: 100, height: 100 },
  'Headband': { top: 120, left: 80, width: 100, height: 100 },
  'Wristbands (Pair)': { top: 120, left: 80, width: 100, height: 100 },
}

/**
 * Get brand-specific color variations
 */
function getBrandColors(brand: string) {
  if (brand === 'The Basketball Factory Inc') {
    return [
      { name: 'White', tint: { r: 255, g: 255, b: 255 } },
      { name: 'Black', tint: { r: 0, g: 0, b: 0 } },
      { name: 'Navy', tint: { r: 0, g: 32, b: 96 } },
      { name: 'Gold', tint: { r: 255, g: 215, b: 0 } },
    ]
  } else {
    // Default: Rise as One AAU
    return [
      { name: 'Black', tint: { r: 0, g: 0, b: 0 } },
      { name: 'White', tint: { r: 255, g: 255, b: 255 } },
      { name: 'Red', tint: { r: 220, g: 20, b: 60 } },
      { name: 'Grey', tint: { r: 128, g: 128, b: 128 } },
    ]
  }
}

/**
 * Generate product mockup by compositing logo onto base product template
 */
export async function generateProductMockup(
  designName: string,
  productType: string,
  logoCloudPath: string,
  brand: string = 'Rise as One AAU'
): Promise<string[]> {
  try {
    console.log(`Generating mockup for ${productType} with design ${designName} for brand ${brand}`)
    
    // Get the base template for this product type
    const templatePath = PRODUCT_TEMPLATES[productType] || '/mockups/tshirt-template.png'
    const logoPlacement = LOGO_PLACEMENTS[productType] || { top: 120, left: 80, width: 100, height: 100 }
    
    // Download the logo from S3
    let logoUrl: string
    if (logoCloudPath.startsWith('http')) {
      logoUrl = logoCloudPath
    } else {
      logoUrl = await downloadFile(logoCloudPath)
    }
    
    // Fetch the logo and template images
    const [logoResponse, templateResponse] = await Promise.all([
      fetch(logoUrl),
      fetch(`http://localhost:3000${templatePath}`)
    ])
    
    if (!logoResponse.ok || !templateResponse.ok) {
      throw new Error('Failed to fetch logo or template')
    }
    
    const logoBuffer = Buffer.from(await logoResponse.arrayBuffer())
    const templateBuffer = Buffer.from(await templateResponse.arrayBuffer())
    
    // Resize logo to fit placement area
    const resizedLogo = await sharp(logoBuffer)
      .resize(logoPlacement.width, logoPlacement.height, { 
        fit: 'inside',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toBuffer()
    
    // Get brand-specific color variations
    const colors = getBrandColors(brand)
    
    const mockupImages: string[] = []
    
    for (const color of colors) {
      try {
        // Apply color tint to template (for colored products)
        let coloredTemplate = sharp(templateBuffer)
        
        // For non-white colors, apply a tint
        if (color.name !== 'white') {
          coloredTemplate = coloredTemplate.tint(color.tint)
        }
        
        // Composite the logo onto the template
        const mockupBuffer = await coloredTemplate
          .composite([{
            input: resizedLogo,
            top: logoPlacement.top,
            left: logoPlacement.left,
          }])
          .png()
          .toBuffer()
        
        // Upload the generated mockup to S3
        const mockupFileName = `mockup-${designName}-${productType}-${color.name}-${Date.now()}.png`
        const mockupCloudPath = await uploadFile(mockupBuffer, mockupFileName)
        
        // Get signed URL for the mockup
        const mockupUrl = await downloadFile(mockupCloudPath)
        mockupImages.push(mockupUrl)
        
        console.log(`Generated ${color.name} mockup for ${productType}`)
      } catch (error) {
        console.error(`Error generating ${color.name} mockup:`, error)
      }
    }
    
    // If we failed to generate any mockups, fall back to the original logo
    if (mockupImages.length === 0) {
      const fallbackUrl = await downloadFile(logoCloudPath)
      return [fallbackUrl, fallbackUrl, fallbackUrl, fallbackUrl]
    }
    
    return mockupImages
  } catch (error) {
    console.error('Error in generateProductMockup:', error)
    // Fallback to original logo
    const fallbackUrl = await downloadFile(logoCloudPath)
    return [fallbackUrl, fallbackUrl, fallbackUrl, fallbackUrl]
  }
}
