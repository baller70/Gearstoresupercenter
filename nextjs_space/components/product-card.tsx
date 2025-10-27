
"use client"

import { Product } from "@prisma/client"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Star } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { formatPrice } from "@/lib/products"
import { useState } from "react"
import { motion } from "framer-motion"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product?.id,
          quantity: 1
        })
      })
      
      if (response?.ok) {
        // You could show a toast here
        window.location.reload()
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
    }
  }

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="card-hover border-2 border-muted/50 hover:border-primary/20 overflow-hidden group">
        <Link href={`/products/${product?.id}`}>
          <div className="relative aspect-square bg-muted">
            {!imageError ? (
              <Image
                src={product?.imageUrl ?? ''}
                alt={product?.name ?? 'Product image'}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <ShoppingCart className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
            
            {product?.featured && (
              <Badge className="absolute top-2 left-2 bg-primary">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            
            {!product?.inStock && (
              <Badge variant="secondary" className="absolute top-2 right-2">
                Out of Stock
              </Badge>
            )}
          </div>
          
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold line-clamp-2 hover-orange transition-colors">
                {product?.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {product?.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-primary">
                  {formatPrice(product?.price ?? 0)}
                </span>
                {product?.colors?.length ? (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-muted-foreground">
                      {product.colors.length} color{product.colors.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="p-4 pt-0">
            <Button 
              className="w-full bg-primary hover:bg-primary/90"
              onClick={handleAddToCart}
              disabled={!product?.inStock}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {product?.inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </CardFooter>
        </Link>
      </Card>
    </motion.div>
  )
}
