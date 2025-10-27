
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { formatPrice } from "@/lib/products"
import { 
  CheckCircle, 
  Package, 
  Truck, 
  ArrowLeft, 
  User, 
  MapPin,
  Calendar,
  Receipt
} from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

interface OrderPageProps {
  params: {
    id: string
  }
}

export default async function OrderPage({ params }: OrderPageProps) {
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

  const order = await prisma.order.findFirst({
    where: { 
      id: params?.id,
      userId: user.id // Ensure user can only view their own orders
    },
    include: {
      orderItems: {
        include: { product: true }
      }
    }
  })

  if (!order) {
    notFound()
  }

  const statusConfig = {
    PENDING: { icon: Package, color: "bg-yellow-500", label: "Order Received" },
    PROCESSING: { icon: Package, color: "bg-blue-500", label: "Processing" },
    SHIPPED: { icon: Truck, color: "bg-purple-500", label: "Shipped" },
    DELIVERED: { icon: CheckCircle, color: "bg-green-500", label: "Delivered" },
    CANCELLED: { icon: Package, color: "bg-red-500", label: "Cancelled" }
  }

  const currentStatus = statusConfig[order?.status] || statusConfig.PENDING

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 max-w-4xl py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              <Receipt className="mr-2 h-4 w-4" />
              Order Details
            </Badge>
            <h1 className="text-3xl font-bold">Order #{order?.id?.slice(-8)}</h1>
          </div>
          
          <Button variant="ghost" asChild>
            <Link href="/account" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Account
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <currentStatus.icon className="mr-2 h-5 w-5" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${currentStatus.color}`}></div>
                  <span className="font-medium">{currentStatus.label}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Placed on {new Date(order?.createdAt ?? '').toLocaleDateString()}
                </p>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order?.orderItems?.map((item) => (
                    <div key={item?.id} className="flex justify-between items-center py-4 border-b last:border-b-0">
                      <div className="flex-1">
                        <Link 
                          href={`/products/${item?.product?.id}`}
                          className="font-semibold hover:text-primary transition-colors"
                        >
                          {item?.product?.name}
                        </Link>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-muted-foreground">
                            Qty: {item?.quantity}
                          </span>
                          {item?.size && (
                            <Badge variant="outline" className="text-xs">
                              Size: {item.size}
                            </Badge>
                          )}
                          {item?.color && (
                            <Badge variant="outline" className="text-xs">
                              Color: {item.color}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatPrice((item?.price ?? 0) * (item?.quantity ?? 1))}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatPrice(item?.price ?? 0)} each
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary & Addresses */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatPrice(order?.total ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping:</span>
                    <span className="text-green-600">FREE</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span className="text-primary">{formatPrice(order?.total ?? 0)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="mr-2 h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{order?.shippingName}</p>
                <p>{order?.shippingAddress}</p>
                <p>{order?.shippingCity}, {order?.shippingState} {order?.shippingZip}</p>
                <p>{order?.shippingCountry}</p>
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{order?.billingName}</p>
                <p>{order?.billingAddress}</p>
                <p>{order?.billingCity}, {order?.billingState} {order?.billingZip}</p>
                <p>{order?.billingCountry}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
