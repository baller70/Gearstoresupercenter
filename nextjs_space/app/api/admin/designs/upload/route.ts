
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadFile } from '@/lib/s3'
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
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PNG, JPG, and SVG are allowed' },
        { status: 400 }
      )
    }
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Upload to S3
    const cloud_storage_path = await uploadFile(buffer, file.name)
    
    // Create design record in database
    const design = await prisma.design.create({
      data: {
        name: name || file.name,
        imageUrl: cloud_storage_path,
        colors: [], // Will be populated by analysis
        basketballElements: null,
        status: 'PENDING',
      },
    })
    
    return NextResponse.json({
      success: true,
      designId: design.id,
      imageUrl: cloud_storage_path,
    })
  } catch (error) {
    console.error('Design upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload design' },
      { status: 500 }
    )
  }
}
