
import { Canvas, Image as CanvasImage, createCanvas, loadImage } from 'canvas';
import path from 'path';

interface MockupPosition {
  x: number; // percentage from left
  y: number; // percentage from top
  scale: number; // size multiplier
}

export class MockupGenerator {
  private garmentTemplates: Map<string, string> = new Map([
    ['tshirt', 'tshirt-template.png'],
    ['jersey', 'jersey-template.png'],
    ['hoodie', 'hoodie-template.png'],
    ['shorts', 'shorts-template.png']
  ]);

  /**
   * Get absolute path to template file
   */
  private getTemplatePath(garmentType: string): string {
    const templateFile = this.garmentTemplates.get(garmentType);
    if (!templateFile) {
      throw new Error(`No template found for garment type: ${garmentType}`);
    }
    // Templates are in public/mockups/ directory
    return path.join(process.cwd(), 'public', 'mockups', templateFile);
  }

  /**
   * Get precise chest positioning for logo placement
   */
  private getChestPosition(garmentType: string, customPosition?: MockupPosition): MockupPosition {
    // If custom position provided, use it
    if (customPosition) {
      return customPosition;
    }

    // Default chest positions optimized for each garment type
    const positions: Record<string, MockupPosition> = {
      'tshirt': { x: 50, y: 35, scale: 1.0 },
      'jersey': { x: 50, y: 32, scale: 0.9 },
      'hoodie': { x: 50, y: 38, scale: 1.1 },
      'shorts': { x: 75, y: 25, scale: 0.7 } // Bottom right for shorts
    };

    return positions[garmentType] || { x: 50, y: 35, scale: 1.0 };
  }

  /**
   * Apply color tint to grayscale template
   */
  private applyColorTint(ctx: any, width: number, height: number, color: string) {
    // Set blend mode to multiply for color tinting
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    // Reset blend mode
    ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * Generate a mockup with logo positioned on chest area
   */
  async generateMockup(
    logoPath: string,
    garmentType: string,
    color: string,
    customPosition?: MockupPosition
  ): Promise<Buffer> {
    console.log(`[Mockup Generator] Starting generation for ${garmentType} in ${color}`);
    console.log(`[Mockup Generator] Logo path: ${logoPath}`);
    
    try {
      const templatePath = this.getTemplatePath(garmentType);
      console.log(`[Mockup Generator] Template path: ${templatePath}`);

      // Load garment template
      const template = await loadImage(templatePath);
      console.log(`[Mockup Generator] Template loaded successfully (${template.width}x${template.height})`);

      // Create canvas matching template size
      const canvas = createCanvas(template.width, template.height);
      const ctx = canvas.getContext('2d');

      // Fill background with solid color first
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the template on top (it will blend with the background color)
      ctx.globalAlpha = 1.0;
      ctx.drawImage(template, 0, 0, canvas.width, canvas.height);
      console.log(`[Mockup Generator] Garment template drawn`);

      // Load logo
      const logo = await loadImage(logoPath);
      console.log(`[Mockup Generator] Logo loaded successfully (${logo.width}x${logo.height})`);
      
      // Get chest position
      const position = this.getChestPosition(garmentType, customPosition);

      // Calculate logo dimensions with scale - base size proportional to canvas
      const baseLogoSize = canvas.width * 0.25; // Logo is 25% of canvas width
      const logoWidth = baseLogoSize * position.scale;
      const logoHeight = (logo.height / logo.width) * logoWidth;
      console.log(`[Mockup Generator] Logo dimensions: ${logoWidth}x${logoHeight}, position: (${position.x}%, ${position.y}%)`);

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
      console.log(`[Mockup Generator] Logo drawn at (${x}, ${y})`);

      const buffer = canvas.toBuffer('image/png');
      console.log(`[Mockup Generator] ✅ Mockup generated successfully, size: ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      console.error('[Mockup Generator] ❌ Error:', error);
      throw error; // Re-throw to see the actual error
    }
  }

  /**
   * Generate all color variants for a brand
   */
  async generateBrandVariants(
    logoPath: string,
    garmentType: string,
    brand: string,
    customPosition?: MockupPosition
  ): Promise<Map<string, Buffer>> {
    const variants = new Map<string, Buffer>();

    const brandColors: Record<string, Array<{ name: string; hex: string }>> = {
      'rise-as-one': [
        { name: 'Black', hex: '#000000' },
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Red', hex: '#DC2626' },
        { name: 'Grey', hex: '#6B7280' }
      ],
      'basketball-factory': [
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Black', hex: '#000000' },
        { name: 'Navy', hex: '#1E3A8A' },
        { name: 'Gold', hex: '#F59E0B' }
      ]
    };

    const colors = brandColors[brand] || brandColors['rise-as-one'];

    for (const color of colors) {
      const mockup = await this.generateMockup(
        logoPath,
        garmentType,
        color.hex,
        customPosition
      );
      variants.set(color.name, mockup);
    }

    return variants;
  }
}

export const mockupGenerator = new MockupGenerator();
