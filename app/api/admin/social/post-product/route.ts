
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface TwitterCredentials {
  api_key?: string
  api_secret?: string
  access_token?: string
  access_token_secret?: string
  bearer_token?: string
}

interface TwitterAccount {
  name: string
  credentials: TwitterCredentials
}

function getTwitterAccounts(): TwitterAccount[] {
  const accounts: TwitterAccount[] = []
  
  // Check for Basketball Factory account from environment variables
  if (process.env.TWITTER_BF_API_KEY && process.env.TWITTER_BF_ACCESS_TOKEN) {
    accounts.push({
      name: 'Basketball Factory',
      credentials: {
        api_key: process.env.TWITTER_BF_API_KEY,
        api_secret: process.env.TWITTER_BF_API_SECRET,
        access_token: process.env.TWITTER_BF_ACCESS_TOKEN,
        access_token_secret: process.env.TWITTER_BF_ACCESS_TOKEN_SECRET,
        bearer_token: process.env.TWITTER_BF_BEARER_TOKEN,
      },
    })
  }
  
  // Check for Rise as One AAU account from environment variables
  if (process.env.TWITTER_RAO_API_KEY && process.env.TWITTER_RAO_ACCESS_TOKEN) {
    accounts.push({
      name: 'Rise as One AAU',
      credentials: {
        api_key: process.env.TWITTER_RAO_API_KEY,
        api_secret: process.env.TWITTER_RAO_API_SECRET,
        access_token: process.env.TWITTER_RAO_ACCESS_TOKEN,
        access_token_secret: process.env.TWITTER_RAO_ACCESS_TOKEN_SECRET,
        bearer_token: process.env.TWITTER_RAO_BEARER_TOKEN,
      },
    })
  }
  
  return accounts
}

async function postToTwitter(account: TwitterAccount, message: string): Promise<boolean> {
  try {
    const { api_key, api_secret, access_token, access_token_secret } = account.credentials
    
    if (!api_key || !api_secret || !access_token || !access_token_secret) {
      console.log(`Missing credentials for ${account.name}`)
      return false
    }
    
    // Use Twitter API v2 to create a tweet
    const OAuth = require('oauth-1.0a')
    const crypto = require('crypto')
    
    const oauth = OAuth({
      consumer: {
        key: api_key,
        secret: api_secret,
      },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string: string, key: string) {
        return crypto.createHmac('sha1', key).update(base_string).digest('base64')
      },
    })
    
    const token = {
      key: access_token,
      secret: access_token_secret,
    }
    
    const requestData = {
      url: 'https://api.twitter.com/2/tweets',
      method: 'POST',
    }
    
    const authHeader = oauth.toHeader(oauth.authorize(requestData, token))
    
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message,
      }),
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error(`Failed to post to ${account.name}:`, error)
      return false
    }
    
    console.log(`Successfully posted to ${account.name}`)
    return true
  } catch (error) {
    console.error(`Error posting to ${account.name}:`, error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { productId, accounts } = await request.json()
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }
    
    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        design: true,
      },
    })
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    // Get Twitter accounts
    const twitterAccounts = getTwitterAccounts()
    
    if (twitterAccounts.length === 0) {
      return NextResponse.json(
        { error: 'No Twitter accounts configured' },
        { status: 400 }
      )
    }
    
    // Create tweet message
    const deployedUrl = process.env.NEXT_PUBLIC_DEPLOYED_URL || 'https://your-store.com'
    const productUrl = `${deployedUrl}/products/${product.id}`
    
    const message = `🏀 NEW ARRIVAL! 🏀

${product.name}

${product.description}

💰 $${product.price}

Shop now: ${productUrl}

#Basketball #AAU #Basketball Apparel #HoopsLife`
    
    // Post to selected accounts (or all if not specified)
    const accountsToPost = accounts && accounts.length > 0
      ? twitterAccounts.filter(acc => accounts.includes(acc.name))
      : twitterAccounts
    
    const results = await Promise.all(
      accountsToPost.map(account => postToTwitter(account, message))
    )
    
    const successCount = results.filter(Boolean).length
    
    return NextResponse.json({
      success: successCount > 0,
      posted: successCount,
      total: accountsToPost.length,
      message: `Posted to ${successCount} of ${accountsToPost.length} accounts`,
    })
  } catch (error) {
    console.error('Error posting to social media:', error)
    return NextResponse.json(
      { error: 'Failed to post to social media' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const accounts = getTwitterAccounts()
    
    return NextResponse.json({
      accounts: accounts.map(acc => ({
        name: acc.name,
        configured: !!(acc.credentials.api_key && acc.credentials.access_token),
      })),
    })
  } catch (error) {
    console.error('Error fetching social accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch social accounts' },
      { status: 500 }
    )
  }
}
