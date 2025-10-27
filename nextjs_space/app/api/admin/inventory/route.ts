
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
    
    // Get all products with stock info
    const products = await prisma.product.findMany({
      include: {
        design: true,
        orderItems: {
          include: {
            order: true,
          },
        },
      },
      orderBy: [
        { stock: 'asc' },
      ],
    })
    
    // Calculate sales velocity and reorder suggestions
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const productsWithMetrics = products.map(product => {
      // Calculate sales in last 30 days
      const recentSales = product.orderItems
        .filter(item => item.order.createdAt >= thirtyDaysAgo)
        .reduce((sum, item) => sum + item.quantity, 0)
      
      const salesVelocity = recentSales / 30 // units per day
      const daysUntilStockout = salesVelocity > 0 ? product.stock / salesVelocity : Infinity
      
      const needsReorder = product.stock < 10 || daysUntilStockout < 14
      const suggestedReorderQuantity = Math.max(0, Math.ceil(salesVelocity * 30) - product.stock)
      
      return {
        id: product.id,
        name: product.name,
        category: product.category,
        stock: product.stock,
        inStock: product.inStock,
        price: product.price,
        designName: product.design?.name || 'No Design',
        recentSales,
        salesVelocity,
        daysUntilStockout: isFinite(daysUntilStockout) ? Math.round(daysUntilStockout) : null,
        needsReorder,
        suggestedReorderQuantity,
        status: product.stock === 0 ? 'OUT_OF_STOCK' 
               : product.stock < 10 ? 'LOW_STOCK' 
               : 'IN_STOCK',
      }
    })
    
    // Separate by status
    const outOfStock = productsWithMetrics.filter(p => p.status === 'OUT_OF_STOCK')
    const lowStock = productsWithMetrics.filter(p => p.status === 'LOW_STOCK')
    const needsReorder = productsWithMetrics.filter(p => p.needsReorder)
    
    return NextResponse.json({
      products: productsWithMetrics,
      summary: {
        total: products.length,
        outOfStock: outOfStock.length,
        lowStock: lowStock.length,
        needsReorder: needsReorder.length,
      },
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { productId, stock } = await request.json()
    
    if (!productId || stock === undefined) {
      return NextResponse.json(
        { error: 'Product ID and stock are required' },
        { status: 400 }
      )
    }
    
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        stock,
        inStock: stock > 0,
      },
    })
    
    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error) {
    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    )
  }
}
