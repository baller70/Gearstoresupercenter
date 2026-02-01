import { NextRequest, NextResponse } from 'next/server';
import { processUnfulfilledOrders } from '@/lib/fulfillment';

/**
 * Cron job to process unfulfilled orders
 * Forwards paid orders to Printify for fulfillment
 * 
 * Schedule: Every 15 minutes
 * Vercel Cron: 0/15 * * * *
 */

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel sets this automatically for cron jobs)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting order processing cron job...');
    
    const result = await processUnfulfilledOrders();
    
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

