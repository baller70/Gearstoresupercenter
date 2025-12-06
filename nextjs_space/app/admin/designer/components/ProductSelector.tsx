'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { MOCKUP_PRODUCTS, MockupProduct } from '@/lib/mockup-system';

interface ProductSelectorProps {
  /** Callback when a product is selected */
  onSelectProduct: (product: MockupProduct) => void;
}

/**
 * ProductSelector Component
 * 
 * Displays a grid of available products organized by category tabs.
 * Used as Step 1 in the designer workflow.
 */
export function ProductSelector({ onSelectProduct }: ProductSelectorProps) {
  const categories = ['tops', 'bottoms', 'accessories'] as const;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Select a Product</h2>
        <p className="text-gray-600">Choose the product you want to customize</p>
      </div>
      
      <Tabs defaultValue="tops" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
          <TabsTrigger value="tops">Tops</TabsTrigger>
          <TabsTrigger value="bottoms">Bottoms</TabsTrigger>
          <TabsTrigger value="accessories">Accessories</TabsTrigger>
        </TabsList>
        
        {categories.map(category => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {MOCKUP_PRODUCTS.filter(p => p.category === category).map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => onSelectProduct(product)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

interface ProductCardProps {
  product: MockupProduct;
  onClick: () => void;
}

/**
 * Individual product card for the selector grid
 */
function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <Card
      className="cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all group overflow-hidden border-2 border-transparent hover:border-primary/30"
      onClick={onClick}
    >
      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
        {product.thumbnailUrl ? (
          <img
            src={product.thumbnailUrl}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-contain p-4 transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-white px-4 py-2 rounded-full text-sm font-medium">
            Select Product
          </span>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">${product.basePrice}</span>
          <Badge variant="secondary">{product.views.length} views</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProductSelector;

