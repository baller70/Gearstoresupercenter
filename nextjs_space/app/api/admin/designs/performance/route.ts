
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
    
    // Get all designs with products and sales
    const designs = await prisma.design.findMany({
      include: {
        products: {
          include: {
            orderItems: {
              include: {
                order: true,
              },
            },
          },
        },
      },
    })
    
    // Calculate performance metrics
    const designsWithMetrics = designs.map(design => {
      const products = design.products
      const totalProducts = products.length
      
      // Calculate total revenue and sales
      let totalRevenue = 0
      let totalUnitsSold = 0
      
      products.forEach(product => {
        product.orderItems.forEach(item => {
          totalRevenue += item.price * item.quantity
          totalUnitsSold += item.quantity
        })
      })
      
      return {
        id: design.id,
        name: design.name,
        status: design.status,
        imageUrl: design.imageUrl,
        createdAt: design.createdAt,
        totalProducts,
        totalRevenue,
        totalUnitsSold,
        averageRevenuePerProduct: totalProducts > 0 ? totalRevenue / totalProducts : 0,
      }
    })
    
    // Sort by revenue
    designsWithMetrics.sort((a, b) => b.totalRevenue - a.totalRevenue)
    
    return NextResponse.json({
      designs: designsWithMetrics,
    })
  } catch (error) {
    console.error('Error fetching design performance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch design performance' },
      { status: 500 }
    )
  }
}
