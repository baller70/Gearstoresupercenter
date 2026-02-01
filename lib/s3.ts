// This file should only be imported by server-side code
// For client-side image URL handling, use getImageProxyUrl directly

/**
 * Convert storage path to URL for displaying images in the frontend
 * Handles both S3 keys and local paths
 * This function is safe for client-side use
 */
export function getImageProxyUrl(key: string): string {
  // If it's already a local path (starts with /uploads/ or /generated-mockups/), return it directly
  if (key.startsWith('/uploads/') || key.startsWith('/generated-mockups/') || key.startsWith('/mockups/')) {
    return key
  }

  // For S3 keys, use the proxy endpoint
  const cleanKey = key.replace(/^\/+/, '')
  return `/api/images/${cleanKey}`
}

/**
 * Get direct download URL (for admin or temporary use)
 * This is a placeholder for client-side - actual downloads should go through API routes
 */
export async function getDownloadUrl(key: string): Promise<string> {
  // For local paths, return them directly
  if (key.startsWith('/')) {
    return key
  }
  // For S3 keys, use the proxy URL
  return getImageProxyUrl(key)
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

// Export for server-side use (these will be imported dynamically in API routes)
export { getContentType }
