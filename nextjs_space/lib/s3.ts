
import { 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand 
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { createS3Client, getBucketConfig } from "./aws-config"

const s3Client = createS3Client()

export async function uploadFile(buffer: Buffer, fileName: string): Promise<string> {
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
  
  await s3Client.send(command)
  
  return key // Return cloud_storage_path (S3 key)
}

export async function downloadFile(key: string): Promise<string> {
  const { bucketName } = getBucketConfig()
  
  if (!bucketName) {
    throw new Error("AWS_BUCKET_NAME is not configured")
  }
  
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  })
  
  // Generate signed URL valid for 1 hour
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
  
  return url
}

export async function deleteFile(key: string): Promise<void> {
  const { bucketName } = getBucketConfig()
  
  if (!bucketName) {
    throw new Error("AWS_BUCKET_NAME is not configured")
  }
  
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  })
  
  await s3Client.send(command)
}

export async function renameFile(oldKey: string, newKey: string): Promise<void> {
  // S3 doesn't have a rename operation, so we need to copy and delete
  // For simplicity, we'll just return the old key since design files don't need renaming
  throw new Error("Rename operation not supported")
}

/**
 * Convert S3 key to proxy URL that won't expire
 * This is used for displaying images in the frontend
 */
export function getImageProxyUrl(key: string): string {
  // Remove any leading slashes and folder prefix
  const cleanKey = key.replace(/^\/+/, '')
  return `/api/images/${cleanKey}`
}

/**
 * Get direct download URL (for admin or temporary use)
 */
export async function getDownloadUrl(key: string): Promise<string> {
  return downloadFile(key)
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
