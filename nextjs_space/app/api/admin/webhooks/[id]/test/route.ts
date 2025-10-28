
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const webhook = await prisma.webhook.findUnique({
      where: { id: params.id },
    });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Create a test order payload
    const testPayload = {
      event: webhook.topic,
      timestamp: new Date().toISOString(),
      store: 'basketballgearstore.abacusai.app',
      order: {
        id: 'test-order-' + Date.now(),
        number: 'TEST-001',
        status: 'pending',
        total: '89.99',
        currency: 'USD',
        customer: {
          name: 'Test Customer',
          email: 'test@example.com',
        },
        items: [
          {
            id: 'test-item-1',
            name: 'Custom Basketball Jersey',
            quantity: 1,
            price: '89.99',
            sku: 'JERSEY-001',
            design: {
              logoUrl: 'https://i.pinimg.com/736x/9b/b3/46/9bb346ae3653d58b92257e96828f8d92.jpg',
              position: 'center',
            },
          },
        ],
        shipping: {
          name: 'Test Customer',
          address: '123 Test St',
          city: 'Test City',
          state: 'CA',
          zip: '90210',
          country: 'US',
        },
      },
    };

    // Send test webhook
    const response = await fetch(webhook.deliveryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Test': 'true',
        'X-Store-URL': 'basketballgearstore.abacusai.app',
      },
      body: JSON.stringify(testPayload),
    });

    if (response.ok) {
      return NextResponse.json({ 
        success: true,
        message: 'Test webhook sent successfully',
        statusCode: response.status,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Webhook endpoint returned an error',
        statusCode: response.status,
        error: await response.text(),
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error testing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to test webhook: ' + error.message },
      { status: 500 }
    );
  }
}
