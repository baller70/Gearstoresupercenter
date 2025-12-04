import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      firstName?: string | null
      lastName?: string | null
      role: "USER" | "ADMIN" | "BUSINESS_ADMIN"
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    firstName?: string | null
    lastName?: string | null
    role: "USER" | "ADMIN" | "BUSINESS_ADMIN"
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    firstName?: string | null
    lastName?: string | null
    role: "USER" | "ADMIN" | "BUSINESS_ADMIN"
  }
}

