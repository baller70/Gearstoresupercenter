
import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { createS3Client, getBucketConfig } from '@/lib/aws-config'
import fs from 'fs'
import path from 'path'

// This endpoint serves images from S3 OR local files with fresh signed URLs on each request
// This solves the expiration issue while keeping S3 objects private
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the key/path from the path segments
    const key = params.path.join('/')
    
    console.log(`[Image Proxy] Fetching image: ${key}`)
    
    // Check if this is a local generated mockup
    if (key.startsWith('generated-mockups/')) {
      const localPath = path.join(process.cwd(), 'public', key)
      
      console.log(`[Image Proxy] Checking local file: ${localPath}`)
      
      if (fs.existsSync(localPath)) {
        console.log(`[Image Proxy] Serving local file: ${localPath}`)
        
        const buffer = fs.readFileSync(localPath)
        const contentType = getContentTypeFromKey(key)
        
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
            'Content-Length': buffer.length.toString(),
          },
        })
      } else {
        console.error(`[Image Proxy] Local file not found: ${localPath}`)
        return NextResponse.json(
          { error: 'Image not found locally' },
          { status: 404 }
        )
      }
    }
    
    // Otherwise, fetch from S3
    const s3Client = createS3Client()
    const { bucketName } = getBucketConfig()
    
    if (!bucketName) {
      return NextResponse.json(
        { error: 'S3 bucket not configured' },
        { status: 500 }
      )
    }
    
    console.log(`[Image Proxy] Fetching from S3: ${key}`)
    
    // Get the object from S3
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
    
    const response = await s3Client.send(command)
    
    if (!response.Body) {
      return NextResponse.json(
        { error: 'Image not found in S3' },
        { status: 404 }
      )
    }
    
    // Stream the image data
    const arrayBuffer = await response.Body.transformToByteArray()
    const buffer = Buffer.from(arrayBuffer)
    
    // Determine content type
    const contentType = response.ContentType || getContentTypeFromKey(key)
    
    // Return the image with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('[Image Proxy] Error fetching image:', error)
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    )
  }
}

function getContentTypeFromKey(key: string): string {
  const ext = key.toLowerCase().split('.').pop()
  
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'svg':
      return 'image/svg+xml'
    case 'webp':
      return 'image/webp'
    case 'gif':
      return 'image/gif'
    default:
      return 'image/jpeg'
  }
}
