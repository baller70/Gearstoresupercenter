
"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingCart,
  User,
  LogOut,
  Settings,
  Menu,
  Circle,
  Home,
  Package,
  Heart,
  Users,
  Sparkles
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export function Navigation() {
  const { data: session, status } = useSession() || {}
  const [cartCount, setCartCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchCartCount = async () => {
      if (mounted && session?.user?.email) {
        try {
          const response = await fetch('/api/cart/count')
          if (response?.ok) {
            const data = await response.json()
            setCartCount(data?.count ?? 0)
          }
        } catch (error) {
          console.error('Error fetching cart count:', error)
        }
      }
    }

    if (mounted && status === 'authenticated') {
      fetchCartCount()
    }
  }, [mounted, session, status])

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Circle className="h-8 w-8 text-primary" />
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-tight">Basketball Factory</span>
                <span className="text-xs text-muted-foreground leading-tight">Rise as One AAU</span>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>
    )
  }

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false })
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const navigationItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Design Your Gear", href: "/design", icon: Sparkles },
    { name: "Performance Apparel", href: "/products?category=PERFORMANCE_APPAREL", icon: Package },
    { name: "Size Guide", href: "/size-guide", icon: Package },
    { name: "Casual Wear", href: "/products?category=CASUAL_WEAR", icon: Package },
    { name: "Accessories", href: "/products?category=ACCESSORIES", icon: Package },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Circle className="h-8 w-8 text-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight">Basketball Factory</span>
              <span className="text-xs text-muted-foreground leading-tight">Rise as One AAU</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems?.map((item) => (
              <Link
                key={item?.name}
                href={item?.href ?? '/'}
                className="text-sm font-medium transition-colors hover:text-primary flex items-center space-x-1"
              >
                <item.icon className="h-4 w-4" />
                <span>{item?.name}</span>
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {/* Wishlist */}
            {session && (
              <Link href="/wishlist">
                <Button variant="ghost" size="icon">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
            )}
            
            {/* Bulk Order */}
            <Link href="/bulk-order">
              <Button variant="ghost" size="icon">
                <Users className="h-5 w-5" />
              </Button>
            </Link>
            
            {/* Shopping Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/returns" className="flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      Returns & Refunds
                    </Link>
                  </DropdownMenuItem>
                  {session?.user?.role === 'ADMIN' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <nav className="flex flex-col space-y-4 mt-6">
                  {navigationItems?.map((item) => (
                    <Link
                      key={item?.name}
                      href={item?.href ?? '/'}
                      className="flex items-center space-x-3 text-sm font-medium transition-colors hover:text-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item?.name}</span>
                    </Link>
                  ))}
                  
                  <div className="border-t pt-4">
                    {session && (
                      <Link
                        href="/wishlist"
                        className="flex items-center space-x-3 text-sm font-medium transition-colors hover:text-primary mb-4"
                        onClick={() => setIsOpen(false)}
                      >
                        <Heart className="h-4 w-4" />
                        <span>My Wishlist</span>
                      </Link>
                    )}
                    <Link
                      href="/bulk-order"
                      className="flex items-center space-x-3 text-sm font-medium transition-colors hover:text-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      <Users className="h-4 w-4" />
                      <span>Bulk Team Order</span>
                    </Link>
                  </div>
                  
                  {!session && (
                    <>
                      <div className="border-t pt-4 mt-6">
                        <Link
                          href="/auth/signin"
                          className="flex items-center space-x-3 text-sm font-medium transition-colors hover:text-primary"
                          onClick={() => setIsOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          <span>Sign In</span>
                        </Link>
                      </div>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
