
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { consumer_key, consumer_secret } = body;

    if (!consumer_key || !consumer_secret) {
      return NextResponse.json(
        { error: 'Missing consumer_key or consumer_secret' },
        { status: 400 }
      );
    }

    // Verify the credentials
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        key: consumer_key,
        secret: consumer_secret,
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Return access token (in WooCommerce OAuth 1.0a, we return the same credentials)
    return NextResponse.json({
      consumer_key,
      consumer_secret,
      key_permissions: apiKey.permissions,
    });
  } catch (error: any) {
    console.error('Access token error:', error);
    return NextResponse.json(
      { error: 'Failed to generate access token' },
      { status: 500 }
    );
  }
}
