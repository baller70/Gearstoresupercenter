
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { prisma } from './db';

export interface WooCommerceCredentials {
  consumerKey: string;
  consumerSecret: string;
  userId: string;
}

/**
 * Generate WooCommerce API credentials
 */
export async function generateWooCommerceCredentials(userId: string): Promise<WooCommerceCredentials> {
  const consumerKey = `ck_${crypto.randomBytes(20).toString('hex')}`;
  const consumerSecret = `cs_${crypto.randomBytes(20).toString('hex')}`;
  
  // Store in database
  await prisma.apiKey.create({
    data: {
      key: consumerKey,
      secret: consumerSecret,
      userId,
      name: 'WooCommerce Integration',
      permissions: ['read', 'write']
    }
  });
  
  return { consumerKey, consumerSecret, userId };
}

/**
 * Verify WooCommerce API authentication
 */
export async function verifyWooCommerceAuth(request: NextRequest): Promise<{ valid: boolean; userId?: string }> {
  // Check for OAuth parameters in query string
  const url = new URL(request.url);
  const consumerKey = url.searchParams.get('consumer_key');
  const consumerSecret = url.searchParams.get('consumer_secret');
  
  // Also check Authorization header (Basic Auth)
  const authHeader = request.headers.get('authorization');
  let keyFromHeader: string | null = null;
  let secretFromHeader: string | null = null;
  
  if (authHeader?.startsWith('Basic ')) {
    const base64Credentials = authHeader.slice(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [key, secret] = credentials.split(':');
    keyFromHeader = key;
    secretFromHeader = secret;
  }
  
  // Use query params or header
  const finalKey = consumerKey || keyFromHeader;
  const finalSecret = consumerSecret || secretFromHeader;
  
  if (!finalKey || !finalSecret) {
    return { valid: false };
  }
  
  try {
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        key: finalKey,
        secret: finalSecret
      }
    });
    
    if (!apiKey) {
      return { valid: false };
    }
    
    return { valid: true, userId: apiKey.userId };
  } catch (error) {
    console.error('WooCommerce auth error:', error);
    return { valid: false };
  }
}

/**
 * Create unauthorized response
 */
export function createUnauthorizedResponse() {
  return new Response(
    JSON.stringify({
      code: 'woocommerce_rest_cannot_view',
      message: 'Sorry, you cannot list resources.',
      data: { status: 401 }
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Basic realm="WooCommerce REST API"'
      }
    }
  );
}
