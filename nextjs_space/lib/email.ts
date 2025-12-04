import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@basketballfactory.com';
const STORE_NAME = 'Basketball Factory';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Email not configured: RESEND_API_KEY not set');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${STORE_NAME} <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully:', data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

// Order Confirmation Email
export async function sendOrderConfirmation(order: {
  id: string;
  customerEmail: string;
  customerName: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number; size?: string; color?: string }>;
  shippingAddress: { street: string; city: string; state: string; zip: string };
}) {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.size || '-'}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">$${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f97316; color: white; padding: 20px; text-align: center;">
        <h1>🏀 ${STORE_NAME}</h1>
        <p>Order Confirmation</p>
      </div>
      <div style="padding: 20px;">
        <h2>Thank you for your order, ${order.customerName}!</h2>
        <p>Order #: <strong>${order.id.slice(-8).toUpperCase()}</strong></p>
        
        <h3>Order Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: left;">Size</th>
              <th style="padding: 10px; text-align: left;">Qty</th>
              <th style="padding: 10px; text-align: left;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        
        <div style="margin-top: 20px; text-align: right;">
          <strong>Total: $${order.total.toFixed(2)}</strong>
        </div>
        
        <h3>Shipping Address</h3>
        <p>
          ${order.shippingAddress.street}<br>
          ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}
        </p>
        
        <p style="margin-top: 30px; color: #666;">
          We'll send you another email when your order ships.
        </p>
      </div>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #666;">
        <p>© ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: order.customerEmail,
    subject: `Order Confirmed #${order.id.slice(-8).toUpperCase()} - ${STORE_NAME}`,
    html,
  });
}

// Shipping Notification Email
export async function sendShippingNotification(order: {
  id: string;
  customerEmail: string;
  customerName: string;
  trackingNumber: string;
  carrier: string;
  trackingUrl?: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f97316; color: white; padding: 20px; text-align: center;">
        <h1>🏀 ${STORE_NAME}</h1>
        <p>Your Order Has Shipped!</p>
      </div>
      <div style="padding: 20px;">
        <h2>Great news, ${order.customerName}!</h2>
        <p>Your order #${order.id.slice(-8).toUpperCase()} is on its way.</p>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Carrier:</strong> ${order.carrier}</p>
          <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
          ${order.trackingUrl ? `<p><a href="${order.trackingUrl}" style="color: #f97316;">Track Your Package →</a></p>` : ''}
        </div>

        <p style="color: #666;">Estimated delivery: 5-7 business days</p>
      </div>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #666;">
        <p>© ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: order.customerEmail,
    subject: `Your Order Has Shipped! #${order.id.slice(-8).toUpperCase()}`,
    html,
  });
}

// Abandoned Cart Recovery Email
export async function sendAbandonedCartEmail(cart: {
  customerEmail: string;
  customerName?: string;
  items: Array<{ name: string; price: number; imageUrl?: string }>;
  cartUrl: string;
  discountCode?: string;
}) {
  const itemsHtml = cart.items.slice(0, 3).map(item => `
    <div style="display: flex; align-items: center; margin: 10px 0; padding: 10px; border: 1px solid #eee; border-radius: 8px;">
      ${item.imageUrl ? `<img src="${item.imageUrl}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 10px;">` : ''}
      <div>
        <p style="margin: 0; font-weight: bold;">${item.name}</p>
        <p style="margin: 5px 0 0; color: #f97316;">$${item.price.toFixed(2)}</p>
      </div>
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f97316; color: white; padding: 20px; text-align: center;">
        <h1>🏀 ${STORE_NAME}</h1>
        <p>You Left Something Behind!</p>
      </div>
      <div style="padding: 20px;">
        <h2>Hey${cart.customerName ? ` ${cart.customerName}` : ''}!</h2>
        <p>We noticed you left some awesome gear in your cart. Don't let them get away!</p>

        <div style="margin: 20px 0;">
          ${itemsHtml}
          ${cart.items.length > 3 ? `<p style="color: #666;">...and ${cart.items.length - 3} more items</p>` : ''}
        </div>

        ${cart.discountCode ? `
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-weight: bold;">🎉 Special Offer!</p>
          <p style="margin: 5px 0;">Use code <strong>${cart.discountCode}</strong> for 10% off!</p>
        </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${cart.cartUrl}" style="background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Complete Your Purchase →</a>
        </div>
      </div>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #666;">
        <p>© ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: cart.customerEmail,
    subject: `Don't forget your basketball gear! 🏀`,
    html,
  });
}

// Payment Failed Email
export async function sendPaymentFailedEmail(order: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  retryUrl: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #ef4444; color: white; padding: 20px; text-align: center;">
        <h1>🏀 ${STORE_NAME}</h1>
        <p>Payment Issue</p>
      </div>
      <div style="padding: 20px;">
        <h2>Hi ${order.customerName},</h2>
        <p>We couldn't process your payment for order #${order.orderId.slice(-8).toUpperCase()}.</p>
        <p>This could be due to:</p>
        <ul>
          <li>Insufficient funds</li>
          <li>Incorrect card details</li>
          <li>Card expired</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${order.retryUrl}" style="background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Update Payment Method →</a>
        </div>

        <p style="color: #666;">If you need help, please contact our support team.</p>
      </div>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #666;">
        <p>© ${new Date().getFullYear()} ${STORE_NAME}. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: order.customerEmail,
    subject: `Action Required: Payment Issue - Order #${order.orderId.slice(-8).toUpperCase()}`,
    html,
  });
}

