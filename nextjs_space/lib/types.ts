
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
