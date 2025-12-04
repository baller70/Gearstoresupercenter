
"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart, Plus, Minus } from "lucide-react"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// Minimal product interface for cart functionality
interface CartProduct {
  id: string
  name: string
  price: number
  inStock: boolean
}

interface AddToCartButtonProps {
  product: CartProduct | null
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession() || {}
  const router = useRouter()

  const handleAddToCart = async () => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product?.id,
          quantity
        })
      })
      
      if (response?.ok) {
        toast.success(`Added ${product?.name} to cart!`)
        router.refresh()
      } else {
        toast.error('Failed to add item to cart')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      
      {/* Quantity Selector */}
      <div className="flex items-center space-x-4">
        <span className="font-medium">Quantity:</span>
        <div className="flex items-center border rounded-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="h-10 w-10"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQuantity(quantity + 1)}
            className="h-10 w-10"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <Button 
        size="lg"
        className="w-full bg-white text-foreground border-2 border-primary hover:bg-primary hover:text-white transition-colors"
        onClick={handleAddToCart}
        disabled={!product?.inStock || isLoading}
      >
        <ShoppingCart className="w-5 h-5 mr-2" />
        {isLoading ? 'Adding...' : 
         !product?.inStock ? 'Out of Stock' : 
         `Add to Cart - ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((product?.price ?? 0) * quantity)}`}
      </Button>
      
      {!session && (
        <p className="text-sm text-muted-foreground text-center">
          <Button variant="link" className="p-0 h-auto" asChild>
            <a href="/auth/signin">Sign in</a>
          </Button>
          {' '}to add items to cart
        </p>
      )}
    </div>
  )
}
