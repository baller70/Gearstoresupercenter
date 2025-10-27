'use client'

import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice, getCategoryDisplayName } from "@/lib/products"
import { ShoppingCart, Star, ArrowLeft, Truck, Shield, RotateCcw } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { AddToCartButton } from "@/components/add-to-cart-button"
import ProductViewTracker from "@/components/product-view-tracker"
import ProductRecommendations from "@/components/product-recommendations"
import { ProductReviews } from "@/components/product-reviews"
import { WishlistButton } from "@/components/wishlist-button"
import { ProductImageGallery } from "@/components/product-image-gallery"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface ProductPageProps {
  params: {
    id: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${params?.id}`)
        if (!res.ok) {
          router.push('/404')
          return
        }
        const data = await res.json()
        setProduct(data)
        
        // Set default selections
        if (data?.colors?.length > 0) {
          setSelectedColor(data.colors[0])
        }
        if (data?.sizes?.length > 0) {
          setSelectedSize(data.sizes[0])
        }
      } catch (error) {
        console.error('Error fetching product:', error)
        router.push('/404')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params?.id, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 max-w-7xl py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  const features = [
    {
      icon: Truck,
      title: "Fast Shipping",
      description: "Free shipping on orders over $50"
    },
    {
      icon: Shield,
      title: "Quality Guaranteed", 
      description: "Premium materials and construction"
    },
    {
      icon: RotateCcw,
      title: "Easy Returns",
      description: "30-day return policy"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <ProductViewTracker productId={product.id} />
      <Navigation />
      
      <div className="container mx-auto px-4 max-w-7xl py-8">
        
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/products" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* Product Image Gallery */}
          <div className="space-y-4">
            <div className="relative">
              <ProductImageGallery 
                images={product?.images?.length > 0 ? product.images : [product?.imageUrl ?? '']}
                productName={product?.name ?? 'Product'}
              />
              {product?.featured && (
                <Badge className="absolute top-4 left-4 bg-primary z-10 shadow-lg">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
              {!product?.inStock && (
                <Badge variant="secondary" className="absolute top-4 right-4 z-10 shadow-lg">
                  Out of Stock
                </Badge>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-8">
            
            {/* Product Info */}
            <div className="space-y-4">
              <Badge variant="outline">
                {getCategoryDisplayName(product?.category ?? 'ACCESSORIES')}
              </Badge>
              
              <h1 className="text-3xl lg:text-4xl font-bold">{product?.name}</h1>
              
              <p className="text-2xl font-bold text-primary">
                {formatPrice(product?.price ?? 0)}
              </p>
              
              <p className="text-muted-foreground text-lg leading-relaxed">
                {product?.description}
              </p>
            </div>

            {/* Colors */}
            {product?.colors?.length ? (
              <div className="space-y-3">
                <h3 className="font-semibold">Available Colors:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color: string) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all border-2 ${
                        selectedColor === color
                          ? 'bg-primary text-primary-foreground border-primary shadow-md'
                          : 'bg-background text-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Sizes */}
            {product?.sizes?.length ? (
              <div className="space-y-3">
                <h3 className="font-semibold">Available Sizes:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all border-2 ${
                        selectedSize === size
                          ? 'bg-primary text-primary-foreground border-primary shadow-md'
                          : 'bg-background text-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Add to Cart & Wishlist */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <AddToCartButton product={product} />
                </div>
                <WishlistButton productId={product.id} />
              </div>
              
              <p className="text-sm text-muted-foreground">
                {product?.inStock ? 
                  "✓ In stock and ready to ship" : 
                  "⚠️ Currently out of stock"
                }
              </p>
            </div>

            {/* Features */}
            <div className="grid gap-4 pt-8 border-t">
              {features?.map((feature, index) => (
                <div key={feature?.title ?? index} className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{feature?.title}</p>
                    <p className="text-sm text-muted-foreground">{feature?.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-16">
          <ProductReviews productId={product.id} />
        </div>

        {/* Recommendations */}
        <div className="mt-16">
          <ProductRecommendations title="You Might Also Like" />
        </div>
      </div>
    </div>
  )
}
