import Stripe from 'stripe';

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      // @ts-ignore - API version compatibility
      apiVersion: '2024-11-20.acacia',
      typescript: true,
    })
  : null;

export interface CreateCheckoutSessionParams {
  orderId: string;
  customerEmail: string;
  lineItems: Array<{
    name: string;
    description?: string;
    price: number; // in dollars
    quantity: number;
    imageUrl?: string;
  }>;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export async function createCheckoutSession(params: CreateCheckoutSessionParams) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY.');
  }

  const { orderId, customerEmail, lineItems, successUrl, cancelUrl, metadata } = params;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: customerEmail,
    line_items: lineItems.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.description,
          images: item.imageUrl ? [item.imageUrl] : undefined,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    })),
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: {
      orderId,
      ...metadata,
    },
    shipping_address_collection: {
      allowed_countries: ['US', 'CA'],
    },
    billing_address_collection: 'required',
  });

  return session;
}

export async function retrieveCheckoutSession(sessionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured.');
  }
  
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'payment_intent'],
  });
}

export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  if (!stripe) {
    throw new Error('Stripe is not configured.');
  }
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set.');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

export async function createRefund(paymentIntentId: string, amount?: number) {
  if (!stripe) {
    throw new Error('Stripe is not configured.');
  }

  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined, // Full refund if no amount
  });
}

