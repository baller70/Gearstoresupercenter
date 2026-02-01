
import path from 'path';
import fs from 'fs/promises';

interface MockupPosition {
  x: number; // percentage from left
  y: number; // percentage from top
  scale: number; // size multiplier
}

interface ColorDefinition {
  id: string;
  name: string;
  hex: string;
}

export class AdvancedMockupGenerator {
  private templateBasePath = path.join(process.cwd(), 'public', 'product-templates');
  
  private colors: ColorDefinition[] = [
    { id: 'black', name: 'Black', hex: '#000000' },
    { id: 'white', name: 'White', hex: '#FFFFFF' },
    { id: 'red', name: 'Red', hex: '#DC2626' },
    { id: 'grey', name: 'Grey', hex: '#6B7280' },
  ];

  private productTemplates: Record<string, string> = {
    'tshirt': 'tshirt_template.png',
    'jersey': 'jersey_template.png',
    'hoodie': 'hoodie_template.png',
    'shorts': 'shorts_template.png',
  };

  /**
   * Get default logo position for each product type
   */
  private getDefaultPosition(productType: string): MockupPosition {
    const positions: Record<string, MockupPosition> = {
      'tshirt': { x: 50, y: 35, scale: 1.0 },
      'jersey': { x: 50, y: 32, scale: 0.9 },
      'hoodie': { x: 50, y: 38, scale: 1.1 },
      'shorts': { x: 50, y: 30, scale: 0.7 },
    };

    return positions[productType] || { x: 50, y: 35, scale: 1.0 };
  }

  /**
   * Apply color tint to a canvas/image
   */
  private applyColorTint(ctx: any, width: number, height: number, color: string) {
    // If white, keep as is (template is already white)
    if (color === '#FFFFFF') {
      return;
    }

    // Apply color tint using multiply blend mode
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    // Restore normal compositing
    ctx.globalCompositeOperation = 'destination-over';
    
    // Add white background if color is not black
    if (color !== '#000000') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }
    
    ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * Generate a single mockup with logo overlay
   */
  async generateMockup(
    logoPath: string,
    productType: string,
    colorHex: string,
    customPosition?: MockupPosition
  ): Promise<Buffer> {
    console.log(`[Advanced Mockup] Generating ${productType} in ${colorHex}`);
    
    // Dynamically import canvas (avoids build-time errors)
    const { createCanvas, loadImage } = await import('canvas');
    
    try {
      const templateFile = this.productTemplates[productType];
      if (!templateFile) {
        throw new Error(`No template found for product type: ${productType}`);
      }

      const templatePath = path.join(this.templateBasePath, templateFile);
      
      // Check if template exists
      try {
        await fs.access(templatePath);
      } catch {
        throw new Error(`Template file not found: ${templatePath}`);
      }

      // Load product template (transparent PNG)
      const template = await loadImage(templatePath);
      console.log(`[Advanced Mockup] Template loaded: ${template.width}x${template.height}`);

      // Create canvas with same dimensions as template
      const canvas = createCanvas(template.width, template.height);
      const ctx = canvas.getContext('2d');

      // Draw template
      ctx.drawImage(template, 0, 0);
      
      // Apply color tint
      this.applyColorTint(ctx, canvas.width, canvas.height, colorHex);

      // Load and overlay logo
      const logo = await loadImage(logoPath);
      console.log(`[Advanced Mockup] Logo loaded: ${logo.width}x${logo.height}`);

      const position = customPosition || this.getDefaultPosition(productType);

      // Calculate logo dimensions
      const baseLogoSize = Math.min(canvas.width, canvas.height) * 0.25; // 25% of canvas size
      const logoWidth = baseLogoSize * position.scale;
      const logoHeight = (logo.height / logo.width) * logoWidth;

      // Calculate position in pixels
      const x = (canvas.width * position.x) / 100;
      const y = (canvas.height * position.y) / 100;

      // Draw logo centered at position
      ctx.drawImage(
        logo,
        x - logoWidth / 2,
        y - logoHeight / 2,
        logoWidth,
        logoHeight
      );

      console.log(`[Advanced Mockup] ✅ Logo overlaid at (${x}, ${y}) with size ${logoWidth}x${logoHeight}`);

      // Convert to buffer
      const buffer = canvas.toBuffer('image/png');
      console.log(`[Advanced Mockup] ✅ Mockup generated, size: ${buffer.length} bytes`);
      
      return buffer;
    } catch (error) {
      console.error('[Advanced Mockup] ❌ Error:', error);
      throw error;
    }
  }

  /**
   * Generate mockups for all colors
   */
  async generateAllColorVariants(
    logoPath: string,
    productType: string,
    position?: MockupPosition
  ): Promise<Map<string, Buffer>> {
    const mockups = new Map<string, Buffer>();

    for (const color of this.colors) {
      try {
        const mockup = await this.generateMockup(
          logoPath,
          productType,
          color.hex,
          position
        );
        mockups.set(color.id, mockup);
        console.log(`[Advanced Mockup] ✅ Generated ${productType} in ${color.name}`);
      } catch (error) {
        console.error(`[Advanced Mockup] ❌ Failed to generate ${productType} in ${color.name}:`, error);
      }
    }

    return mockups;
  }

  /**
   * Get list of available colors
   */
  getColors(): ColorDefinition[] {
    return this.colors;
  }

  /**
   * Get list of available product types
   */
  getProductTypes(): string[] {
    return Object.keys(this.productTemplates);
  }
}

export const advancedMockupGenerator = new AdvancedMockupGenerator();
