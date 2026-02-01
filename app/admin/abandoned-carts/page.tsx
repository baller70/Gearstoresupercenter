
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShoppingCart, Mail } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface AbandonedCart {
  id: string;
  email: string;
  cartValue: number;
  itemCount: number;
  recovered: boolean;
  emailSent: boolean;
  emailSentAt: string | null;
  recoveredAt: string | null;
  createdAt: string;
}

export default function AbandonedCartsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchAbandonedCarts();
  }, [session, router]);

  const fetchAbandonedCarts = async () => {
    try {
      const response = await fetch('/api/marketing/abandoned-carts');
      if (!response.ok) throw new Error('Failed to fetch abandoned carts');
      const data = await response.json();
      setCarts(data);
    } catch (error) {
      console.error('Error fetching abandoned carts:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalValue = carts.reduce((sum, cart) => sum + cart.cartValue, 0);
  const recoveredValue = carts
    .filter(cart => cart.recovered)
    .reduce((sum, cart) => sum + cart.cartValue, 0);
  const recoveryRate = carts.length > 0
    ? Math.round((carts.filter(c => c.recovered).length / carts.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Abandoned Cart Recovery</h1>
        <p className="text-muted-foreground">
          Track and recover abandoned shopping carts
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Abandoned
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{carts.length}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Potential revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recovered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${recoveredValue.toFixed(2)}</div>
            <Badge className="bg-green-500 mt-1">{recoveryRate}% rate</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Emails Sent
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {carts.filter(c => c.emailSent).length}
            </div>
            <p className="text-xs text-muted-foreground">Recovery attempts</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Abandoned Carts</CardTitle>
          <CardDescription>Recent abandoned shopping carts from the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          {carts.length === 0 ? (
            <Alert>
              <AlertDescription>No abandoned carts in the last 7 days</AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Cart Value</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Abandoned</TableHead>
                    <TableHead>Email Status</TableHead>
                    <TableHead>Recovery Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {carts.map((cart) => (
                    <TableRow key={cart.id}>
                      <TableCell className="font-medium">{cart.email}</TableCell>
                      <TableCell>${cart.cartValue.toFixed(2)}</TableCell>
                      <TableCell>{cart.itemCount}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(cart.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {cart.emailSent ? (
                          <Badge variant="secondary">
                            Sent {cart.emailSentAt && new Date(cart.emailSentAt).toLocaleDateString()}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not Sent</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {cart.recovered ? (
                          <Badge className="bg-green-500">
                            Recovered {cart.recoveredAt && new Date(cart.recoveredAt).toLocaleDateString()}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Not Recovered</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
