
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ count: 0 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ count: 0 })
    }

    const count = await prisma.cartItem.count({
      where: { userId: user.id }
    })

    return NextResponse.json({ count: count ?? 0 })

  } catch (error) {
    console.error("Cart count error:", error)
    return NextResponse.json({ count: 0 })
  }
}
