const PRINTFUL_API_BASE = 'https://api.printful.com';

interface PrintfulProduct {
  id: number;
  name: string;
  variants: PrintfulVariant[];
}

interface PrintfulVariant {
  id: number;
  product_id: number;
  name: string;
  color: string;
  color_code: string;
  size: string;
}

interface MockupGenerationTask {
  task_key: string;
  status: 'pending' | 'completed' | 'failed';
  mockups?: MockupResult[];
  error?: string;
}

interface MockupResult {
  placement: string;
  variant_ids: number[];
  mockup_url: string;
  extra: MockupExtra[];
}

interface MockupExtra {
  title: string;
  url: string;
  option: string;
  option_group: string;
}

interface PrintfulFile {
  url: string;
  position?: {
    area_width: number;
    area_height: number;
    width: number;
    height: number;
    top: number;
    left: number;
  };
}

export const BASKETBALL_PRODUCTS = {
  jersey: { id: 586, name: 'Recycled unisex basketball jersey' },
  tshirt: { id: 71, name: 'Unisex Staple T-Shirt' },
  hoodie: { id: 380, name: 'Unisex Premium Hoodie' },
  sweatshirt: { id: 372, name: 'Unisex Crew Neck Sweatshirt' },
  shorts: { id: 588, name: 'Recycled unisex basketball shorts' },
  tankTop: { id: 308, name: 'Unisex Tank Top' },
};

export class PrintfulClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.PRINTFUL_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[Printful] No API key provided. Set PRINTFUL_API_KEY environment variable.');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${PRINTFUL_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Printful API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.result;
  }

  async getProduct(productId: number): Promise<PrintfulProduct> {
    return this.request<PrintfulProduct>(`/products/${productId}`);
  }

  async getProductVariants(productId: number): Promise<PrintfulVariant[]> {
    const product = await this.request<{ product: any; variants: PrintfulVariant[] }>(`/products/${productId}`);
    return product.variants;
  }

  async getVariantsByColor(productId: number, colorName: string): Promise<PrintfulVariant[]> {
    const variants = await this.getProductVariants(productId);
    return variants.filter(v => 
      v.color.toLowerCase().includes(colorName.toLowerCase()) ||
      v.name.toLowerCase().includes(colorName.toLowerCase())
    );
  }

  async createMockupTask(
    productId: number,
    variantIds: number[],
    designUrl: string,
    placement: string = 'front'
  ): Promise<string> {
    const files: PrintfulFile[] = [{
      url: designUrl,
      position: {
        area_width: 1800,
        area_height: 2400,
        width: 1800,
        height: 1800,
        top: 300,
        left: 0,
      },
    }];

    const body = {
      variant_ids: variantIds,
      files: [{
        placement,
        image_url: designUrl,
        position: {
          area_width: 1800,
          area_height: 2400,
          width: 1200,
          height: 1200,
          top: 300,
          left: 300,
        },
      }],
    };

    const result = await this.request<{ task_key: string }>(`/mockup-generator/create-task/${productId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return result.task_key;
  }

  async getMockupTaskResult(taskKey: string): Promise<MockupGenerationTask> {
    return this.request<MockupGenerationTask>(`/mockup-generator/task?task_key=${taskKey}`);
  }

  async waitForMockupTask(taskKey: string, maxAttempts: number = 30, delayMs: number = 2000): Promise<MockupResult[]> {
    for (let i = 0; i < maxAttempts; i++) {
      const task = await this.getMockupTaskResult(taskKey);
      
      if (task.status === 'completed' && task.mockups) {
        return task.mockups;
      }
      
      if (task.status === 'failed') {
        throw new Error(`Mockup generation failed: ${task.error}`);
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    throw new Error('Mockup generation timed out');
  }

  async generateMockups(
    productId: number,
    variantIds: number[],
    designUrl: string,
    placement: string = 'front'
  ): Promise<MockupResult[]> {
    const taskKey = await this.createMockupTask(productId, variantIds, designUrl, placement);
    return this.waitForMockupTask(taskKey);
  }

  async generateAllColorMockups(
    productType: keyof typeof BASKETBALL_PRODUCTS,
    designUrl: string
  ): Promise<{ color: string; colorCode: string; mockupUrl: string }[]> {
    const product = BASKETBALL_PRODUCTS[productType];
    if (!product) {
      throw new Error(`Unknown product type: ${productType}`);
    }

    const variants = await this.getProductVariants(product.id);
    
    const colorGroups = new Map<string, PrintfulVariant>();
    for (const variant of variants) {
      if (!colorGroups.has(variant.color)) {
        colorGroups.set(variant.color, variant);
      }
    }

    const variantIds = Array.from(colorGroups.values()).map(v => v.id);
    
    const mockups = await this.generateMockups(product.id, variantIds, designUrl);
    
    const results: { color: string; colorCode: string; mockupUrl: string }[] = [];
    
    for (const mockup of mockups) {
      for (const variantId of mockup.variant_ids) {
        const variant = variants.find(v => v.id === variantId);
        if (variant && !results.find(r => r.color === variant.color)) {
          results.push({
            color: variant.color,
            colorCode: variant.color_code || '#000000',
            mockupUrl: mockup.mockup_url,
          });
        }
      }
    }

    return results;
  }
}

export const printfulClient = new PrintfulClient();
