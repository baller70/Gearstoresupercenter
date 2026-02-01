
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { itemId, quantity } = await request.json()

    if (!itemId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Item ID and valid quantity are required" },
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

    // Update cart item quantity
    const updatedItem = await prisma.cartItem.update({
      where: {
        id: itemId,
        userId: user.id // Ensure user can only update their own items
      },
      data: { quantity }
    })

    return NextResponse.json(updatedItem)

  } catch (error) {
    console.error("Update cart item error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
