// Server-only storage module - do not import in client components
// This module handles file upload/download with S3 or local fallback

import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import fs from 'fs'
import path from 'path'

// Check if S3 is available
function isS3Available(): boolean {
  const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID
  const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY
  const hasBucketName = !!process.env.AWS_BUCKET_NAME
  
  // If explicit credentials are set, S3 is available
  if (hasAccessKey && hasSecretKey && hasBucketName) {
    return true
  }
  
  // Check if AWS_PROFILE is set and we're in production
  const hasProfile = !!process.env.AWS_PROFILE
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (hasProfile && isProduction && hasBucketName) {
    return true
  }
  
  return false
}

function getBucketConfig() {
  return {
    bucketName: process.env.AWS_BUCKET_NAME,
    folderPrefix: process.env.AWS_FOLDER_PREFIX || ""
  }
}

let s3Client: S3Client | null = null

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-west-2',
    })
  }
  return s3Client
}

function getContentType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop()
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
    default:
      return 'application/octet-stream'
  }
}

/**
 * Upload file to local public folder (fallback for development)
 */
async function uploadFileLocally(buffer: Buffer, fileName: string): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  
  // Ensure uploads directory exists
  await fs.promises.mkdir(uploadsDir, { recursive: true })
  
  // Sanitize filename
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '-')
  const localPath = path.join(uploadsDir, sanitizedFileName)
  
  await fs.promises.writeFile(localPath, buffer)
  
  // Return path relative to public folder
  const relativePath = `/uploads/${sanitizedFileName}`
  console.log('[Local Storage] File saved:', relativePath)
  
  return relativePath
}

/**
 * Upload file - uses S3 if available, otherwise falls back to local storage
 */
export async function uploadFile(buffer: Buffer, fileName: string): Promise<string> {
  // Try S3 first if credentials are available
  if (isS3Available()) {
    try {
      const { bucketName, folderPrefix } = getBucketConfig()
      
      if (!bucketName) {
        throw new Error("AWS_BUCKET_NAME is not configured")
      }
      
      const key = `${folderPrefix}${fileName}`
      
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: getContentType(fileName),
      })
      
      await getS3Client().send(command)
      
      console.log('[S3] File uploaded successfully:', key)
      return key
    } catch (error) {
      console.warn('[S3] Upload failed, falling back to local storage:', error)
    }
  }
  
  // Fallback to local storage
  return uploadFileLocally(buffer, fileName)
}

/**
 * Download file - returns URL for local files or S3 signed URL
 */
export async function downloadFile(key: string): Promise<string> {
  // If it's a local path, return it directly
  if (key.startsWith('/')) {
    return key
  }
  
  if (!isS3Available()) {
    console.warn('[S3] Download not available - S3 not configured')
    return key
  }
  
  const { bucketName } = getBucketConfig()
  
  if (!bucketName) {
    throw new Error("AWS_BUCKET_NAME is not configured")
  }
  
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  })
  
  const url = await getSignedUrl(getS3Client(), command, { expiresIn: 3600 })
  return url
}

/**
 * Delete file - handles both local and S3 files
 */
export async function deleteFile(key: string): Promise<void> {
  // If it's a local path, delete locally
  if (key.startsWith('/')) {
    const localPath = path.join(process.cwd(), 'public', key)
    try {
      await fs.promises.unlink(localPath)
      console.log('[Local Storage] File deleted:', localPath)
    } catch (error) {
      console.warn('[Local Storage] Failed to delete file:', localPath, error)
    }
    return
  }
  
  if (!isS3Available()) {
    console.warn('[S3] Delete not available - S3 not configured')
    return
  }
  
  const { bucketName } = getBucketConfig()
  
  if (!bucketName) {
    throw new Error("AWS_BUCKET_NAME is not configured")
  }
  
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  })
  
  await getS3Client().send(command)
}

