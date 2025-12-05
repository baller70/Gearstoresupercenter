
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { deleteFile } from '@/lib/storage.server'

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
    const id = searchParams.get('id')
    
    if (id) {
      // Get single design
      const design = await prisma.design.findUnique({
        where: { id },
        include: {
          products: {
            orderBy: {
              name: 'asc',
            },
          },
        },
      })
      
      if (!design) {
        return NextResponse.json(
          { error: 'Design not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(design)
    }
    
    // Get all designs
    const designs = await prisma.design.findMany({
      include: {
        products: {
          select: {
            id: true,
            name: true,
            category: true,
            inStock: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return NextResponse.json({ designs })
  } catch (error) {
    console.error('Error fetching designs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch designs' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const designId = searchParams.get('id')
    
    if (!designId) {
      return NextResponse.json(
        { error: 'Design ID is required' },
        { status: 400 }
      )
    }
    
    // Get design to delete file from S3
    const design = await prisma.design.findUnique({
      where: { id: designId },
      include: { products: true },
    })
    
    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      )
    }
    
    // Delete associated products first
    if (design.products.length > 0) {
      await prisma.product.deleteMany({
        where: { designId: design.id },
      })
    }
    
    // Delete file from S3
    try {
      await deleteFile(design.imageUrl)
    } catch (error) {
      console.error('Error deleting file from S3:', error)
      // Continue with database deletion even if S3 deletion fails
    }
    
    // Delete design from database
    await prisma.design.delete({
      where: { id: designId },
    })
    
    return NextResponse.json({
      success: true,
      message: 'Design and associated products deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting design:', error)
    return NextResponse.json(
      { error: 'Failed to delete design' },
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
    
    const { designId, status } = await request.json()
    
    if (!designId || !status) {
      return NextResponse.json(
        { error: 'Design ID and status are required' },
        { status: 400 }
      )
    }
    
    const design = await prisma.design.update({
      where: { id: designId },
      data: { status },
    })
    
    return NextResponse.json({
      success: true,
      design,
    })
  } catch (error) {
    console.error('Error updating design:', error)
    return NextResponse.json(
      { error: 'Failed to update design' },
      { status: 500 }
    )
  }
}
