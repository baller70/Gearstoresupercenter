
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react"
import Image from "next/image"
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
    imageUrl: string
  }
}

export function CartItems() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchCartItems = async () => {
    try {
      const response = await fetch('/api/cart')
      if (response?.ok) {
        const data = await response.json()
        setCartItems(data ?? [])
        updateOrderSummary(data ?? [])
      }
    } catch (error) {
      console.error('Error fetching cart items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateOrderSummary = (items: CartItem[]) => {
    const subtotal = items?.reduce((sum, item) => sum + (item?.product?.price ?? 0) * (item?.quantity ?? 0), 0) ?? 0
    const tax = subtotal * 0.08 // 8% tax
    const total = subtotal + tax

    // Update DOM elements
    const subtotalEl = document.getElementById('subtotal')
    const taxEl = document.getElementById('tax')
    const totalEl = document.getElementById('total')

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal)
    if (taxEl) taxEl.textContent = formatPrice(tax)
    if (totalEl) totalEl.textContent = formatPrice(total)
  }

  const removeItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart?itemId=${itemId}`, {
        method: 'DELETE'
      })

      if (response?.ok) {
        toast.success('Item removed from cart')
        fetchCartItems()
      } else {
        toast.error('Failed to remove item')
      }
    } catch (error) {
      console.error('Error removing item:', error)
      toast.error('Something went wrong')
    }
  }

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    try {
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity: newQuantity })
      })

      if (response?.ok) {
        fetchCartItems()
      } else {
        toast.error('Failed to update quantity')
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast.error('Something went wrong')
    }
  }

  useEffect(() => {
    fetchCartItems()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <div className="w-24 h-24 bg-muted rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!cartItems?.length) {
    return (
      <Card>
        <CardContent className="p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Your cart is empty</h3>
            <p className="text-muted-foreground">
              Add some basketball gear to get started!
            </p>
          </div>
          <Button asChild>
            <Link href="/products">Start Shopping</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {cartItems?.map((item) => (
        <Card key={item?.id} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex space-x-4">
              
              {/* Product Image */}
              <div className="relative w-24 h-24 bg-muted rounded-lg overflow-hidden">
                <Image
                  src={item?.product?.imageUrl ?? ''}
                  alt={item?.product?.name ?? 'Product'}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Product Details */}
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <Link 
                      href={`/products/${item?.product?.id}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {item?.product?.name}
                    </Link>
                    <div className="flex items-center space-x-2 mt-1">
                      {item?.size && (
                        <Badge variant="outline" className="text-xs">
                          Size: {item.size}
                        </Badge>
                      )}
                      {item?.color && (
                        <Badge variant="outline" className="text-xs">
                          Color: {item.color}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item?.id ?? '')}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quantity and Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateQuantity(item?.id ?? '', (item?.quantity ?? 1) - 1)}
                      className="h-8 w-8"
                      disabled={(item?.quantity ?? 1) <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="px-3 py-1 text-sm min-w-[2rem] text-center">
                      {item?.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => updateQuantity(item?.id ?? '', (item?.quantity ?? 1) + 1)}
                      className="h-8 w-8"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatPrice((item?.product?.price ?? 0) * (item?.quantity ?? 1))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatPrice(item?.product?.price ?? 0)} each
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
