
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get all customers with their order data
    const customers = await prisma.user.findMany({
      where: {
        role: 'USER',
      },
      include: {
        orders: {
          include: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    // Calculate customer metrics
    const customersWithMetrics = customers.map(customer => {
      const orders = customer.orders
      const totalOrders = orders.length
      const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
      const lastOrderDate = orders.length > 0
        ? orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
        : null
      
      return {
        id: customer.id,
        name: customer.firstName && customer.lastName 
          ? `${customer.firstName} ${customer.lastName}`
          : customer.firstName || customer.email,
        email: customer.email,
        createdAt: customer.createdAt,
        totalOrders,
        totalSpent,
        averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0,
        lastOrderDate,
      }
    })
    
    // Sort by total spent
    customersWithMetrics.sort((a, b) => b.totalSpent - a.totalSpent)
    
    return NextResponse.json({
      customers: customersWithMetrics,
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}
