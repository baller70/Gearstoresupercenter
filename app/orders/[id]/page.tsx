
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Circle, ArrowLeft, Package, Truck, Home } from 'lucide-react';
import Image from 'next/image';
import { formatPrice } from '@/lib/products';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    imageUrl: string;
  };
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  items: OrderItem[];
}

interface TimelineStep {
  status: string;
  label: string;
  description: string;
  date: string | null;
  completed: boolean;
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/track?orderId=${orderId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Order not found');
          router.push('/account');
          return;
        }
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      setOrder(data.order);
      setTimeline(data.timeline);
    } catch (error) {
      console.error('Fetch order error:', error);
      toast.error('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
            <div className="h-96 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <Button onClick={() => router.push('/account')}>
            View All Orders
          </Button>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return Package;
      case 'PROCESSING':
        return Package;
      case 'SHIPPED':
        return Truck;
      case 'DELIVERED':
        return Home;
      default:
        return Circle;
    }
  };

  const StatusIcon = getStatusIcon(order.status);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/account')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Track Order</h1>
              <p className="text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
            </div>
            <Badge
              variant={
                order.status === 'DELIVERED' ? 'default' :
                order.status === 'CANCELLED' ? 'destructive' :
                'secondary'
              }
              className="text-sm"
            >
              <StatusIcon className="mr-1 h-3 w-3" />
              {order.status}
            </Badge>
          </div>
        </div>

        {/* Order Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Delivery Status</CardTitle>
            <CardDescription>
              Track your order from placement to delivery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {timeline.map((step, index) => (
                <div key={step.status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        step.completed
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted bg-background text-muted-foreground'
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </div>
                    {index < timeline.length - 1 && (
                      <div
                        className={`h-full w-0.5 ${
                          step.completed ? 'bg-primary' : 'bg-muted'
                        }`}
                        style={{ minHeight: '40px' }}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{step.label}</h3>
                      {step.date && (
                        <span className="text-sm text-muted-foreground">
                          {new Date(step.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{item.product.name}</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {item.size && <p>Size: {item.size}</p>}
                    {item.color && <p>Color: {item.color}</p>}
                    <p>Quantity: {item.quantity}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Information */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <p className="font-semibold">{order.shippingName}</p>
              <p className="text-muted-foreground">{order.shippingAddress}</p>
              <p className="text-muted-foreground">
                {order.shippingCity}, {order.shippingState} {order.shippingZip}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
