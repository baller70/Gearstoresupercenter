
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package, ArrowLeft } from 'lucide-react';

interface Return {
  id: string;
  orderId: string;
  reason: string;
  description: string;
  status: string;
  refundAmount?: number;
  requestedAt: string;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
  }>;
}

export default function ReturnsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchReturns();
  }, [session, router]);

  const fetchReturns = async () => {
    try {
      const response = await fetch('/api/returns');
      if (!response.ok) throw new Error('Failed to fetch returns');
      const data = await response.json();
      setReturns(data);
    } catch (err) {
      setError('Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      PENDING: 'bg-yellow-500',
      APPROVED: 'bg-blue-500',
      REJECTED: 'bg-red-500',
      RETURN_RECEIVED: 'bg-purple-500',
      REFUND_PROCESSED: 'bg-green-500',
      COMPLETED: 'bg-gray-500',
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-500'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => router.push('/account')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Account
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Returns & Refunds</h1>
        <p className="text-muted-foreground">
          Track your return requests and refund status
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {returns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Returns</h3>
            <p className="text-muted-foreground text-center">
              You haven&apos;t requested any returns yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {returns.map((returnRequest) => (
            <Card key={returnRequest.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Return Request #{returnRequest.id.slice(0, 8)}</CardTitle>
                    <CardDescription>
                      Order #{returnRequest.orderId.slice(0, 8)} • 
                      {new Date(returnRequest.requestedAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {getStatusBadge(returnRequest.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Reason</p>
                    <p className="text-sm text-muted-foreground">
                      {returnRequest.reason.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Description</p>
                    <p className="text-sm text-muted-foreground">
                      {returnRequest.description}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Items</p>
                    <p className="text-sm text-muted-foreground">
                      {returnRequest.items.length} item(s)
                    </p>
                  </div>
                  {returnRequest.refundAmount && (
                    <div>
                      <p className="text-sm font-medium mb-1">Refund Amount</p>
                      <p className="text-lg font-bold text-green-600">
                        ${returnRequest.refundAmount.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
