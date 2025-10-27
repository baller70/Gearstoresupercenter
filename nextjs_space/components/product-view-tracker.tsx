'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ProductViewTrackerProps {
  productId: string;
}

export default function ProductViewTracker({ productId }: ProductViewTrackerProps) {
  const { data: session } = useSession() || {};

  useEffect(() => {
    if (session?.user) {
      // Track product view for recommendations
      fetch('/api/track-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      }).catch(error => {
        console.error('Failed to track view:', error);
      });
    }
  }, [productId, session]);

  return null; // This component doesn't render anything
}
