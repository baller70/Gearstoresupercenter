
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const appName = searchParams.get('app_name');
    const scope = searchParams.get('scope');
    const userId = searchParams.get('user_id');
    const returnUrl = searchParams.get('return_url');
    const callbackUrl = searchParams.get('callback_url');

    if (!callbackUrl) {
      return new NextResponse('Missing callback_url parameter', { status: 400 });
    }

    // Generate API credentials
    const consumerKey = 'ck_' + crypto.randomBytes(16).toString('hex');
    const consumerSecret = 'cs_' + crypto.randomBytes(32).toString('hex');

    // Store the API key in database
    // First, try to find an admin user to associate with the API key
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      throw new Error('No admin user found. Please create an admin user first.');
    }

    await prisma.apiKey.create({
      data: {
        name: appName || 'OAuth App',
        key: consumerKey,
        secret: consumerSecret,
        permissions: scope === 'read_write' ? ['read', 'write'] : ['read'],
        userId: adminUser.id,
      },
    });

    // Build the callback URL with success parameters
    const callback = new URL(callbackUrl);
    callback.searchParams.set('success', '1');
    callback.searchParams.set('user_id', userId || 'oauth_user');
    callback.searchParams.set('consumer_key', consumerKey);
    callback.searchParams.set('consumer_secret', consumerSecret);
    callback.searchParams.set('key_permissions', scope || 'read_write');

    // Redirect back to the requesting application
    return NextResponse.redirect(callback.toString());
  } catch (error: any) {
    console.error('OAuth authorization error:', error);
    
    // Try to redirect with error if callback_url exists
    const callbackUrl = request.nextUrl.searchParams.get('callback_url');
    if (callbackUrl) {
      const callback = new URL(callbackUrl);
      callback.searchParams.set('success', '0');
      callback.searchParams.set('error', error.message || 'Authorization failed');
      return NextResponse.redirect(callback.toString());
    }
    
    return new NextResponse('Authorization failed: ' + error.message, { status: 500 });
  }
}
