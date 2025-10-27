
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

// Logo placement configurations - using percentages of template dimensions for better responsiveness
interface LogoPlacement {
  topPercent: number;      // Percentage from top (0-100)
  leftPercent: number;     // Percentage from left (0-100)
  widthPercent: number;    // Percentage of template width (0-100)
  maxWidth: number;        // Maximum width in pixels
}

const LOGO_PLACEMENTS: Record<string, LogoPlacement> = {
  'Basketball Jersey': { topPercent: 25, leftPercent: 50, widthPercent: 15, maxWidth: 250 },
  'Shooting Shirt': { topPercent: 20, leftPercent: 50, widthPercent: 12, maxWidth: 180 },
  'Basketball Shorts': { topPercent: 15, leftPercent: 25, widthPercent: 10, maxWidth: 120 },
  'Compression Shirt': { topPercent: 20, leftPercent: 50, widthPercent: 12, maxWidth: 180 },
  'Basketball Hoodie': { topPercent: 30, leftPercent: 50, widthPercent: 15, maxWidth: 250 },
  'Basketball T-Shirt': { topPercent: 20, leftPercent: 50, widthPercent: 12, maxWidth: 180 },
  'Joggers': { topPercent: 15, leftPercent: 25, widthPercent: 10, maxWidth: 120 },
  'Basketball Cap': { topPercent: 35, leftPercent: 50, widthPercent: 20, maxWidth: 150 },
  'Gym Bag': { topPercent: 40, leftPercent: 50, widthPercent: 25, maxWidth: 300 },
  'Headband': { topPercent: 45, leftPercent: 50, widthPercent: 30, maxWidth: 180 },
  'Wristbands (Pair)': { topPercent: 45, leftPercent: 35, widthPercent: 15, maxWidth: 100 },
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
    const placementConfig = LOGO_PLACEMENTS[productType] || { 
      topPercent: 20, leftPercent: 50, widthPercent: 12, maxWidth: 180 
    }
    
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
    
    // Get template metadata to calculate positions
    const templateMetadata = await sharp(templateBuffer).metadata()
    const templateWidth = templateMetadata.width || 1000
    const templateHeight = templateMetadata.height || 1000
    
    // Calculate logo dimensions based on percentage of template width
    const logoWidth = Math.min(
      Math.round(templateWidth * (placementConfig.widthPercent / 100)),
      placementConfig.maxWidth
    )
    
    // Get logo metadata to maintain aspect ratio
    const logoMetadata = await sharp(logoBuffer).metadata()
    const logoAspectRatio = (logoMetadata.width || 1) / (logoMetadata.height || 1)
    const logoHeight = Math.round(logoWidth / logoAspectRatio)
    
    // Calculate position based on percentages (centered on the specified point)
    const logoTop = Math.round((templateHeight * placementConfig.topPercent) / 100 - logoHeight / 2)
    const logoLeft = Math.round((templateWidth * placementConfig.leftPercent) / 100 - logoWidth / 2)
    
    console.log(`Template: ${templateWidth}x${templateHeight}, Logo will be: ${logoWidth}x${logoHeight} at (${logoLeft}, ${logoTop})`)
    
    // Resize logo to calculated dimensions
    const resizedLogo = await sharp(logoBuffer)
      .resize(logoWidth, logoHeight, { 
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
        if (color.name.toLowerCase() !== 'white') {
          coloredTemplate = coloredTemplate.tint(color.tint)
        }
        
        // Composite the logo onto the template at calculated position
        const mockupBuffer = await coloredTemplate
          .composite([{
            input: resizedLogo,
            top: Math.max(0, logoTop),
            left: Math.max(0, logoLeft),
          }])
          .png()
          .toBuffer()
        
        // Upload the generated mockup to S3
        const mockupFileName = `mockup-${designName.replace(/\s+/g, '-')}-${productType.replace(/\s+/g, '-')}-${color.name}-${Date.now()}.png`
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
