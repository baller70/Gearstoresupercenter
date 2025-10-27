
import { prisma } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user and award signup bonus in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: firstName || null,
          lastName: lastName || null,
          loyaltyPoints: 100, // Welcome bonus
        }
      })

      // Create loyalty transaction for signup bonus
      await tx.loyaltyTransaction.create({
        data: {
          userId: newUser.id,
          points: 100,
          type: 'SIGNUP',
          description: 'Welcome bonus! Enjoy 100 points for joining.',
        },
      })

      return newUser
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: "User created successfully",
      user: userWithoutPassword
    })

  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
