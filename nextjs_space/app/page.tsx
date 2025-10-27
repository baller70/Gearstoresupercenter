
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "@/components/navigation"
import { 
  ShoppingBag, 
  Zap, 
  Shield, 
  Trophy,
  Star,
  ArrowRight,
  Circle,
  Users,
  Target,
  Award
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getFeaturedProducts, getProductsByCategory } from "@/lib/products"
import { ProductGrid } from "@/components/product-grid"
import ProductRecommendations from "@/components/product-recommendations"
import LoyaltyDisplay from "@/components/loyalty-display"

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts()
  const performanceApparel = await getProductsByCategory('PERFORMANCE_APPAREL', 4)
  const casualWear = await getProductsByCategory('CASUAL_WEAR', 4)
  const accessories = await getProductsByCategory('ACCESSORIES', 4)

  const stats = [
    { icon: Trophy, label: "Championships Won", value: "150+", color: "text-yellow-500" },
    { icon: Users, label: "Active Players", value: "2,500+", color: "text-blue-500" },
    { icon: Target, label: "Training Programs", value: "25+", color: "text-green-500" },
    { icon: Award, label: "Years Experience", value: "15+", color: "text-purple-500" }
  ]

  const features = [
    {
      icon: Zap,
      title: "Performance First",
      description: "Professional-grade apparel designed for elite basketball performance"
    },
    {
      icon: Shield,
      title: "Durable Quality",
      description: "Built to withstand the intensity of competitive basketball"
    },
    {
      icon: Circle,
      title: "Team Ready",
      description: "Perfect for AAU teams, clubs, and individual players"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="hero-court-bg relative overflow-hidden py-20 lg:py-32">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center lg:text-left space-y-6">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Circle className="mr-2 h-4 w-4" />
                Official Gear Provider
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                Elevate Your
                <span className="block text-primary">Basketball Game</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl">
                Premium basketball apparel and gear for Rise as One AAU Club and The Basketball Factory. 
                Performance-driven designs for champions.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
                  <Link href="/products" className="flex items-center">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Shop Now
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/products?category=PERFORMANCE_APPAREL" className="flex items-center">
                    View Performance Gear
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="flex-1 relative">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/40 rounded-full animate-pulse"></div>
                <Circle className="w-full h-full text-primary/80 relative z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats?.map((stat, index) => (
              <div key={stat?.label ?? index} className="text-center space-y-2">
                <stat.icon className={`h-8 w-8 mx-auto ${stat?.color}`} />
                <div className="text-3xl font-bold counter">{stat?.value}</div>
                <div className="text-sm text-muted-foreground">{stat?.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Why Choose Our <span className="text-primary">Basketball Gear</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Trusted by champions, built for performance, designed for basketball excellence.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features?.map((feature, index) => (
              <Card key={feature?.title ?? index} className="card-hover border-2 border-muted/50 hover:border-primary/20">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature?.title}</h3>
                  <p className="text-muted-foreground">{feature?.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center space-y-6 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Featured <span className="text-primary">Products</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Our most popular basketball gear for serious players
            </p>
          </div>
          
          <ProductGrid products={featuredProducts} />
          
          <div className="text-center mt-12">
            <Button size="lg" variant="outline" asChild>
              <Link href="/products" className="flex items-center">
                View All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Category Previews */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-7xl space-y-20">
          
          {/* Performance Apparel */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold">Performance Apparel</h2>
                <p className="text-muted-foreground">Professional jerseys, shorts, and shooting shirts</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/products?category=PERFORMANCE_APPAREL">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <ProductGrid products={performanceApparel} />
          </div>

          {/* Casual Wear */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold">Casual Wear</h2>
                <p className="text-muted-foreground">Hoodies, t-shirts, and everyday basketball style</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/products?category=CASUAL_WEAR">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <ProductGrid products={casualWear} />
          </div>

          {/* Accessories */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold">Accessories</h2>
                <p className="text-muted-foreground">Caps, bags, wristbands, and essential gear</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/products?category=ACCESSORIES">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <ProductGrid products={accessories} />
          </div>

          {/* AI-Powered Recommendations */}
          <div className="mt-12">
            <ProductRecommendations />
          </div>

          {/* Loyalty Program */}
          <div className="mt-8 max-w-2xl mx-auto">
            <LoyaltyDisplay />
          </div>
          
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5 border-t border-primary/10">
        <div className="container mx-auto px-4 max-w-7xl text-center">
          <div className="space-y-6 max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Ready to <span className="text-primary">Dominate the Court</span>?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of basketball players who trust our gear for their success
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
                <Link href="/products">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Start Shopping
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth/signup">
                  Create Account
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center space-y-4">
            <div className="flex justify-center items-center space-x-2">
              <Circle className="h-6 w-6 text-primary" />
              <span className="font-bold">Basketball Factory & Rise as One AAU</span>
            </div>
            <p className="text-muted-foreground">
              Premium basketball apparel and gear for champions
            </p>
            <div className="flex justify-center items-center space-x-6 text-sm text-muted-foreground">
              <Link href="/" className="hover-orange">Home</Link>
              <Link href="/products" className="hover-orange">Products</Link>
              <Link href="/account" className="hover-orange">Account</Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2024 Basketball Factory & Rise as One AAU. Built for basketball excellence.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
