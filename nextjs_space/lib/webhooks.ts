
import { prisma } from './db';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  store: string;
  order: {
    id: string;
    number: string;
    status: string;
    total: string;
    currency: string;
    customer: {
      name: string;
      email: string;
    };
    items: Array<{
      id: string;
      name: string;
      quantity: number;
      price: string;
      sku?: string;
      design?: {
        logoUrl?: string;
        position?: string;
      };
    }>;
    shipping: {
      name: string;
      address: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };
}

export async function triggerWebhooks(topic: string, payload: WebhookPayload) {
  try {
    // Get all active webhooks for this topic
    const webhooks = await prisma.webhook.findMany({
      where: {
        topic,
        status: 'active',
      },
    });

    // Send webhook notifications
    const results = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        try {
          const response = await fetch(webhook.deliveryUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Topic': topic,
              'X-Store-URL': 'basketballgearstore.abacusai.app',
              'X-Webhook-Id': webhook.id,
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(30000), // 30 second timeout
          });

          if (!response.ok) {
            console.error(`Webhook ${webhook.id} failed:`, response.status, await response.text());
            return { success: false, webhookId: webhook.id, status: response.status };
          }

          return { success: true, webhookId: webhook.id };
        } catch (error) {
          console.error(`Webhook ${webhook.id} error:`, error);
          return { success: false, webhookId: webhook.id, error };
        }
      })
    );

    return results;
  } catch (error) {
    console.error('Error triggering webhooks:', error);
    return [];
  }
}

export async function createOrderWebhook(order: any) {
  const payload: WebhookPayload = {
    event: 'order.created',
    timestamp: new Date().toISOString(),
    store: 'basketballgearstore.abacusai.app',
    order: {
      id: order.id,
      number: order.orderNumber || `ORD-${order.id.slice(-8)}`,
      status: order.status || 'pending',
      total: order.total?.toString() || '0.00',
      currency: 'USD',
      customer: {
        name: order.customerName || 'Customer',
        email: order.customerEmail || 'customer@example.com',
      },
      items: (order.items || []).map((item: any) => ({
        id: item.id,
        name: item.productName || item.name || 'Product',
        quantity: item.quantity || 1,
        price: item.price?.toString() || '0.00',
        sku: item.product?.id || item.productId,
        design: item.customization?.logoUrl ? {
          logoUrl: item.customization.logoUrl,
          position: item.customization.logoPosition || 'center',
        } : undefined,
      })),
      shipping: {
        name: order.shippingAddress?.name || order.customerName || 'Customer',
        address: order.shippingAddress?.street || '',
        city: order.shippingAddress?.city || '',
        state: order.shippingAddress?.state || '',
        zip: order.shippingAddress?.zipCode || '',
        country: order.shippingAddress?.country || 'US',
      },
    },
  };

  return await triggerWebhooks('order.created', payload);
}
