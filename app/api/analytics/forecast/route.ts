
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const ABACUS_API_KEY = process.env.ABACUSAI_API_KEY;
const ABACUS_API_URL = 'https://api.abacus.ai/v1/chat/completions';

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

    // Get historical sales data for last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: ninetyDaysAgo },
        status: { in: ['DELIVERED', 'SHIPPED'] },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Aggregate sales data
    const salesByDay: Record<string, number> = {};
    const salesByCategory: Record<string, number> = {};

    orders.forEach((order: any) => {
      const date = order.createdAt.toISOString().split('T')[0];
      salesByDay[date] = (salesByDay[date] || 0) + order.total;

      order.items.forEach((item: any) => {
        const category = item.product.category;
        salesByCategory[category] = (salesByCategory[category] || 0) + (item.price * item.quantity);
      });
    });

    // Use AI to generate forecast
    const prompt = `Analyze this sales data and provide a 30-day forecast:

Historical Sales (last 90 days):
Daily Sales: ${JSON.stringify(Object.entries(salesByDay).slice(-30))}
Sales by Category: ${JSON.stringify(salesByCategory)}

Provide forecast in JSON format:
{
  "nextMonth": {
    "predictedRevenue": number,
    "confidence": "high/medium/low",
    "trend": "up/down/stable"
  },
  "byCategory": {
    "PERFORMANCE_APPAREL": { "predicted": number, "confidence": number },
    "CASUAL_WEAR": { "predicted": number, "confidence": number },
    "ACCESSORIES": { "predicted": number, "confidence": number }
  },
  "insights": ["insight1", "insight2"],
  "recommendations": ["recommendation1", "recommendation2"]
}`;

    const response = await fetch(ABACUS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ABACUS_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a business intelligence analyst specializing in e-commerce forecasting.' },
          { role: 'user', content: prompt },
        ],
        model: 'gpt-4o',
        temperature: 0.3,
      }),
    });

    const aiData = await response.json();
    const forecast = JSON.parse(aiData.choices[0].message.content);

    // Save forecast to database
    const forecastDate = new Date();
    forecastDate.setDate(forecastDate.getDate() + 30);

    await prisma.salesForecast.create({
      data: {
        forecastDate,
        predictedSales: forecast.nextMonth.predictedRevenue,
        confidence: forecast.nextMonth.confidence === 'high' ? 0.9 : forecast.nextMonth.confidence === 'medium' ? 0.7 : 0.5,
        factors: JSON.stringify(forecast.insights),
      },
    });

    return NextResponse.json(forecast);
  } catch (error) {
    console.error('Sales forecast error:', error);
    return NextResponse.json({ error: 'Failed to generate forecast' }, { status: 500 });
  }
}
