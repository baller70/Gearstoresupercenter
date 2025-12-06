import { NextAuthOptions, User, Session } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { getServerSession as nextAuthGetServerSession } from "next-auth/next"

// ============================================
// DEV AUTH BYPASS CONFIGURATION
// ============================================
// Set BYPASS_AUTH=true in .env.local to skip authentication in development
// This creates a mock admin session without requiring login
const BYPASS_AUTH = process.env.BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development'

// Mock admin user for development bypass
const DEV_MOCK_USER: Session['user'] = {
  id: 'dev-admin-user',
  email: 'admin@basketballfactory.com',
  firstName: 'Dev',
  lastName: 'Admin',
  role: 'ADMIN',
  name: 'Dev Admin',
}

// Mock session for development bypass
const DEV_MOCK_SESSION: Session = {
  user: DEV_MOCK_USER,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
}

/**
 * Get server session with optional dev bypass
 * Use this instead of getServerSession from next-auth/next
 * When BYPASS_AUTH=true in development, returns a mock admin session
 */
export async function getDevSession(): Promise<Session | null> {
  if (BYPASS_AUTH) {
    console.log('[Auth] Dev bypass enabled - returning mock admin session')
    return DEV_MOCK_SESSION
  }
  return nextAuthGetServerSession(authOptions)
}

/**
 * Check if auth bypass is enabled (for conditional UI/logging)
 */
export function isAuthBypassed(): boolean {
  return BYPASS_AUTH
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<User | null> {
        // Dev bypass: auto-authenticate with any credentials
        if (BYPASS_AUTH) {
          console.log('[Auth] Dev bypass - auto-authenticating as admin')
          return {
            id: 'dev-admin-user',
            email: 'admin@basketballfactory.com',
            firstName: 'Dev',
            lastName: 'Admin',
            role: 'ADMIN',
          } as User
        }

        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user?.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        } as User
      }
    })
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id
        session.user.firstName = token.firstName
        session.user.lastName = token.lastName
        session.user.role = token.role
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.firstName = user.firstName
        token.lastName = user.lastName
        token.role = user.role
      }
      return token
    },
  },
}
