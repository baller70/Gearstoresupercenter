
import { Navigation } from "@/components/navigation"
import { CartItems } from "@/components/cart-items"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, ArrowLeft, CreditCard } from "lucide-react"
import Link from "next/link"
import { getDevSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function CartPage() {
  const session = await getDevSession()

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 max-w-4xl py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Shopping Cart
            </Badge>
            <h1 className="text-3xl font-bold">Your Cart</h1>
          </div>
          
          <Button variant="ghost" asChild>
            <Link href="/products" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <CartItems />
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span id="subtotal">$0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping:</span>
                    <span className="text-green-600">FREE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax:</span>
                    <span id="tax">$0.00</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span id="total" className="text-primary">$0.00</span>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full bg-primary hover:bg-primary/90" size="lg" asChild>
                  <Link href="/checkout" className="flex items-center justify-center">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Proceed to Checkout
                  </Link>
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  Free shipping on all orders over $50
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
