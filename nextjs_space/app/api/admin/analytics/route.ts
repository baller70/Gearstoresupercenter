
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
    
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const days = parseInt(period)
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // Get orders in the period
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                design: true,
              },
            },
          },
        },
        user: true,
      },
    })
    
    // Calculate metrics
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    
    // Get total products and customers
    const totalProducts = await prisma.product.count()
    const totalCustomers = await prisma.user.count({
      where: { role: 'USER' },
    })
    
    // Revenue by day
    const revenueByDay = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + order.total
      return acc
    }, {} as Record<string, number>)
    
    const revenueData = Object.entries(revenueByDay)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))
    
    // Top products
    const productSales = orders.flatMap(order =>
      order.orderItems.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        revenue: item.price * item.quantity,
      }))
    )
    
    const productStats = productSales.reduce((acc, sale) => {
      if (!acc[sale.productId]) {
        acc[sale.productId] = {
          id: sale.productId,
          name: sale.productName,
          quantity: 0,
          revenue: 0,
        }
      }
      acc[sale.productId].quantity += sale.quantity
      acc[sale.productId].revenue += sale.revenue
      return acc
    }, {} as Record<string, any>)
    
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
    
    // Sales by category
    const categorySales = orders.flatMap(order =>
      order.orderItems.map(item => ({
        category: item.product.category,
        revenue: item.price * item.quantity,
      }))
    )
    
    const categoryStats = categorySales.reduce((acc, sale) => {
      acc[sale.category] = (acc[sale.category] || 0) + sale.revenue
      return acc
    }, {} as Record<string, number>)
    
    const salesByCategory = Object.entries(categoryStats).map(([category, revenue]) => ({
      category,
      revenue,
    }))
    
    // Recent orders
    const recentOrders = orders
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map(order => ({
        id: order.id,
        customerName: order.user.firstName && order.user.lastName 
          ? `${order.user.firstName} ${order.user.lastName}`
          : order.user.firstName || order.user.email,
        customerEmail: order.user.email,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
      }))
    
    return NextResponse.json({
      metrics: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        totalProducts,
        totalCustomers,
      },
      revenueData,
      topProducts,
      salesByCategory,
      recentOrders,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
