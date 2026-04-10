
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateWooCommerceCredentials } from '@/lib/woocommerce-auth';
import { prisma } from '@/lib/db';

/**
 * GET /api/admin/woocommerce/credentials
 * Fetch existing WooCommerce API credentials
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Find existing credentials for this user
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        userId: session.user.id,
        name: 'WooCommerce Integration'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'No credentials found' }, { status: 404 });
    }

    // Get the deployed URL or use localhost for development
    const storeUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    return NextResponse.json({
      consumerKey: apiKey.key,
      consumerSecret: apiKey.secret,
      storeUrl,
      createdAt: apiKey.createdAt.toISOString()
    });
  } catch (error) {
    console.error('Failed to fetch credentials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/woocommerce/credentials
 * Generate new WooCommerce API credentials
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete existing credentials (if any)
    await prisma.apiKey.deleteMany({
      where: {
        userId: session.user.id,
        name: 'WooCommerce Integration'
      }
    });

    // Generate new credentials
    const credentials = await generateWooCommerceCredentials(session.user.id);

    // Get the deployed URL or use localhost for development
    const storeUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    return NextResponse.json({
      consumerKey: credentials.consumerKey,
      consumerSecret: credentials.consumerSecret,
      storeUrl,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to generate credentials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
