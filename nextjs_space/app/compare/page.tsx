
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft } from 'lucide-react';
import { AddToCartButton } from '@/components/add-to-cart-button';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  description: string;
  sizes: string[];
  colors: string[];
  inStock: boolean;
}

export default function ComparePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const productIds = searchParams.get('ids')?.split(',') || [];
    if (productIds.length < 2) {
      router.push('/products');
      return;
    }

    fetchProducts(productIds);
  }, [searchParams, router]);

  const fetchProducts = async (productIds: string[]) => {
    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds,
          sessionId: 'anonymous-' + Date.now(),
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      router.push('/products');
    } finally {
      setLoading(false);
    }
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
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <h1 className="text-3xl font-bold mb-8">Product Comparison</h1>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 min-w-[800px]">
          {/* Product Images */}
          <div className="col-span-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="relative aspect-square bg-muted">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Price */}
          <div className="col-span-full">
            <h3 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">
              Price
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <div key={product.id} className="text-2xl font-bold">
                  ${product.price.toFixed(2)}
                </div>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="col-span-full">
            <h3 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">
              Category
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <Badge key={product.id} variant="secondary">
                  {product.category.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="col-span-full">
            <h3 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">
              Available Sizes
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <div key={product.id} className="text-sm">
                  {product.sizes.join(', ')}
                </div>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="col-span-full">
            <h3 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">
              Available Colors
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <div key={product.id} className="text-sm">
                  {product.colors.join(', ')}
                </div>
              ))}
            </div>
          </div>

          {/* Stock Status */}
          <div className="col-span-full">
            <h3 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">
              Availability
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <Badge
                  key={product.id}
                  variant={product.inStock ? 'default' : 'destructive'}
                >
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </Badge>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="col-span-full">
            <h3 className="font-semibold mb-2 text-sm uppercase text-muted-foreground">
              Description
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <p key={product.id} className="text-sm text-muted-foreground">
                  {product.description}
                </p>
              ))}
            </div>
          </div>

          {/* Add to Cart Buttons */}
          <div className="col-span-full">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <AddToCartButton
                  key={product.id}
                  product={product as any}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
