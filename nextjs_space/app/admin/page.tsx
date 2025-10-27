
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Sparkles
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
      include: { orderItems: true },
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
    outOfStockProducts: products?.filter(product => !product?.inStock)?.length ?? 0
  }

  const recentOrders = orders?.slice(0, 5) ?? []
  const lowStockProducts = products?.filter(product => !product?.inStock)?.slice(0, 5) ?? []

  const statusConfig = {
    PENDING: { color: "bg-yellow-500", label: "Pending" },
    PROCESSING: { color: "bg-blue-500", label: "Processing" },
    SHIPPED: { color: "bg-purple-500", label: "Shipped" },
    DELIVERED: { color: "bg-green-500", label: "Delivered" },
    CANCELLED: { color: "bg-red-500", label: "Cancelled" }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 max-w-7xl py-8">
        
        {/* Header */}
        <div className="space-y-2 mb-8">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            <Settings className="mr-2 h-4 w-4" />
            Admin Dashboard
          </Badge>
          <h1 className="text-3xl font-bold">Basketball Factory Admin</h1>
          <p className="text-muted-foreground">
            Manage products, orders, and users for your basketball e-commerce platform
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(stats.totalRevenue)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  <p className="text-xs text-muted-foreground">{stats.pendingOrders} pending</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                  <p className="text-xs text-muted-foreground">{stats.outOfStockProducts} out of stock</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-xs text-muted-foreground">
                    {users?.filter(u => u?.role === 'ADMIN')?.length ?? 0} admin{(users?.filter(u => u?.role === 'ADMIN')?.length ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/admin/analytics">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
                  Analytics Dashboard
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  View real-time sales, revenue trends, and performance metrics
                </p>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/customers">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Users className="mr-2 h-5 w-5 text-purple-600" />
                  Customer Insights
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Analyze customer behavior, order history, and lifetime value
                </p>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/inventory">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Package className="mr-2 h-5 w-5 text-orange-600" />
                  Inventory Management
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Monitor stock levels, reorder suggestions, and sales velocity
                </p>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* AI Design Management Section */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Sparkles className="mr-2 h-5 w-5 text-primary" />
                  AI Design System
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Upload designs and let AI automatically generate products across all categories
                </p>
              </div>
              <Button asChild>
                <Link href="/admin/designs/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Design
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-2xl font-bold">{stats.totalDesigns}</p>
                <p className="text-sm text-muted-foreground">Total Designs</p>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-green-600">{stats.approvedDesigns}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingDesigns}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
            <div className="mt-6">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/admin/designs">
                  <Palette className="mr-2 h-4 w-4" />
                  Manage All Designs
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Recent Orders
                </CardTitle>
                <Button variant="outline" size="sm">View All Orders</Button>
              </div>
            </CardHeader>
            <CardContent>
              {!recentOrders?.length ? (
                <p className="text-center text-muted-foreground py-8">No orders yet</p>
              ) : (
                <div className="space-y-4">
                  {recentOrders?.map((order) => (
                    <div key={order?.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium">#{order?.id?.slice(-8)}</span>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${statusConfig[order?.status]?.color ?? 'bg-gray-500'}`}></div>
                            <span className="text-sm text-muted-foreground">
                              {statusConfig[order?.status]?.label ?? order?.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order?.shippingName} • {new Date(order?.createdAt ?? '').toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatPrice(order?.total ?? 0)}</div>
                        <div className="text-sm text-muted-foreground">
                          {order?.orderItems?.length} item{order?.orderItems?.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Product Management
                </CardTitle>
                <Button size="sm" asChild>
                  <Link href="/admin/products/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Products</span>
                  <Badge variant="outline">{stats.totalProducts}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Out of Stock</span>
                  <Badge variant={stats.outOfStockProducts > 0 ? "destructive" : "outline"}>
                    {stats.outOfStockProducts}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Featured Products</span>
                  <Badge variant="outline">
                    {products?.filter(p => p?.featured)?.length ?? 0}
                  </Badge>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <h4 className="font-medium text-sm">Quick Actions</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <Link href="/admin/products">
                      <Eye className="mr-2 h-4 w-4" />
                      View All Products
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Sales Analytics
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Table Preview */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Products</CardTitle>
              <Button asChild>
                <Link href="/admin/products">Manage Products</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Product</th>
                    <th className="text-left py-2">Category</th>
                    <th className="text-left py-2">Price</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products?.slice(0, 8)?.map((product) => (
                    <tr key={product?.id} className="border-b">
                      <td className="py-3">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-10 h-10 bg-muted rounded overflow-hidden">
                            <Image
                              src={product?.imageUrl ?? ''}
                              alt={product?.name ?? ''}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1">{product?.name}</p>
                            <p className="text-xs text-muted-foreground">ID: {product?.id?.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="text-xs">
                          {product?.category?.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 font-medium">
                        {formatPrice(product?.price ?? 0)}
                      </td>
                      <td className="py-3">
                        <Badge variant={product?.inStock ? "default" : "secondary"}>
                          {product?.inStock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/products/${product?.id}`}>
                              <Eye className="h-3 w-3" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
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
