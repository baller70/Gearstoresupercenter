import { S3Client } from "@aws-sdk/client-s3"

export function getBucketConfig() {
  return {
    bucketName: process.env.AWS_BUCKET_NAME,
    folderPrefix: process.env.AWS_FOLDER_PREFIX || ""
  }
}

/**
 * Check if S3 credentials are available
 * Returns false for local development without AWS credentials
 */
export function isS3Available(): boolean {
  // Check for explicit AWS credentials or if running in AWS environment
  const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID
  const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY
  const hasBucketName = !!process.env.AWS_BUCKET_NAME

  // If explicit credentials are set, S3 is available
  if (hasAccessKey && hasSecretKey && hasBucketName) {
    return true
  }

  // Check if AWS_PROFILE is set and we're not in local dev mode
  const hasProfile = !!process.env.AWS_PROFILE
  const isProduction = process.env.NODE_ENV === 'production'

  // In production with a profile, assume S3 is available
  if (hasProfile && isProduction && hasBucketName) {
    return true
  }

  // In local development, default to local storage unless explicit credentials are set
  console.log('[AWS Config] S3 not available, using local storage fallback')
  return false
}

export function createS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION || 'us-west-2',
  })
}
