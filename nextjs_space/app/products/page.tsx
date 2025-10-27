
import { Navigation } from "@/components/navigation"
import { ProductGrid } from "@/components/product-grid"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAllProducts, getProductsByCategory, getCategoryDisplayName } from "@/lib/products"
import { Category } from "@prisma/client"
import { Circle, Filter } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

interface ProductsPageProps {
  searchParams: {
    category?: string
    search?: string
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const category = searchParams?.category as Category
  const searchQuery = searchParams?.search

  let products = []
  let pageTitle = "All Products"
  
  if (category && ['PERFORMANCE_APPAREL', 'CASUAL_WEAR', 'ACCESSORIES'].includes(category)) {
    products = await getProductsByCategory(category)
    pageTitle = getCategoryDisplayName(category)
  } else {
    products = await getAllProducts()
  }

  // Simple search filter
  if (searchQuery) {
    products = products?.filter(product => 
      product?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase() ?? '') ||
      product?.description?.toLowerCase()?.includes(searchQuery?.toLowerCase() ?? '')
    ) ?? []
    pageTitle = `Search Results for "${searchQuery}"`
  }

  const categories = [
    { key: 'all', label: 'All Products', href: '/products' },
    { key: 'PERFORMANCE_APPAREL', label: 'Performance Apparel', href: '/products?category=PERFORMANCE_APPAREL' },
    { key: 'CASUAL_WEAR', label: 'Casual Wear', href: '/products?category=CASUAL_WEAR' },
    { key: 'ACCESSORIES', label: 'Accessories', href: '/products?category=ACCESSORIES' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 max-w-7xl py-8">
        <div className="space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              <Circle className="mr-2 h-4 w-4" />
              Basketball Gear
            </Badge>
            <h1 className="text-3xl lg:text-4xl font-bold">{pageTitle}</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {category ? 
                `Discover our premium ${getCategoryDisplayName(category)?.toLowerCase()} collection` :
                'Premium basketball apparel and gear for champions'
              }
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories?.map((cat) => (
              <Button
                key={cat?.key}
                variant={(!category && cat?.key === 'all') || category === cat?.key ? 'default' : 'outline'}
                asChild
                className="text-sm"
              >
                <Link href={cat?.href ?? '/products'}>
                  {cat?.label}
                </Link>
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          <Suspense fallback={
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          }>
            <ProductGrid products={products} />
          </Suspense>

          {/* Product Count */}
          {products?.length ? (
            <div className="text-center text-muted-foreground">
              Showing {products.length} product{products.length !== 1 ? 's' : ''}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
