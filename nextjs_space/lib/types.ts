
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      firstName?: string | null
      lastName?: string | null
      role: "USER" | "ADMIN"
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    firstName?: string | null
    lastName?: string | null
    role: "USER" | "ADMIN"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    firstName?: string | null
    lastName?: string | null
    role: "USER" | "ADMIN"
  }
}

// Product types
export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl: string
  images: string[]
  sizes: string[]
  colors: string[]
  stock: number
  inStock: boolean
  featured: boolean
  brand?: string
  createdAt: Date | string
  updatedAt: Date | string
}

// API Response types
export interface ApiError {
  error: string
  message?: string
}
