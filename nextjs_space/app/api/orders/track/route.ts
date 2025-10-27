
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);

    // Get order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user is authorized to view this order
    if (session?.user?.id !== order.userId && session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate tracking timeline
    const timeline = generateOrderTimeline(order);

    return NextResponse.json({ 
      order,
      timeline,
    });

  } catch (error) {
    console.error('Order tracking error:', error);
    return NextResponse.json({ error: 'Failed to track order' }, { status: 500 });
  }
}

function generateOrderTimeline(order: any) {
  const timeline = [
    {
      status: 'PENDING',
      label: 'Order Placed',
      description: 'Your order has been received and is being processed.',
      date: order.createdAt,
      completed: true,
    },
  ];

  if (order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED') {
    timeline.push({
      status: 'PROCESSING',
      label: 'Processing',
      description: 'Your order is being prepared for shipment.',
      date: order.updatedAt,
      completed: true,
    });
  }

  if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
    timeline.push({
      status: 'SHIPPED',
      label: 'Shipped',
      description: 'Your order has been shipped and is on its way.',
      date: order.updatedAt,
      completed: true,
    });
  }

  if (order.status === 'DELIVERED') {
    timeline.push({
      status: 'DELIVERED',
      label: 'Delivered',
      description: 'Your order has been delivered successfully.',
      date: order.updatedAt,
      completed: true,
    });
  } else if (order.status !== 'CANCELLED') {
    // Add pending future steps
    if (order.status === 'PENDING') {
      timeline.push({
        status: 'PROCESSING',
        label: 'Processing',
        description: 'Your order will be prepared for shipment.',
        date: null,
        completed: false,
      });
    }
    
    if (order.status !== 'SHIPPED') {
      timeline.push({
        status: 'SHIPPED',
        label: 'Shipped',
        description: 'Your order will be shipped.',
        date: null,
        completed: false,
      });
    }
    
    timeline.push({
      status: 'DELIVERED',
      label: 'Delivered',
      description: 'Your order will be delivered.',
      date: null,
      completed: false,
    });
  }

  if (order.status === 'CANCELLED') {
    timeline.push({
      status: 'CANCELLED',
      label: 'Cancelled',
      description: 'This order has been cancelled.',
      date: order.updatedAt,
      completed: true,
    });
  }

  return timeline;
}
