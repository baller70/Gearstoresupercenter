/**
 * Order Fulfillment Service
 * Automatically forwards paid orders to POD provider (Printify)
 */

import { prisma } from './db';
import { createOrder, isPrintifyConfigured, PrintifyAddress, PrintifyOrderItem } from './printify';

export interface FulfillmentResult {
  success: boolean;
  printifyOrderId?: string;
  error?: string;
}

/**
 * Forward an order to Printify for fulfillment
 */
export async function fulfillOrder(orderId: string): Promise<FulfillmentResult> {
  try {
    if (!isPrintifyConfigured()) {
      console.warn('Printify not configured, skipping fulfillment');
      return { success: false, error: 'POD provider not configured' };
    }

    // Get the order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { product: true }
        },
        user: true,
      }
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.status !== 'PAID') {
      return { success: false, error: 'Order not in PAID status' };
    }

    if (order.printifyOrderId) {
      return { success: false, error: 'Order already submitted to Printify' };
    }

    // Parse shipping name into first/last
    const nameParts = (order.shippingName || '').split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Prepare Printify address
    const address: PrintifyAddress = {
      firstName,
      lastName,
      email: order.shippingEmail || order.user.email,
      country: order.shippingCountry || 'US',
      region: order.shippingState || '',
      address1: order.shippingAddress || '',
      city: order.shippingCity || '',
      zip: order.shippingZip || '',
    };

    // Map order items to Printify line items
    // NOTE: Products need printifyProductId and printifyVariantId in the database
    const lineItems: PrintifyOrderItem[] = order.items
      .filter(item => item.product.printifyProductId && item.product.printifyVariantId)
      .map(item => ({
        productId: item.product.printifyProductId!,
        variantId: item.product.printifyVariantId!,
        quantity: item.quantity,
        // If there's a custom design, include print areas
        printAreas: item.customization ? {
          front: (item.customization as any).logoUrl,
        } : undefined,
      }));

    if (lineItems.length === 0) {
      // No items mapped to Printify products
      console.warn(`Order ${orderId} has no items mapped to Printify products`);
      return { success: false, error: 'No items mapped to POD products' };
    }

    // Create order in Printify
    const printifyOrder = await createOrder({
      externalId: order.id,
      lineItems,
      shippingMethod: 1, // Standard shipping
      address,
      sendShippingNotification: true,
    });

    // Update order with Printify order ID
    await prisma.order.update({
      where: { id: orderId },
      data: {
        printifyOrderId: printifyOrder.id,
        status: 'PROCESSING',
      }
    });

    console.log(`Order ${orderId} submitted to Printify: ${printifyOrder.id}`);
    
    return { success: true, printifyOrderId: printifyOrder.id };

  } catch (error: any) {
    console.error(`Fulfillment error for order ${orderId}:`, error);
    
    // Mark order for manual review
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'FULFILLMENT_ERROR',
        notes: `Fulfillment error: ${error.message}`,
      }
    }).catch(() => {});

    return { success: false, error: error.message };
  }
}

/**
 * Process all paid orders that haven't been submitted to POD
 * Called by cron job
 */
export async function processUnfulfilledOrders(): Promise<{ processed: number; errors: number }> {
  const orders = await prisma.order.findMany({
    where: {
      status: 'PAID',
      printifyOrderId: null,
    },
    take: 50, // Process in batches
  });

  let processed = 0;
  let errors = 0;

  for (const order of orders) {
    const result = await fulfillOrder(order.id);
    if (result.success) {
      processed++;
    } else {
      errors++;
    }
    
    // Small delay between orders to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`Processed ${processed} orders, ${errors} errors`);
  return { processed, errors };
}
