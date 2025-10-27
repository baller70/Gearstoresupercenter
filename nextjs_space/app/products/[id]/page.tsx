
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getProductById, formatPrice, getCategoryDisplayName } from "@/lib/products"
import { ShoppingCart, Star, ArrowLeft, Truck, Shield, RotateCcw } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { AddToCartButton } from "@/components/add-to-cart-button"

interface ProductPageProps {
  params: {
    id: string
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductById(params?.id)

  if (!product) {
    notFound()
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
          
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              <Image
                src={product?.imageUrl ?? ''}
                alt={product?.name ?? 'Product image'}
                fill
                className="object-cover"
                priority
              />
              {product?.featured && (
                <Badge className="absolute top-4 left-4 bg-primary">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              )}
              {!product?.inStock && (
                <Badge variant="secondary" className="absolute top-4 right-4">
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
                  {product.colors.map((color) => (
                    <Badge key={color} variant="outline" className="text-sm">
                      {color}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Sizes */}
            {product?.sizes?.length ? (
              <div className="space-y-3">
                <h3 className="font-semibold">Available Sizes:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <Badge key={size} variant="outline" className="text-sm">
                      {size}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Add to Cart */}
            <div className="space-y-4">
              <AddToCartButton product={product} />
              
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
      </div>
    </div>
  )
}
