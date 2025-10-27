
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all users with orders
    const users = await prisma.user.findMany({
      include: {
        orders: {
          where: {
            status: { in: ['DELIVERED', 'SHIPPED'] },
          },
        },
      },
    });

    // Calculate LTV for each customer
    const ltvData = await Promise.all(
      users.map(async (customer: any) => {
        const totalSpent = customer.orders.reduce((sum: number, order: any) => sum + order.total, 0);
        const orderCount = customer.orders.length;
        const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

        // Get last purchase date
        const lastPurchaseDate = customer.orders.length > 0
          ? customer.orders.reduce((latest: Date, order: any) => 
              order.createdAt > latest ? order.createdAt : latest
            , customer.orders[0].createdAt)
          : null;

        const daysSinceLastPurchase = lastPurchaseDate
          ? Math.floor((new Date().getTime() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        // Simple LTV prediction: avgOrderValue * (predicted lifetime orders)
        // Assumes 1 order per quarter for active customers
        const predictedLTV = avgOrderValue * (orderCount > 0 ? 8 : 2);

        // Segment customers
        let segment = 'LOW_VALUE';
        if (totalSpent > 1000) segment = 'HIGH_VALUE';
        else if (totalSpent > 500) segment = 'MEDIUM_VALUE';
        else if (daysSinceLastPurchase && daysSinceLastPurchase > 90) segment = 'AT_RISK';

        // Upsert LTV data
        await prisma.customerLifetimeValue.upsert({
          where: { userId: customer.id },
          update: {
            totalSpent,
            orderCount,
            avgOrderValue,
            predictedLTV,
            segment,
            lastPurchaseDate,
            daysSinceLastPurchase,
            calculatedAt: new Date(),
          },
          create: {
            userId: customer.id,
            totalSpent,
            orderCount,
            avgOrderValue,
            predictedLTV,
            segment,
            lastPurchaseDate,
            daysSinceLastPurchase,
          },
        });

        return {
          userId: customer.id,
          email: customer.email,
          name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
          totalSpent,
          orderCount,
          avgOrderValue,
          predictedLTV,
          segment,
          lastPurchaseDate,
          daysSinceLastPurchase,
        };
      })
    );

    // Sort by predicted LTV
    ltvData.sort((a: any, b: any) => b.predictedLTV - a.predictedLTV);

    // Calculate summary stats
    const summary = {
      totalCustomers: ltvData.length,
      highValue: ltvData.filter((c: any) => c.segment === 'HIGH_VALUE').length,
      mediumValue: ltvData.filter((c: any) => c.segment === 'MEDIUM_VALUE').length,
      lowValue: ltvData.filter((c: any) => c.segment === 'LOW_VALUE').length,
      atRisk: ltvData.filter((c: any) => c.segment === 'AT_RISK').length,
      averageLTV: ltvData.reduce((sum: number, c: any) => sum + c.predictedLTV, 0) / ltvData.length || 0,
      totalProjectedValue: ltvData.reduce((sum: number, c: any) => sum + c.predictedLTV, 0),
    };

    return NextResponse.json({ customers: ltvData, summary });
  } catch (error) {
    console.error('Customer LTV error:', error);
    return NextResponse.json({ error: 'Failed to calculate customer LTV' }, { status: 500 });
  }
}
