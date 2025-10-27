
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { designId, positionX, positionY, scale } = await request.json()
    
    if (!designId || positionX === undefined || positionY === undefined || scale === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Update design position settings
    const design = await prisma.design.update({
      where: { id: designId },
      data: {
        positionX: parseFloat(positionX),
        positionY: parseFloat(positionY),
        scale: parseFloat(scale),
      },
    })
    
    return NextResponse.json({
      success: true,
      design,
    })
  } catch (error) {
    console.error('Update position error:', error)
    return NextResponse.json(
      { error: 'Failed to update position settings' },
      { status: 500 }
    )
  }
}
