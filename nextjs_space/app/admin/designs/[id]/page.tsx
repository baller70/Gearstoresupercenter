
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react'
import { prisma } from '@/lib/db'
import { getImageProxyUrl } from '@/lib/s3'
import Image from 'next/image'

export default async function DesignEditPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }
  
  const design = await prisma.design.findUnique({
    where: { id: params.id },
    include: {
      products: {
        orderBy: {
          name: 'asc',
        },
      },
    },
  })
  
  if (!design) {
    redirect('/admin/designs')
  }
  
  // Get proxy URL for the design logo
  const logoProxyUrl = getImageProxyUrl(design.imageUrl)
  
  // Get proxy URLs for all product mockups
  const productsWithUrls = design.products.map((product) => {
    return {
      ...product,
      proxyUrl: getImageProxyUrl(product.imageUrl),
    }
  })
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" asChild>
            <Link href="/admin/designs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Designs
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{design.name}</h1>
            <p className="text-muted-foreground mt-1">
              Adjust logo positioning and regenerate mockups
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Logo Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Original Logo</CardTitle>
              <CardDescription>The uploaded design logo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
                {logoProxyUrl ? (
                  <Image
                    src={logoProxyUrl}
                    alt={design.name}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    No preview available
                  </div>
                )}
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Brand:</span>
                  <span className="font-medium">{design.brand}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Products:</span>
                  <span className="font-medium">{design.products.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium">{design.status}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Current Position Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Current Position Settings</CardTitle>
              <CardDescription>Logo placement on mockups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Horizontal Position (X)</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[design.positionX]}
                      min={0}
                      max={100}
                      step={1}
                      disabled
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">
                      {design.positionX}%
                    </span>
                  </div>
                </div>
                
                <div>
                  <Label>Vertical Position (Y)</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[design.positionY]}
                      min={0}
                      max={100}
                      step={1}
                      disabled
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">
                      {design.positionY}%
                    </span>
                  </div>
                </div>
                
                <div>
                  <Label>Scale</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[design.scale]}
                      min={0.5}
                      max={2}
                      step={0.1}
                      disabled
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12 text-right">
                      {design.scale.toFixed(1)}x
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Position Guide
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          • Center chest: X=50%, Y=35%<br />
                          • Left chest: X=25%, Y=30%<br />
                          • Back: X=50%, Y=40%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage this design</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/admin/designs/${design.id}/adjust`}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Adjust Logo Position
                </Link>
              </Button>
              
              <Button className="w-full" variant="outline" asChild>
                <Link href={`/admin/designs/${design.id}/regenerate`}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate All Mockups
                </Link>
              </Button>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  Use AI Vision to verify logo placement on mockups
                </p>
                <Button className="w-full" variant="secondary">
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI Vision Check
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Generated Products */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">Generated Products ({productsWithUrls.length})</h2>
          
          {productsWithUrls.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground mb-4">
                  No products generated yet for this design
                </p>
                <Button asChild>
                  <Link href={`/admin/designs/${design.id}/regenerate`}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate Products
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productsWithUrls.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <div className="aspect-square relative bg-muted">
                    {product.proxyUrl ? (
                      <Image
                        src={product.proxyUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                        Image not available
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-sm line-clamp-2">{product.name}</CardTitle>
                    <CardDescription className="text-lg font-bold">
                      ${product.price.toFixed(2)}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
