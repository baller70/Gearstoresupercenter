
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  CreditCard, 
  ArrowLeft, 
  Truck, 
  MapPin, 
  User,
  Mail,
  Phone,
  Home,
  Building
} from "lucide-react"
import Link from "next/link"
import { formatPrice } from "@/lib/products"
import { toast } from "sonner"

interface CartItem {
  id: string
  quantity: number
  size?: string | null
  color?: string | null
  product: {
    id: string
    name: string
    price: number
  }
}

export default function CheckoutPage() {
  const { data: session, status } = useSession() || {}
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sameAsBilling, setSameAsBilling] = useState(true)

  const [formData, setFormData] = useState({
    // Shipping Information
    shippingName: "",
    shippingEmail: "",
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingZip: "",
    shippingCountry: "US",
    
    // Billing Information
    billingName: "",
    billingAddress: "",
    billingCity: "",
    billingState: "",
    billingZip: "",
    billingCountry: "US"
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    const fetchCartItems = async () => {
      try {
        const response = await fetch('/api/cart')
        if (response?.ok) {
          const data = await response.json()
          setCartItems(data ?? [])
        }
      } catch (error) {
        console.error('Error fetching cart items:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchCartItems()
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        shippingName: `${session.user.firstName ?? ''} ${session.user.lastName ?? ''}`.trim(),
        shippingEmail: session.user.email ?? '',
        billingName: `${session.user.firstName ?? ''} ${session.user.lastName ?? ''}`.trim()
      }))
    }
  }, [session])

  const subtotal = cartItems?.reduce((sum, item) => sum + (item?.product?.price ?? 0) * (item?.quantity ?? 0), 0) ?? 0
  const tax = subtotal * 0.08 // 8% tax
  const shipping = subtotal >= 50 ? 0 : 9.99
  const total = subtotal + tax + shipping

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Copy shipping to billing if checkbox is checked
    if (sameAsBilling && field.startsWith('shipping')) {
      const billingField = field.replace('shipping', 'billing')
      if (billingField !== 'billingEmail') { // Don't copy email to billing
        setFormData(prev => ({ ...prev, [billingField]: value }))
      }
    }
  }

  const handleSameAsBillingChange = (checked: boolean) => {
    setSameAsBilling(checked)
    if (checked) {
      setFormData(prev => ({
        ...prev,
        billingName: prev.shippingName,
        billingAddress: prev.shippingAddress,
        billingCity: prev.shippingCity,
        billingState: prev.shippingState,
        billingZip: prev.shippingZip,
        billingCountry: prev.shippingCountry
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!cartItems?.length) {
      toast.error("Your cart is empty")
      return
    }

    const requiredFields = [
      'shippingName', 'shippingEmail', 'shippingAddress', 
      'shippingCity', 'shippingState', 'shippingZip',
      'billingName', 'billingAddress', 'billingCity', 
      'billingState', 'billingZip'
    ]

    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData])
    
    if (missingFields.length > 0) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          total,
          items: cartItems?.map(item => ({
            productId: item?.product?.id,
            quantity: item?.quantity,
            price: item?.product?.price,
            size: item?.size,
            color: item?.color
          }))
        })
      })

      if (response?.ok) {
        const order = await response.json()
        toast.success("Order placed successfully!")
        router.push(`/orders/${order?.id}`)
      } else {
        toast.error("Failed to place order")
      }
    } catch (error) {
      console.error('Error placing order:', error)
      toast.error("Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 max-w-4xl py-16">
          <div className="text-center">Loading checkout...</div>
        </div>
      </div>
    )
  }

  if (!cartItems?.length) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 max-w-4xl py-16">
          <Card>
            <CardContent className="p-12 text-center space-y-6">
              <CreditCard className="h-16 w-16 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Your cart is empty</h3>
                <p className="text-muted-foreground">Add items to your cart before checking out</p>
              </div>
              <Button asChild>
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 max-w-6xl py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              <CreditCard className="mr-2 h-4 w-4" />
              Checkout
            </Badge>
            <h1 className="text-3xl font-bold">Complete Your Order</h1>
          </div>
          
          <Button variant="ghost" asChild>
            <Link href="/cart" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cart
            </Link>
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Shipping & Billing Forms */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Shipping Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="mr-2 h-5 w-5" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shippingName">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="shippingName"
                          value={formData.shippingName}
                          onChange={(e) => handleInputChange('shippingName', e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="shippingEmail">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="shippingEmail"
                          type="email"
                          value={formData.shippingEmail}
                          onChange={(e) => handleInputChange('shippingEmail', e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shippingAddress">Address *</Label>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="shippingAddress"
                        value={formData.shippingAddress}
                        onChange={(e) => handleInputChange('shippingAddress', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shippingCity">City *</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="shippingCity"
                          value={formData.shippingCity}
                          onChange={(e) => handleInputChange('shippingCity', e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="shippingState">State *</Label>
                      <Input
                        id="shippingState"
                        value={formData.shippingState}
                        onChange={(e) => handleInputChange('shippingState', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="shippingZip">ZIP Code *</Label>
                      <Input
                        id="shippingZip"
                        value={formData.shippingZip}
                        onChange={(e) => handleInputChange('shippingZip', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-5 w-5" />
                      Billing Information
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sameAsBilling"
                        checked={sameAsBilling}
                        onCheckedChange={handleSameAsBillingChange}
                      />
                      <Label htmlFor="sameAsBilling" className="text-sm">Same as shipping</Label>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <div className="space-y-2">
                    <Label htmlFor="billingName">Full Name *</Label>
                    <Input
                      id="billingName"
                      value={formData.billingName}
                      onChange={(e) => handleInputChange('billingName', e.target.value)}
                      disabled={sameAsBilling}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billingAddress">Address *</Label>
                    <Input
                      id="billingAddress"
                      value={formData.billingAddress}
                      onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                      disabled={sameAsBilling}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billingCity">City *</Label>
                      <Input
                        id="billingCity"
                        value={formData.billingCity}
                        onChange={(e) => handleInputChange('billingCity', e.target.value)}
                        disabled={sameAsBilling}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="billingState">State *</Label>
                      <Input
                        id="billingState"
                        value={formData.billingState}
                        onChange={(e) => handleInputChange('billingState', e.target.value)}
                        disabled={sameAsBilling}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="billingZip">ZIP Code *</Label>
                      <Input
                        id="billingZip"
                        value={formData.billingZip}
                        onChange={(e) => handleInputChange('billingZip', e.target.value)}
                        disabled={sameAsBilling}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Order Items */}
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {cartItems?.map((item) => (
                      <div key={item?.id} className="flex justify-between items-start">
                        <div className="flex-1 pr-2">
                          <p className="text-sm font-medium line-clamp-2">{item?.product?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Qty: {item?.quantity} × {formatPrice(item?.product?.price ?? 0)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          {formatPrice((item?.product?.price ?? 0) * (item?.quantity ?? 0))}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Order Totals */}
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping:</span>
                      <span className={shipping === 0 ? "text-green-600" : ""}>
                        {shipping === 0 ? "FREE" : formatPrice(shipping)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax:</span>
                      <span>{formatPrice(tax)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-primary">{formatPrice(total)}</span>
                    </div>
                  </div>

                  {/* Place Order Button */}
                  <Button 
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Placing Order..." : `Place Order - ${formatPrice(total)}`}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    Payment will be processed securely upon confirmation
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
