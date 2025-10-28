
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

    // WooCommerce OAuth flow: POST credentials to callback_url
    const keyPermissions = scope || 'read_write';
    
    try {
      // Send POST request to callback_url with the credentials
      await fetch(callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          user_id: userId || 'oauth_user',
          consumer_key: consumerKey,
          consumer_secret: consumerSecret,
          key_permissions: keyPermissions,
        }),
      });
    } catch (postError) {
      console.error('Failed to POST to callback_url:', postError);
      // Continue even if POST fails - some apps might not need it
    }

    // Redirect user back to return_url if provided, otherwise to callback_url
    if (returnUrl) {
      const returnUrlObj = new URL(returnUrl);
      returnUrlObj.searchParams.set('success', '1');
      returnUrlObj.searchParams.set('user_id', userId || 'oauth_user');
      return NextResponse.redirect(returnUrlObj.toString());
    } else {
      // Fallback: redirect to callback_url with query params
      const callbackUrlObj = new URL(callbackUrl);
      callbackUrlObj.searchParams.set('success', '1');
      callbackUrlObj.searchParams.set('user_id', userId || 'oauth_user');
      callbackUrlObj.searchParams.set('consumer_key', consumerKey);
      callbackUrlObj.searchParams.set('consumer_secret', consumerSecret);
      callbackUrlObj.searchParams.set('key_permissions', keyPermissions);
      return NextResponse.redirect(callbackUrlObj.toString());
    }
  } catch (error: any) {
    console.error('OAuth authorization error:', error);
    
    // Try to redirect with error
    const returnUrl = request.nextUrl.searchParams.get('return_url');
    const callbackUrl = request.nextUrl.searchParams.get('callback_url');
    const userId = request.nextUrl.searchParams.get('user_id');
    
    const redirectUrl = returnUrl || callbackUrl;
    if (redirectUrl) {
      const urlObj = new URL(redirectUrl);
      urlObj.searchParams.set('success', '0');
      urlObj.searchParams.set('user_id', userId || 'oauth_user');
      urlObj.searchParams.set('message', error.message || 'Authorization failed');
      return NextResponse.redirect(urlObj.toString());
    }
    
    return new NextResponse('Authorization failed: ' + error.message, { status: 500 });
  }
}
