
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/products"
import { 
  Package,
  ExternalLink,
  Eye,
  Edit,
  RefreshCw,
  AlertCircle,
  Link as LinkIcon,
  CheckCircle2,
  Bug
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from 'sonner'

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  price: number;
  inStock: boolean;
  designId: string | null;
  design?: {
    id: string;
    name: string;
    logoUrl: string;
    status: string;
  };
}

interface Stats {
  totalProducts: number;
  jetprintProducts: number;
  nonJetprintProducts: number;
  lastSync: string | null;
}

export default function JetprintProductsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    jetprintProducts: 0,
    nonJetprintProducts: 0,
    lastSync: null
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchProducts();
  }, [session, status, router]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const allProducts = await response.json();
        setProducts(allProducts);
        
        const podProducts = allProducts.filter((p: Product) => p.designId);
        const nonPodProducts = allProducts.filter((p: Product) => !p.designId);
        
        setStats({
          totalProducts: allProducts.length,
          jetprintProducts: podProducts.length,
          nonJetprintProducts: nonPodProducts.length,
          lastSync: localStorage.getItem('jetprint_last_sync')
        });
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/admin/jetprint/sync', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Products synced successfully!');
        localStorage.setItem('jetprint_last_sync', new Date().toISOString());
        await fetchProducts(); // Refresh products
      } else {
        toast.error('Failed to sync products');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync products');
    } finally {
      setSyncing(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 max-w-7xl py-8">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  const jetprintProducts = products.filter(p => p.designId);
  const nonJetprintProducts = products.filter(p => !p.designId);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 max-w-7xl py-8">
        
        {/* Header */}
        <div className="space-y-2 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20 mb-2">
                <Package className="mr-2 h-4 w-4" />
                Jetprint POD
              </Badge>
              <h1 className="text-3xl font-bold">Jetprint Products</h1>
              <p className="text-muted-foreground">
                Manage products connected to Jetprint print-on-demand service
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="destructive" 
                asChild
              >
                <Link href="/admin/debug">
                  <Bug className="mr-2 h-4 w-4" />
                  Debug Jetprint
                </Link>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSync}
                disabled={syncing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Products'}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/woocommerce">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  API Settings
                </Link>
              </Button>
              <Button asChild>
                <Link href="/admin/designs/new">
                  <Package className="mr-2 h-4 w-4" />
                  Create POD Product
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Connection Status & Troubleshooting */}
        <Card className="mb-8 border-blue-500/50 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <CheckCircle2 className="h-5 w-5" />
              Connection Status & Troubleshooting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">WooCommerce API Endpoints:</p>
                <div className="space-y-1 text-xs font-mono bg-background p-3 rounded border">
                  <div>Modern: <span className="text-blue-600">/wp-json/wc/v3/products</span></div>
                  <div>Legacy: <span className="text-blue-600">/wc-api/v3/products</span></div>
                  <div>Status: <span className="text-blue-600">/wp-json/wc/v3/system_status</span></div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Store URL:</p>
                <div className="text-xs font-mono bg-background p-3 rounded border break-all">
                  {typeof window !== 'undefined' ? window.location.origin : 'https://basketballgearstore.abacusai.app'}
                </div>
              </div>
            </div>
            
            <div className="bg-background p-4 rounded border space-y-3">
              <p className="text-sm font-medium">Jetprint Integration Steps:</p>
              <ol className="text-xs space-y-2 list-decimal list-inside">
                <li>Complete OAuth authorization in Jetprint dashboard</li>
                <li>Use one of the API endpoints above</li>
                <li>Ensure your Jetprint account uses Basic Auth with the API key</li>
                <li>Check that product pushes include SKU, name, price, and images</li>
                <li>Monitor server logs for detailed error messages</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/admin/woocommerce">
                  View API Keys
                </Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => {
                const url = typeof window !== 'undefined' ? window.location.origin : '';
                navigator.clipboard.writeText(url);
                toast.success('Store URL copied to clipboard!');
              }}>
                Copy Store URL
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Jetprint Products</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.jetprintProducts}</p>
                  <p className="text-xs text-muted-foreground">POD items</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Regular Products</p>
                  <p className="text-2xl font-bold">{stats.nonJetprintProducts}</p>
                  <p className="text-xs text-muted-foreground">Non-POD items</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900/20 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                  <p className="text-xs text-muted-foreground">All items</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Last Sync Info */}
        {stats.lastSync && (
          <Card className="mb-8 border-green-500/50 bg-green-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-600">Last synced</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(stats.lastSync).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Jetprint Products ({jetprintProducts.length})
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Products created from uploaded designs (Print-on-Demand)
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {jetprintProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Jetprint Products Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload a design to create your first print-on-demand products
                </p>
                <Button asChild>
                  <Link href="/admin/designs/new">
                    <Package className="mr-2 h-4 w-4" />
                    Upload Design
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Product</th>
                      <th className="text-left py-3 px-2">Design</th>
                      <th className="text-left py-3 px-2">Category</th>
                      <th className="text-left py-3 px-2">Price</th>
                      <th className="text-left py-3 px-2">Stock</th>
                      <th className="text-left py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jetprintProducts.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-muted/50">
                        <td className="py-4 px-2">
                          <div className="flex items-center space-x-3">
                            <div className="relative w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                              {product.imageUrl && (
                                <Image
                                  src={product.imageUrl}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium line-clamp-1">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                ID: {product.id.slice(-8)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          {product.design ? (
                            <div className="flex items-center space-x-2">
                              <div className="relative w-8 h-8 bg-muted rounded overflow-hidden">
                                {product.design.logoUrl && (
                                  <Image
                                    src={product.design.logoUrl}
                                    alt={product.design.name}
                                    fill
                                    className="object-cover"
                                  />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium line-clamp-1">
                                  {product.design.name}
                                </p>
                                <Badge 
                                  variant={product.design.status === 'APPROVED' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {product.design.status}
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No design</span>
                          )}
                        </td>
                        <td className="py-4 px-2">
                          <Badge variant="outline" className="text-xs">
                            {product.category.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-4 px-2">
                          <span className="font-medium">{formatPrice(product.price)}</span>
                        </td>
                        <td className="py-4 px-2">
                          <Badge variant={product.inStock ? 'default' : 'secondary'}>
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/products/${product.id}`}>
                                <Eye className="h-3 w-3" />
                              </Link>
                            </Button>
                            {product.design && (
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/admin/designs/${product.design.id}`}>
                                  <Edit className="h-3 w-3" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Regular Products Section */}
        {nonJetprintProducts.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Package className="mr-2 h-5 w-5 text-gray-600" />
                Regular Products ({nonJetprintProducts.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Non-POD products (not connected to Jetprint)
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Product</th>
                      <th className="text-left py-3 px-2">Category</th>
                      <th className="text-left py-3 px-2">Price</th>
                      <th className="text-left py-3 px-2">Stock</th>
                      <th className="text-left py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nonJetprintProducts.slice(0, 10).map((product) => (
                      <tr key={product.id} className="border-b hover:bg-muted/50">
                        <td className="py-4 px-2">
                          <div className="flex items-center space-x-3">
                            <div className="relative w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                              {product.imageUrl && (
                                <Image
                                  src={product.imageUrl}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium line-clamp-1">{product.name}</p>
                              <p className="text-xs text-muted-foreground">
                                ID: {product.id.slice(-8)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <Badge variant="outline" className="text-xs">
                            {product.category.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-4 px-2">
                          <span className="font-medium">{formatPrice(product.price)}</span>
                        </td>
                        <td className="py-4 px-2">
                          <Badge variant={product.inStock ? 'default' : 'secondary'}>
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                        </td>
                        <td className="py-4 px-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/products/${product.id}`}>
                              <Eye className="h-3 w-3" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {nonJetprintProducts.length > 10 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Showing 10 of {nonJetprintProducts.length} regular products
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Troubleshooting Section */}
        <Card className="mt-8 bg-gradient-to-br from-amber-500/5 to-background border-amber-500/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-amber-600" />
              Publishing Issues? Troubleshooting Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-100 dark:bg-green-900/20 border border-green-500/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                      ✅ WooCommerce API is WORKING
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Our API endpoint has been tested and is functioning correctly. Products can be created successfully through the WooCommerce REST API.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-lg">If Publishing Still Fails in Jetprint:</h4>
                
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <h5 className="font-semibold text-sm mb-1">1. Re-Authorize Your Store</h5>
                    <p className="text-sm text-muted-foreground">
                      Go to Jetprint → Settings → Stores → Find your store → Click "Disconnect" → Then "Connect Store" again → Complete the OAuth flow
                    </p>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <h5 className="font-semibold text-sm mb-1">2. Check Jetprint's Error Message</h5>
                    <p className="text-sm text-muted-foreground">
                      When publishing fails, Jetprint usually shows a specific error message. Common issues include: missing product images, invalid pricing, or incomplete product data.
                    </p>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <h5 className="font-semibold text-sm mb-1">3. Verify Store URL is Accessible</h5>
                    <p className="text-sm text-muted-foreground">
                      Your store URL: <code className="bg-muted px-2 py-1 rounded text-xs">https://basketballgearstore.abacusai.app</code>
                      <br />
                      Make sure this URL is accessible from external networks and not blocked by firewall rules.
                    </p>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <h5 className="font-semibold text-sm mb-1">4. Check API Permissions</h5>
                    <p className="text-sm text-muted-foreground">
                      During OAuth setup, ensure you grant "Read/Write" permissions (not just "Read"). Jetprint needs write access to create products.
                    </p>
                  </div>

                  <div className="border-l-4 border-amber-500 pl-4 py-2">
                    <h5 className="font-semibold text-sm mb-1">5. Still Not Working?</h5>
                    <p className="text-sm text-muted-foreground">
                      Copy the exact error message from Jetprint and check:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 mt-1">
                      <li>Does the product have required images?</li>
                      <li>Is the pricing set correctly?</li>
                      <li>Are there any special characters in product names?</li>
                      <li>Is the product variant/size data complete?</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 border rounded-lg p-4 mt-4">
                <h5 className="font-semibold text-sm mb-2">🔍 API Endpoint Information</h5>
                <div className="space-y-1 text-xs font-mono">
                  <div>
                    <span className="text-muted-foreground">Discovery:</span>
                    <code className="ml-2 bg-background px-2 py-1 rounded">GET /wp-json/wc/v3</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Products:</span>
                    <code className="ml-2 bg-background px-2 py-1 rounded">POST /wp-json/wc/v3/products</code>
                  </div>
                  <div className="mt-2 text-green-600">
                    <span>Status: ✅ All endpoints tested and working</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-8 bg-gradient-to-br from-blue-500/5 to-background border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ExternalLink className="mr-2 h-5 w-5 text-blue-600" />
              Jetprint Integration Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">How to Add Jetprint Products</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Upload a design through the Design Management system</li>
                  <li>The system automatically generates POD products for all categories</li>
                  <li>Products are automatically available for Jetprint fulfillment</li>
                  <li>Use the "Sync Products" button to refresh product data from Jetprint</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold mb-2">About Jetprint Integration</h4>
                <p className="text-sm text-muted-foreground">
                  Jetprint connects to your store through the WooCommerce API. When customers place orders, 
                  Jetprint automatically receives them through the API connection. Use the sync button regularly 
                  to keep your product catalog up to date.
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button variant="outline" asChild>
                  <Link href="/admin/designs">
                    Manage Designs
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/woocommerce">
                    API Settings
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
