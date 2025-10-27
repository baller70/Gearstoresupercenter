
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, Image as ImageIcon, Package, Calendar, DollarSign, TrendingUp } from 'lucide-react'
import { prisma } from '@/lib/db'
import { DesignActions } from '@/components/design-actions'
import Image from 'next/image'
import { downloadFile } from '@/lib/s3'

export default async function DesignsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }
  
  const designs = await prisma.design.findMany({
    include: {
      products: {
        include: {
          orderItems: {
            include: {
              order: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
  
  // Calculate performance metrics for each design and get signed URLs
  const designsWithMetrics = await Promise.all(designs.map(async (design) => {
    let totalRevenue = 0
    let totalUnitsSold = 0
    
    design.products.forEach(product => {
      product.orderItems.forEach(item => {
        totalRevenue += item.price * item.quantity
        totalUnitsSold += item.quantity
      })
    })
    
    // Get signed URL for the design image
    let signedUrl = null
    try {
      signedUrl = await downloadFile(design.imageUrl)
    } catch (error) {
      console.error('Error getting signed URL for design:', error)
    }
    
    return {
      ...design,
      totalRevenue,
      totalUnitsSold,
      signedUrl,
    }
  }))
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Design Management</h1>
            <p className="text-muted-foreground mt-2">
              Upload and manage basketball designs for automated product generation
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/designs/new">
              <Plus className="mr-2 h-4 w-4" />
              Upload New Design
            </Link>
          </Button>
        </div>
        
        {designsWithMetrics.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No designs uploaded yet</h3>
              <p className="text-muted-foreground mb-6">
                Upload your first basketball design to start generating products automatically
              </p>
              <Button asChild>
                <Link href="/admin/designs/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Design
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designsWithMetrics.map((design) => (
              <Card key={design.id} className="overflow-hidden">
                <div className="aspect-square relative bg-muted">
                  {design.signedUrl ? (
                    <Image
                      src={design.signedUrl}
                      alt={design.name}
                      fill
                      className="object-contain p-4"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{design.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(design.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        design.status === 'APPROVED'
                          ? 'default'
                          : design.status === 'REJECTED'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {design.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Colors</div>
                      <div className="flex gap-2">
                        {design.colors.length > 0 ? (
                          design.colors.map((color, index) => (
                            <div
                              key={index}
                              className="w-8 h-8 rounded border-2 border-border"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No colors extracted</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2 flex items-center">
                        <Package className="h-4 w-4 mr-1" />
                        Products ({design.products.length})
                      </div>
                      {design.products.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {design.products.slice(0, 3).map((product) => (
                            <Badge key={product.id} variant="outline" className="text-xs">
                              {product.name}
                            </Badge>
                          ))}
                          {design.products.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{design.products.length - 3} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No products generated</span>
                      )}
                    </div>
                    
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1 flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Revenue
                        </div>
                        <div className="text-lg font-bold">
                          ${design.totalRevenue.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1 flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Units Sold
                        </div>
                        <div className="text-lg font-bold">
                          {design.totalUnitsSold}
                        </div>
                      </div>
                    </div>
                    
                    <DesignActions designId={design.id} currentStatus={design.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
