import { PrintfulClient, BASKETBALL_PRODUCTS } from './printful-client';

interface MockupPosition {
  x: number;
  y: number;
  scale: number;
}

interface GeneratedMockup {
  color: string;
  colorCode: string;
  mockupUrl: string;
  productType: string;
}

export class MockupGenerator {
  private printful: PrintfulClient;

  constructor(apiKey?: string) {
    this.printful = new PrintfulClient(apiKey);
  }

  async generateMockup(
    designUrl: string,
    garmentType: keyof typeof BASKETBALL_PRODUCTS,
    color?: string
  ): Promise<GeneratedMockup[]> {
    console.log(`[Mockup Generator] Starting Printful mockup generation for ${garmentType}`);
    
    try {
      const product = BASKETBALL_PRODUCTS[garmentType];
      if (!product) {
        throw new Error(`Unknown garment type: ${garmentType}`);
      }

      const variants = await this.printful.getProductVariants(product.id);
      
      let targetVariants = variants;
      if (color) {
        targetVariants = variants.filter(v => 
          v.color.toLowerCase().includes(color.toLowerCase())
        );
        if (targetVariants.length === 0) {
          console.warn(`[Mockup Generator] Color "${color}" not found, using all colors`);
          targetVariants = variants;
        }
      }

      const colorGroups = new Map<string, number>();
      for (const variant of targetVariants) {
        if (!colorGroups.has(variant.color)) {
          colorGroups.set(variant.color, variant.id);
        }
      }

      const variantIds = Array.from(colorGroups.values());
      const mockups = await this.printful.generateMockups(product.id, variantIds, designUrl);

      const results: GeneratedMockup[] = [];
      for (const mockup of mockups) {
        for (const variantId of mockup.variant_ids) {
          const variant = variants.find(v => v.id === variantId);
          if (variant && !results.find(r => r.color === variant.color)) {
            results.push({
              color: variant.color,
              colorCode: variant.color_code || '#000000',
              mockupUrl: mockup.mockup_url,
              productType: garmentType,
            });
          }
        }
      }

      console.log(`[Mockup Generator] ✅ Generated ${results.length} mockups`);
      return results;
    } catch (error) {
      console.error('[Mockup Generator] ❌ Error:', error);
      throw error;
    }
  }

  async generateAllProductMockups(
    designUrl: string,
    productTypes: (keyof typeof BASKETBALL_PRODUCTS)[] = ['jersey', 'tshirt', 'hoodie', 'shorts']
  ): Promise<GeneratedMockup[]> {
    const allMockups: GeneratedMockup[] = [];

    for (const productType of productTypes) {
      try {
        const mockups = await this.generateMockup(designUrl, productType);
        allMockups.push(...mockups);
      } catch (error) {
        console.error(`[Mockup Generator] Failed to generate ${productType} mockups:`, error);
      }
    }

    return allMockups;
  }

  async generateBrandVariants(
    designUrl: string,
    garmentType: keyof typeof BASKETBALL_PRODUCTS,
    brand: string
  ): Promise<Map<string, string>> {
    const mockups = await this.generateMockup(designUrl, garmentType);
    const variants = new Map<string, string>();

    for (const mockup of mockups) {
      variants.set(mockup.color, mockup.mockupUrl);
    }

    return variants;
  }

  getAvailableProducts(): { type: string; name: string; id: number }[] {
    return Object.entries(BASKETBALL_PRODUCTS).map(([type, product]) => ({
      type,
      name: product.name,
      id: product.id,
    }));
  }

  async getAvailableColors(productType: keyof typeof BASKETBALL_PRODUCTS): Promise<string[]> {
    const product = BASKETBALL_PRODUCTS[productType];
    if (!product) {
      throw new Error(`Unknown product type: ${productType}`);
    }

    const variants = await this.printful.getProductVariants(product.id);
    const colors = new Set<string>();
    
    for (const variant of variants) {
      colors.add(variant.color);
    }

    return Array.from(colors);
  }
}

export const mockupGenerator = new MockupGenerator();
