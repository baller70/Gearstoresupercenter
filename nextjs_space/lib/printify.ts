/**
 * Printify API Integration
 * Documentation: https://developers.printify.com/
 */

const PRINTIFY_API_URL = 'https://api.printify.com/v1';

interface PrintifyConfig {
  apiKey: string;
  shopId: string;
}

function getConfig(): PrintifyConfig | null {
  const apiKey = process.env.PRINTIFY_API_KEY;
  const shopId = process.env.PRINTIFY_SHOP_ID;
  
  if (!apiKey || !shopId) {
    console.warn('Printify not configured: PRINTIFY_API_KEY or PRINTIFY_SHOP_ID missing');
    return null;
  }
  
  return { apiKey, shopId };
}

async function printifyFetch(endpoint: string, options: RequestInit = {}) {
  const config = getConfig();
  if (!config) throw new Error('Printify not configured');

  const response = await fetch(`${PRINTIFY_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Printify API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json();
}

// Get all products in the shop
export async function getProducts() {
  const config = getConfig();
  if (!config) return [];
  
  return printifyFetch(`/shops/${config.shopId}/products.json`);
}

// Get a specific product
export async function getProduct(productId: string) {
  const config = getConfig();
  if (!config) return null;
  
  return printifyFetch(`/shops/${config.shopId}/products/${productId}.json`);
}

// Create an order in Printify
export interface PrintifyOrderItem {
  productId: string;          // Printify product ID
  variantId: number;          // Printify variant ID
  quantity: number;
  printAreas?: {
    front?: string;           // Image URL for front print
    back?: string;            // Image URL for back print
  };
}

export interface PrintifyAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country: string;
  region: string;             // State/Province
  address1: string;
  address2?: string;
  city: string;
  zip: string;
}

export interface CreatePrintifyOrderParams {
  externalId: string;         // Your order ID
  lineItems: PrintifyOrderItem[];
  shippingMethod: number;     // 1 = Standard, 2 = Express
  address: PrintifyAddress;
  sendShippingNotification?: boolean;
}

export async function createOrder(params: CreatePrintifyOrderParams) {
  const config = getConfig();
  if (!config) throw new Error('Printify not configured');

  const orderData = {
    external_id: params.externalId,
    line_items: params.lineItems.map(item => ({
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity,
      print_areas: item.printAreas,
    })),
    shipping_method: params.shippingMethod,
    send_shipping_notification: params.sendShippingNotification ?? true,
    address_to: {
      first_name: params.address.firstName,
      last_name: params.address.lastName,
      email: params.address.email,
      phone: params.address.phone || '',
      country: params.address.country,
      region: params.address.region,
      address1: params.address.address1,
      address2: params.address.address2 || '',
      city: params.address.city,
      zip: params.address.zip,
    },
  };

  return printifyFetch(`/shops/${config.shopId}/orders.json`, {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

// Get order status from Printify
export async function getOrder(orderId: string) {
  const config = getConfig();
  if (!config) return null;
  
  return printifyFetch(`/shops/${config.shopId}/orders/${orderId}.json`);
}

// Get order by external ID (your order ID)
export async function getOrderByExternalId(externalId: string) {
  const config = getConfig();
  if (!config) return null;
  
  const orders = await printifyFetch(`/shops/${config.shopId}/orders.json`);
  return orders.data?.find((order: any) => order.external_id === externalId);
}

// Cancel an order (only if not yet in production)
export async function cancelOrder(orderId: string) {
  const config = getConfig();
  if (!config) throw new Error('Printify not configured');
  
  return printifyFetch(`/shops/${config.shopId}/orders/${orderId}/cancel.json`, {
    method: 'POST',
  });
}

// Get available print providers for a blueprint
export async function getPrintProviders(blueprintId: number) {
  return printifyFetch(`/catalog/blueprints/${blueprintId}/print_providers.json`);
}

// Check if Printify is configured
export function isPrintifyConfigured(): boolean {
  return !!getConfig();
}
