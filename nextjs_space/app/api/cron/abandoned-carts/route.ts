import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendAbandonedCartEmail } from '@/lib/email';

/**
 * Cron job to send abandoned cart recovery emails
 * Finds carts abandoned for 1+ hours and sends recovery emails
 *
 * Schedule: Every 6 hours
 * Vercel Cron: 0 0,6,12,18 * * *
 */

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting abandoned cart recovery cron job...');
    
    // Find users with cart items that haven't been modified in 1+ hours
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get users with abandoned carts (not checked out in last hour, but active in last day)
    const usersWithCarts = await prisma.user.findMany({
      where: {
        cartItems: {
          some: {
            updatedAt: {
              lt: oneHourAgo,
              gt: oneDayAgo,
            }
          }
        },
        // Don't send to users who already got an email recently
        abandonedCartEmailSentAt: {
          lt: oneDayAgo,
        }
      },
      include: {
        cartItems: {
          include: { product: true }
        }
      },
      take: 50, // Process in batches
    });

    let sent = 0;
    let errors = 0;
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    for (const user of usersWithCarts) {
      if (!user.email || user.cartItems.length === 0) continue;

      try {
        // Generate a discount code for recovery (optional)
        const discountCode = `COMEBACK${user.id.slice(-4).toUpperCase()}`;

        await sendAbandonedCartEmail({
          customerEmail: user.email,
          customerName: user.firstName || undefined,
          items: user.cartItems.map(item => ({
            name: item.product.name,
            price: item.product.price,
            imageUrl: item.product.imageUrl || undefined,
          })),
          cartUrl: `${baseUrl}/cart`,
          discountCode,
        });

        // Update last email sent time
        await prisma.user.update({
          where: { id: user.id },
          data: { abandonedCartEmailSentAt: new Date() }
        });

        sent++;
      } catch (error) {
        console.error(`Failed to send abandoned cart email to ${user.email}:`, error);
        errors++;
      }

      // Small delay between emails
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`Abandoned cart emails: ${sent} sent, ${errors} errors`);
    
    return NextResponse.json({
      success: true,
      sent,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Abandoned cart cron error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

