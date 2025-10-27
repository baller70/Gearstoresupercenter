
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { formatPrice } from "@/lib/products"
import { 
  User, 
  Package, 
  Receipt,
  ShoppingBag,
  Settings,
  LogOut,
  Sparkles,
  Truck
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import LoyaltyDisplay from "@/components/loyalty-display"

export default async function AccountPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email ?? '' }
  })

  if (!user) {
    redirect('/auth/signin')
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      orderItems: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  const customizations = await prisma.productCustomization.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  const orderStats = {
    total: orders?.length ?? 0,
    totalSpent: orders?.reduce((sum, order) => sum + (order?.total ?? 0), 0) ?? 0,
    pending: orders?.filter(order => order?.status === 'PENDING')?.length ?? 0,
    delivered: orders?.filter(order => order?.status === 'DELIVERED')?.length ?? 0
  }

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
      
      <div className="container mx-auto px-4 max-w-6xl py-8">
        
        {/* Header */}
        <div className="space-y-2 mb-8">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            <User className="mr-2 h-4 w-4" />
            My Account
          </Badge>
          <h1 className="text-3xl font-bold">
            Welcome back, {user?.firstName || session?.user?.email?.split('@')[0]}!
          </h1>
          <p className="text-muted-foreground">
            Manage your account and view your basketball gear orders
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Account Info & Stats */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="font-semibold">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="font-semibold">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                  <p className="font-semibold">
                    {new Date(user?.createdAt ?? '').toLocaleDateString()}
                  </p>
                </div>
                {user?.role === 'ADMIN' && (
                  <Badge className="w-fit">
                    <Settings className="mr-1 h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Order Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Receipt className="mr-2 h-5 w-5" />
                  Order Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{orderStats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{orderStats.delivered}</div>
                    <div className="text-sm text-muted-foreground">Delivered</div>
                  </div>
                </div>
                <div className="text-center pt-4 border-t">
                  <div className="text-lg font-bold">{formatPrice(orderStats.totalSpent)}</div>
                  <div className="text-sm text-muted-foreground">Total Spent</div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/products">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Continue Shopping
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/cart">
                    <Package className="mr-2 h-4 w-4" />
                    View Cart
                  </Link>
                </Button>
                {user?.role === 'ADMIN' && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/admin">
                      <Settings className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Receipt className="mr-2 h-5 w-5" />
                    Recent Orders
                  </CardTitle>
                  {orders?.length ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/orders">View All</Link>
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                {!orders?.length ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold">No orders yet</h3>
                      <p className="text-muted-foreground">Start shopping to see your orders here</p>
                    </div>
                    <Button asChild>
                      <Link href="/products">Start Shopping</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders?.map((order) => (
                      <Link key={order?.id} href={`/orders/${order?.id}`}>
                        <Card className="card-hover border-2 border-muted/50 hover:border-primary/20">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-3">
                                  <div className="font-semibold">
                                    Order #{order?.id?.slice(-8)}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${statusConfig[order?.status]?.color ?? 'bg-gray-500'}`}></div>
                                    <span className="text-sm text-muted-foreground">
                                      {statusConfig[order?.status]?.label ?? order?.status}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {order?.orderItems?.length} item{order?.orderItems?.length !== 1 ? 's' : ''} • {new Date(order?.createdAt ?? '').toLocaleDateString()}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {order?.orderItems?.slice(0, 2)?.map(item => item?.product?.name)?.join(', ')}
                                  {(order?.orderItems?.length ?? 0) > 2 && ` and ${(order?.orderItems?.length ?? 0) - 2} more`}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-primary">
                                  {formatPrice(order?.total ?? 0)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Phase 4 Features */}
        <div className="grid gap-6 lg:grid-cols-3 mt-6">
          {/* Loyalty Program */}
          <div className="lg:col-span-1">
            <LoyaltyDisplay />
          </div>

          {/* Custom Design Requests */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Custom Design Requests
                  </CardTitle>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/customize">New Request</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!customizations?.length ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold">No custom requests yet</h3>
                      <p className="text-muted-foreground">Create custom basketball apparel with AI assistance</p>
                    </div>
                    <Button asChild>
                      <Link href="/customize">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Create Custom Design
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customizations?.map((customization) => (
                      <Card key={customization?.id} className="border-2 border-muted/50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center space-x-3">
                                <div className="font-semibold">
                                  Request #{customization?.id?.slice(-8)}
                                </div>
                                <Badge variant={
                                  customization?.status === 'COMPLETED' ? 'default' :
                                  customization?.status === 'REJECTED' ? 'destructive' :
                                  'secondary'
                                }>
                                  {customization?.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground line-clamp-2">
                                {customization?.notes}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(customization?.createdAt ?? '').toLocaleDateString()}
                              </div>
                            </div>
                            {customization?.estimatedPrice && (
                              <div className="text-right ml-4">
                                <div className="font-bold text-primary">
                                  {formatPrice(customization?.estimatedPrice)}
                                </div>
                                <div className="text-xs text-muted-foreground">Est. Price</div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
