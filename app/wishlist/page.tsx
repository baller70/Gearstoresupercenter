
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/navigation';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/products';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface WishlistItem {
  id: string;
  productId: string;
  notes: string | null;
  addedAt: string;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    inStock: boolean;
  };
}

export default function WishlistPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchWishlist();
    }
  }, [status]);

  const fetchWishlist = async () => {
    try {
      const response = await fetch('/api/wishlist');
      if (response.ok) {
        const data = await response.json();
        setWishlist(data);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const response = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setWishlist(wishlist.filter((item) => item.productId !== productId));
        toast.success('Removed from wishlist');
      }
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const addToCart = async (productId: string) => {
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (response.ok) {
        toast.success('Added to cart');
      }
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-6 h-6 fill-red-500 text-red-500" />
              My Wishlist ({wishlist.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wishlist.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
                <p className="text-muted-foreground mb-4">
                  Start adding items you love!
                </p>
                <Button asChild>
                  <Link href="/products">Browse Products</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {wishlist.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <Link href={`/products/${item.productId}`} className="flex-shrink-0">
                      <div className="relative w-24 h-24 bg-muted rounded">
                        <Image
                          src={item.product?.imageUrl || ''}
                          alt={item.product?.name || 'Product'}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    </Link>
                    <div className="flex-1">
                      <Link href={`/products/${item.productId}`}>
                        <h3 className="font-semibold hover:text-primary transition-colors">
                          {item.product?.name}
                        </h3>
                      </Link>
                      <p className="text-lg font-bold text-primary mt-1">
                        {formatPrice(item.product?.price || 0)}
                      </p>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Added {new Date(item.addedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => addToCart(item.productId)}
                        disabled={!item.product?.inStock}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFromWishlist(item.productId)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
