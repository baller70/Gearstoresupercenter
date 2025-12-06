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
  price: string;
  retail_price?: string;
  currency: string;
  in_stock: boolean;
}

interface PrintfulCatalogProduct {
  id: number;
  type: string;
  type_name: string;
  brand: string;
  model: string;
  image: string;
  variant_count: number;
  currency: string;
  files: PrintfulFileSpec[];
  options: PrintfulOption[];
  dimensions: any;
}

interface PrintfulFileSpec {
  id: string;
  type: string;
  title: string;
  additional_price: string;
}

interface PrintfulOption {
  id: string;
  title: string;
  type: string;
  values: { [key: string]: string };
  additional_price: string;
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

interface PrintfulOrderItem {
  variant_id: number;
  quantity: number;
  retail_price?: string;
  name?: string;
  files?: Array<{
    url: string;
  }>;
}

interface PrintfulOrderRecipient {
  name: string;
  address1: string;
  city: string;
  state_code: string;
  country_code: string;
  zip: string;
  email?: string;
  phone?: string;
}

interface PrintfulOrderRequest {
  recipient: PrintfulOrderRecipient;
  items: PrintfulOrderItem[];
  retail_costs?: {
    currency: string;
    subtotal: string;
    discount?: string;
    shipping: string;
    tax?: string;
  };
}

interface PrintfulOrder {
  id: number;
  external_id?: string;
  status: string;
  shipping: string;
  created: number;
  updated: number;
  recipient: PrintfulOrderRecipient;
  items: any[];
  costs: any;
  retail_costs: any;
  shipments: Array<{
    carrier: string;
    service: string;
    tracking_number: string;
    tracking_url: string;
    created: number;
  }>;
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

  // ============================================
  // PRODUCT CATALOG SYNC
  // ============================================

  async getCatalogProducts(): Promise<PrintfulCatalogProduct[]> {
    return this.request<PrintfulCatalogProduct[]>('/products');
  }

  async getCatalogProduct(productId: number): Promise<PrintfulCatalogProduct> {
    return this.request<PrintfulCatalogProduct>(`/products/${productId}`);
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

  // ============================================
  // MOCKUP GENERATION
  // ============================================

  async createMockupTask(
    productId: number,
    variantIds: number[],
    designUrl: string,
    placement: string = 'front'
  ): Promise<string> {
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

  // ============================================
  // PRICING & VARIANTS
  // ============================================

  async getVariantPricing(variantId: number): Promise<{ cost: number; retail: number; currency: string }> {
    const variants = await this.getProductVariants(Math.floor(variantId / 1000));
    const variant = variants.find(v => v.id === variantId);
    
    if (!variant) {
      throw new Error(`Variant ${variantId} not found`);
    }

    return {
      cost: parseFloat(variant.price),
      retail: variant.retail_price ? parseFloat(variant.retail_price) : parseFloat(variant.price) * 2,
      currency: variant.currency,
    };
  }

  async calculateProductPricing(
    productId: number,
    profitMarginPercent: number = 100
  ): Promise<Map<number, { cost: number; retail: number; profit: number }>> {
    const variants = await this.getProductVariants(productId);
    const pricing = new Map<number, { cost: number; retail: number; profit: number }>();

    for (const variant of variants) {
      const cost = parseFloat(variant.price);
      const retail = cost * (1 + profitMarginPercent / 100);
      const profit = retail - cost;

      pricing.set(variant.id, { cost, retail, profit });
    }

    return pricing;
  }

  // ============================================
  // ORDER FULFILLMENT
  // ============================================

  async createOrder(orderData: PrintfulOrderRequest, externalId?: string): Promise<PrintfulOrder> {
    const body: any = {
      ...orderData,
      external_id: externalId,
    };

    return this.request<PrintfulOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async confirmOrder(orderId: number): Promise<PrintfulOrder> {
    return this.request<PrintfulOrder>(`/orders/${orderId}/confirm`, {
      method: 'POST',
    });
  }

  async getOrder(orderId: number): Promise<PrintfulOrder> {
    return this.request<PrintfulOrder>(`/orders/${orderId}`);
  }

  async getOrderByExternalId(externalId: string): Promise<PrintfulOrder> {
    return this.request<PrintfulOrder>(`/orders/@${externalId}`);
  }

  async cancelOrder(orderId: number): Promise<PrintfulOrder> {
    return this.request<PrintfulOrder>(`/orders/${orderId}`, {
      method: 'DELETE',
    });
  }

  async estimateOrderCosts(orderData: PrintfulOrderRequest): Promise<any> {
    return this.request('/orders/estimate-costs', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // ============================================
  // WEBHOOK VERIFICATION
  // ============================================

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('hex');
    return calculatedSignature === signature;
  }

  parseWebhookEvent(payload: any): {
    type: string;
    orderId?: number;
    status?: string;
    tracking?: { carrier: string; number: string; url: string };
  } {
    return {
      type: payload.type,
      orderId: payload.data?.order?.id,
      status: payload.data?.order?.status,
      tracking: payload.data?.shipment ? {
        carrier: payload.data.shipment.carrier,
        number: payload.data.shipment.tracking_number,
        url: payload.data.shipment.tracking_url,
      } : undefined,
    };
  }
}

export const printfulClient = new PrintfulClient();
