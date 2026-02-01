
import type { Metadata } from "next"
import { Audiowide, Saira, Russo_One } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "@/components/session-provider"
import { Toaster } from "sonner"
import Chatbot from "@/components/chatbot"
import ErrorBoundary from "@/components/error-boundary"

const audiowide = Audiowide({ 
  weight: "400",
  subsets: ["latin"],
  variable: "--font-audiowide"
})

const saira = Saira({ 
  subsets: ["latin"],
  variable: "--font-saira"
})

const russoOne = Russo_One({ 
  weight: "400",
  subsets: ["latin"],
  variable: "--font-russo-one"
})

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: "Basketball Factory & Rise as One AAU | Basketball Apparel & Gear",
  description: "Premium basketball apparel and gear for Rise as One AAU Club and The Basketball Factory. Performance jerseys, casual wear, and accessories for youth basketball players.",
  keywords: "basketball, AAU, jerseys, apparel, youth basketball, Rise as One, Basketball Factory, gear, accessories",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Basketball Factory & Rise as One AAU | Basketball Apparel & Gear",
    description: "Premium basketball apparel and gear for youth basketball players",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Basketball Factory & Rise as One AAU",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${saira.variable} ${audiowide.variable} ${russoOne.variable} font-sans`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SessionProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <Chatbot />
            <Toaster position="top-right" />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
