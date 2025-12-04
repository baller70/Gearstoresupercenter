import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';

/**
 * Cron job to generate and send daily report
 * 
 * Schedule: Daily at 8 AM
 * Vercel Cron: 0 8 * * *
 */

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Generating daily report...');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get yesterday's stats
    const [orders, revenue, newCustomers, topProducts] = await Promise.all([
      // Total orders
      prisma.order.count({
        where: {
          createdAt: { gte: yesterday, lt: today }
        }
      }),
      
      // Total revenue
      prisma.order.aggregate({
        where: {
          createdAt: { gte: yesterday, lt: today },
          status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] }
        },
        _sum: { total: true }
      }),
      
      // New customers
      prisma.user.count({
        where: {
          createdAt: { gte: yesterday, lt: today }
        }
      }),
      
      // Top products
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            createdAt: { gte: yesterday, lt: today }
          }
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    // Get product names for top products
    const productIds = topProducts.map(p => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    });
    const productMap = new Map(products.map(p => [p.id, p.name]));

    const report = {
      date: yesterday.toISOString().split('T')[0],
      orders,
      revenue: revenue._sum.total || 0,
      newCustomers,
      topProducts: topProducts.map(p => ({
        name: productMap.get(p.productId) || 'Unknown',
        quantity: p._sum.quantity || 0,
      })),
    };

    // Send report email to admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f97316; color: white; padding: 20px; text-align: center;">
            <h1>🏀 Daily Report</h1>
            <p>${report.date}</p>
          </div>
          <div style="padding: 20px;">
            <h2>Key Metrics</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Orders</strong></td><td>${report.orders}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Revenue</strong></td><td>$${report.revenue.toFixed(2)}</td></tr>
              <tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>New Customers</strong></td><td>${report.newCustomers}</td></tr>
            </table>
            
            <h2 style="margin-top: 20px;">Top Products</h2>
            <ol>
              ${report.topProducts.map(p => `<li>${p.name} (${p.quantity} sold)</li>`).join('')}
            </ol>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: adminEmail,
        subject: `Daily Report - ${report.date} - Basketball Factory`,
        html,
      });
    }

    return NextResponse.json({
      success: true,
      report,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Daily report cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

