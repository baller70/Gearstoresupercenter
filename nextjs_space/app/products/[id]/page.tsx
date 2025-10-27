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
                <h2 className="font-semibold text-lg">Available Colors:</h2>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color: string) => {
                    // Map color names to hex codes
                    const colorMap: Record<string, string> = {
                      'Black': '#000000',
                      'White': '#FFFFFF',
                      'Red': '#DC2626',
                      'Blue': '#2563EB',
                      'Navy': '#1E3A8A',
                      'Gold': '#C8B273',
                      'Yellow': '#EAB308',
                      'Green': '#16A34A',
                      'Purple': '#9333EA',
                      'Orange': '#EA580C',
                      'Gray': '#6B7280',
                      'Silver': '#9CA3AF',
                      'Royal Blue': '#1D4ED8',
                      'Maroon': '#991B1B'
                    }
                    const hexColor = colorMap[color] || '#C8B273'
                    const isLightColor = ['White', 'Yellow', 'Gold', 'Silver'].includes(color)
                    
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`group relative w-16 h-16 rounded-md transition-all border-2 ${
                          selectedColor === color
                            ? 'border-[#C8B273] border-4 scale-110'
                            : 'border-gray-300 hover:border-[#C8B273]'
                        }`}
                        style={{ backgroundColor: hexColor }}
                        title={color}
                      >
                        <span className={`absolute inset-0 flex items-center justify-center text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity ${
                          isLightColor ? 'text-black' : 'text-white'
                        }`}>
                          {color}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {/* Sizes */}
            {product?.sizes?.length ? (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg">Available Sizes:</h2>
                
                {/* Youth Sizes */}
                {product.sizes.some((s: string) => ['YXS', 'YS', 'YM', 'YL', 'YXL'].includes(s)) && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Youth Sizes</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes
                        .filter((size: string) => ['YXS', 'YS', 'YM', 'YL', 'YXL'].includes(size))
                        .map((size: string) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`px-6 py-3 rounded-md text-sm font-medium transition-all border-2 ${
                              selectedSize === size
                                ? 'bg-[#C8B273] text-white border-[#C8B273] shadow-md scale-105'
                                : 'bg-white text-foreground border-[#C8B273] hover:bg-[#C8B273] hover:text-white'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
                
                {/* Adult Sizes */}
                {product.sizes.some((s: string) => ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].includes(s)) && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Adult Sizes</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes
                        .filter((size: string) => ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].includes(size))
                        .map((size: string) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`px-6 py-3 rounded-md text-sm font-medium transition-all border-2 ${
                              selectedSize === size
                                ? 'bg-[#C8B273] text-white border-[#C8B273] shadow-md scale-105'
                                : 'bg-white text-foreground border-[#C8B273] hover:bg-[#C8B273] hover:text-white'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
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
