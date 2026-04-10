
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function WishlistButton({ productId }: { productId: string }) {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkWishlistStatus();
  }, [productId, session]);

  const checkWishlistStatus = async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch('/api/wishlist');
      if (response.ok) {
        const wishlist = await response.json();
        setIsInWishlist(wishlist.some((item: any) => item.productId === productId));
      }
    } catch (error) {
      console.error('Failed to check wishlist status:', error);
    }
  };

  const toggleWishlist = async () => {
    if (!session?.user) {
      toast.error('Please sign in to add to wishlist');
      router.push('/auth/signin');
      return;
    }

    setLoading(true);
    try {
      if (isInWishlist) {
        const response = await fetch(`/api/wishlist?productId=${productId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setIsInWishlist(false);
          toast.success('Removed from wishlist');
        }
      } else {
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });
        if (response.ok) {
          setIsInWishlist(true);
          toast.success('Added to wishlist');
        }
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleWishlist}
      disabled={loading}
      className={isInWishlist ? 'bg-red-50 border-red-200' : ''}
    >
      <Heart
        className={`w-5 h-5 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`}
      />
    </Button>
  );
}
