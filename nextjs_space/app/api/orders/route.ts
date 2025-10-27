
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      total,
      items,
      shippingName,
      shippingEmail,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      shippingCountry,
      billingName,
      billingAddress,
      billingCity,
      billingState,
      billingZip,
      billingCountry
    } = body

    if (!total || !items?.length) {
      return NextResponse.json(
        { error: "Order total and items are required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Create order with order items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          total,
          shippingName: shippingName || '',
          shippingEmail: shippingEmail || '',
          shippingAddress: shippingAddress || '',
          shippingCity: shippingCity || '',
          shippingState: shippingState || '',
          shippingZip: shippingZip || '',
          shippingCountry: shippingCountry || 'US',
          billingName: billingName || '',
          billingAddress: billingAddress || '',
          billingCity: billingCity || '',
          billingState: billingState || '',
          billingZip: billingZip || '',
          billingCountry: billingCountry || 'US',
          status: 'PENDING'
        }
      })

      // Create order items
      await tx.orderItem.createMany({
        data: items?.map((item: any) => ({
          orderId: newOrder.id,
          productId: item?.productId,
          quantity: item?.quantity ?? 1,
          price: item?.price ?? 0,
          size: item?.size,
          color: item?.color
        })) ?? []
      })

      // Clear user's cart
      await tx.cartItem.deleteMany({
        where: { userId: user.id }
      })

      // Award loyalty points (10 points per dollar spent)
      const pointsEarned = Math.floor(total * 10)
      
      await tx.loyaltyTransaction.create({
        data: {
          userId: user.id,
          points: pointsEarned,
          type: 'PURCHASE',
          description: `Earned ${pointsEarned} points from order #${newOrder.id.slice(-8)}`,
          orderId: newOrder.id,
        },
      })

      await tx.user.update({
        where: { id: user.id },
        data: {
          loyaltyPoints: {
            increment: pointsEarned,
          },
        },
      })

      return newOrder
    })

    return NextResponse.json(order)

  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        orderItems: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(orders ?? [])

  } catch (error) {
    console.error("Get orders error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
