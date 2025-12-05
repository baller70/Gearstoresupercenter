
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { formatPrice } from "@/lib/products"
import {
  Settings,
  Package,
  Users,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Eye,
  Edit,
  Plus,
  Palette,
  Sparkles,
  BarChart3,
  Truck,
  AlertCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Boxes,
  Receipt,
  UserCog,
  ShoppingCart,
  Zap,
  LayoutDashboard,
  Store,
  Megaphone
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session || session?.user?.role !== 'ADMIN') {
    redirect('/')
  }

  // Get admin stats
  const [products, orders, users, designs] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.design.findMany({ orderBy: { createdAt: 'desc' } })
  ])

  const stats = {
    totalProducts: products?.length ?? 0,
    totalOrders: orders?.length ?? 0,
    totalUsers: users?.length ?? 0,
    totalDesigns: designs?.length ?? 0,
    approvedDesigns: designs?.filter(d => d?.status === 'APPROVED')?.length ?? 0,
    pendingDesigns: designs?.filter(d => d?.status === 'PENDING')?.length ?? 0,
    totalRevenue: orders?.reduce((sum, order) => sum + (order?.total ?? 0), 0) ?? 0,
    pendingOrders: orders?.filter(order => order?.status === 'PENDING')?.length ?? 0,
    outOfStockProducts: products?.filter(product => !product?.inStock)?.length ?? 0,
    featuredProducts: products?.filter(p => p?.featured)?.length ?? 0,
    adminUsers: users?.filter(u => u?.role === 'ADMIN')?.length ?? 0,
    processingOrders: orders?.filter(order => order?.status === 'PROCESSING')?.length ?? 0,
    shippedOrders: orders?.filter(order => order?.status === 'SHIPPED')?.length ?? 0,
  }

  const recentOrders = orders?.slice(0, 5) ?? []

  const statusConfig: Record<string, { color: string; label: string; icon: typeof Clock }> = {
    PENDING: { color: "bg-yellow-500", label: "Pending", icon: Clock },
    PENDING_PAYMENT: { color: "bg-amber-500", label: "Awaiting Payment", icon: Clock },
    PAID: { color: "bg-green-500", label: "Paid", icon: CheckCircle2 },
    PAYMENT_FAILED: { color: "bg-red-500", label: "Payment Failed", icon: XCircle },
    PROCESSING: { color: "bg-blue-500", label: "Processing", icon: Package },
    SHIPPED: { color: "bg-purple-500", label: "Shipped", icon: Truck },
    DELIVERED: { color: "bg-green-600", label: "Delivered", icon: CheckCircle2 },
    CANCELLED: { color: "bg-red-500", label: "Cancelled", icon: XCircle },
    REFUNDED: { color: "bg-gray-500", label: "Refunded", icon: Receipt },
    FULFILLMENT_ERROR: { color: "bg-orange-500", label: "Fulfillment Error", icon: AlertCircle },
    ON_HOLD: { color: "bg-yellow-600", label: "On Hold", icon: Clock }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-4 max-w-7xl py-8">

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <LayoutDashboard className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                  Basketball Factory & Rise as One AAU
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-3 py-1">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                Live
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <Link href="/">
                  <Store className="mr-2 h-4 w-4" />
                  View Store
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics - Top Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(stats.totalRevenue)}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Orders</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  {stats.pendingOrders > 0 && (
                    <p className="text-xs text-amber-600 font-medium">{stats.pendingOrders} pending</p>
                  )}
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Products</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                  {stats.outOfStockProducts > 0 && (
                    <p className="text-xs text-red-600 font-medium">{stats.outOfStockProducts} out of stock</p>
                  )}
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customers</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">{stats.adminUsers} admin{stats.adminUsers !== 1 ? 's' : ''}</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Bar */}
        <Card className="mb-8 bg-gradient-to-r from-primary/5 via-background to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span className="font-semibold">Quick Actions</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" asChild>
                  <Link href="/admin/designs/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Design
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/admin/products/new">
                    <Package className="mr-2 h-4 w-4" />
                    Add Product
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/admin/discounts">
                    <Megaphone className="mr-2 h-4 w-4" />
                    Create Discount
                  </Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/admin/analytics">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Analytics
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">

          {/* Left Column - Navigation Sections */}
          <div className="lg:col-span-2 space-y-6">

            {/* Design System Section */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 p-6 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/20 rounded-lg">
                      <Sparkles className="h-6 w-6 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">AI Design System</h3>
                      <p className="text-sm text-muted-foreground">Create and manage custom merchandise designs</p>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href="/admin/designs">
                      Manage Designs
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-3xl font-bold">{stats.totalDesigns}</p>
                    <p className="text-sm text-muted-foreground">Total Designs</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{stats.approvedDesigns}</p>
                    <p className="text-sm text-muted-foreground">Approved</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-3xl font-bold text-amber-600">{stats.pendingDesigns}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/designs/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload New Design
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Management Tools Grid */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Management Tools
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">

                <Link href="/admin/analytics" className="group">
                  <Card className="h-full hover:shadow-md transition-all hover:border-blue-300 dark:hover:border-blue-700">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Analytics</h4>
                          <p className="text-sm text-muted-foreground">Sales, revenue & trends</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/admin/business-intelligence" className="group">
                  <Card className="h-full hover:shadow-md transition-all hover:border-green-300 dark:hover:border-green-700">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:scale-110 transition-transform">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Business Intelligence</h4>
                          <p className="text-sm text-muted-foreground">AI forecasting & insights</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/admin/customers" className="group">
                  <Card className="h-full hover:shadow-md transition-all hover:border-purple-300 dark:hover:border-purple-700">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:scale-110 transition-transform">
                          <UserCog className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Customers</h4>
                          <p className="text-sm text-muted-foreground">Behavior & lifetime value</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/admin/inventory" className="group">
                  <Card className="h-full hover:shadow-md transition-all hover:border-orange-300 dark:hover:border-orange-700">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:scale-110 transition-transform">
                          <Boxes className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Inventory</h4>
                          <p className="text-sm text-muted-foreground">Stock & reorder alerts</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/admin/abandoned-carts" className="group">
                  <Card className="h-full hover:shadow-md transition-all hover:border-red-300 dark:hover:border-red-700">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:scale-110 transition-transform">
                          <ShoppingCart className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Abandoned Carts</h4>
                          <p className="text-sm text-muted-foreground">Recovery & follow-up</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/admin/discounts" className="group">
                  <Card className="h-full hover:shadow-md transition-all hover:border-pink-300 dark:hover:border-pink-700">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg group-hover:scale-110 transition-transform">
                          <Megaphone className="h-5 w-5 text-pink-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Discounts</h4>
                          <p className="text-sm text-muted-foreground">Coupons & promotions</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>

            {/* POD Integrations */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Print-on-Demand Integrations
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <Link href="/admin/jetprint">
                  <Card className="hover:shadow-md transition-all border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 dark:from-blue-950/30 to-background">
                    <CardContent className="p-5 text-center">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl w-fit mx-auto mb-3">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                      <h4 className="font-semibold">Jetprint</h4>
                      <p className="text-xs text-muted-foreground mt-1">POD Fulfillment</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/admin/interestprint">
                  <Card className="hover:shadow-md transition-all border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 dark:from-purple-950/30 to-background">
                    <CardContent className="p-5 text-center">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl w-fit mx-auto mb-3">
                        <Package className="h-6 w-6 text-purple-600" />
                      </div>
                      <h4 className="font-semibold">InterestPrint</h4>
                      <p className="text-xs text-muted-foreground mt-1">POD Fulfillment</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/admin/woocommerce">
                  <Card className="hover:shadow-md transition-all border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background">
                    <CardContent className="p-5 text-center">
                      <div className="p-3 bg-primary/10 rounded-xl w-fit mx-auto mb-3">
                        <Settings className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="font-semibold">WooCommerce</h4>
                      <p className="text-xs text-muted-foreground mt-1">API Integration</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Orders & Activity */}
          <div className="space-y-6">

            {/* Order Status Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShoppingBag className="h-5 w-5" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium">Pending</span>
                  </div>
                  <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/50 text-amber-700">
                    {stats.pendingOrders}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Processing</span>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/50 text-blue-700">
                    {stats.processingOrders}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Shipped</span>
                  </div>
                  <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/50 text-purple-700">
                    {stats.shippedOrders}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Receipt className="h-5 w-5" />
                    Recent Orders
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/orders">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!recentOrders?.length ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentOrders?.map((order) => {
                      const StatusIcon = statusConfig[order?.status]?.icon ?? Clock
                      return (
                        <div key={order?.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">#{order?.id?.slice(-6)}</span>
                              <div className={`w-2 h-2 rounded-full ${statusConfig[order?.status]?.color ?? 'bg-gray-500'}`}></div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order?.createdAt ?? '').toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm">{formatPrice(order?.total ?? 0)}</div>
                            <div className="text-xs text-muted-foreground">
                              {order?.items?.length} item{order?.items?.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-5 w-5" />
                    Products
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/products">Manage</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Products</span>
                  <Badge variant="secondary">{stats.totalProducts}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Featured</span>
                  <Badge variant="outline">{stats.featuredProducts}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Out of Stock</span>
                  <Badge variant={stats.outOfStockProducts > 0 ? "destructive" : "outline"}>
                    {stats.outOfStockProducts}
                  </Badge>
                </div>
                <div className="pt-3 border-t">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/admin/products/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Product
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Catalog
                </CardTitle>
                <CardDescription>Quick overview of your latest products</CardDescription>
              </div>
              <Button asChild>
                <Link href="/admin/products">
                  Manage All Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium">Product</th>
                    <th className="text-left py-3 px-4 font-medium">Category</th>
                    <th className="text-left py-3 px-4 font-medium">Price</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products?.slice(0, 6)?.map((product, index) => (
                    <tr key={product?.id} className={`border-b hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={product?.imageUrl ?? ''}
                              alt={product?.name ?? ''}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium line-clamp-1">{product?.name}</p>
                            <p className="text-xs text-muted-foreground">ID: {product?.id?.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {product?.category?.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">{formatPrice(product?.price ?? 0)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={product?.inStock ? "default" : "secondary"}
                          className={product?.inStock ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" : ""}
                        >
                          {product?.inStock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/products/${product?.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
