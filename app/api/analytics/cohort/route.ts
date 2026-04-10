
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

    // Get all users with their first order date
    const users = await prisma.user.findMany({
      include: {
        orders: {
          orderBy: { createdAt: 'asc' },
          where: {
            status: { in: ['DELIVERED', 'SHIPPED'] },
          },
        },
      },
    });

    // Group users by cohort (month of first purchase)
    const cohorts: Record<string, any> = {};

    users.forEach((customer: any) => {
      if (customer.orders.length === 0) return;

      const firstOrder = customer.orders[0];
      const cohortMonth = firstOrder.createdAt.toISOString().slice(0, 7); // YYYY-MM

      if (!cohorts[cohortMonth]) {
        cohorts[cohortMonth] = {
          month: cohortMonth,
          totalCustomers: 0,
          totalRevenue: 0,
          retention: {},
        };
      }

      cohorts[cohortMonth].totalCustomers++;
      cohorts[cohortMonth].totalRevenue += customer.orders.reduce((sum: number, o: any) => sum + o.total, 0);

      // Calculate retention for each subsequent month
      customer.orders.forEach((order: any) => {
        const orderMonth = order.createdAt.toISOString().slice(0, 7);
        if (orderMonth !== cohortMonth) {
          if (!cohorts[cohortMonth].retention[orderMonth]) {
            cohorts[cohortMonth].retention[orderMonth] = 0;
          }
          cohorts[cohortMonth].retention[orderMonth]++;
        }
      });
    });

    // Convert to array and calculate retention percentages
    const cohortArray = Object.values(cohorts).map((cohort: any) => {
      const retentionRates: Record<string, number> = {};
      Object.entries(cohort.retention).forEach(([month, count]: [string, any]) => {
        retentionRates[month] = Math.round((count / cohort.totalCustomers) * 100);
      });

      return {
        ...cohort,
        avgRevenuePerCustomer: Math.round(cohort.totalRevenue / cohort.totalCustomers * 100) / 100,
        retentionRates,
      };
    });

    // Sort by month
    cohortArray.sort((a, b) => b.month.localeCompare(a.month));

    return NextResponse.json(cohortArray);
  } catch (error) {
    console.error('Cohort analysis error:', error);
    return NextResponse.json({ error: 'Failed to perform cohort analysis' }, { status: 500 });
  }
}
