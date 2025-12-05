import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Plus,
  Image as ImageIcon,
  Package,
  Calendar,
  DollarSign,
  TrendingUp,
  Palette,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
  LayoutGrid,
  ExternalLink
} from 'lucide-react'
import { prisma } from '@/lib/db'
import { DesignActions } from '@/components/design-actions'
import Image from 'next/image'
import { getImageProxyUrl } from '@/lib/s3'

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

    // Get proxy URL for the design image (no expiration)
    const proxyUrl = getImageProxyUrl(design.imageUrl)

    return {
      ...design,
      totalRevenue,
      totalUnitsSold,
      proxyUrl,
    }
  }))

  // Calculate aggregate stats
  const totalDesigns = designsWithMetrics.length
  const pendingDesigns = designsWithMetrics.filter(d => d.status === 'PENDING').length
  const approvedDesigns = designsWithMetrics.filter(d => d.status === 'APPROVED').length
  const rejectedDesigns = designsWithMetrics.filter(d => d.status === 'REJECTED').length
  const totalRevenue = designsWithMetrics.reduce((sum, d) => sum + d.totalRevenue, 0)
  const totalUnitsSold = designsWithMetrics.reduce((sum, d) => sum + d.totalUnitsSold, 0)
  const totalProducts = designsWithMetrics.reduce((sum, d) => sum + d.products.length, 0)
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Design Management</h1>
            <p className="text-muted-foreground mt-1">
              Create, manage, and publish basketball apparel designs
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/design" target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                Preview Designer
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/designs/new">
                <Plus className="mr-2 h-4 w-4" />
                Upload Design
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <LayoutGrid className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalDesigns}</p>
                  <p className="text-xs text-muted-foreground">Total Designs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingDesigns}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{approvedDesigns}</p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalProducts}</p>
                  <p className="text-xs text-muted-foreground">Products</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <DollarSign className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${totalRevenue.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalUnitsSold}</p>
                  <p className="text-xs text-muted-foreground">Units Sold</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors group cursor-pointer">
            <Link href="/admin/designs/new">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Upload New Design</h3>
                  <p className="text-sm text-muted-foreground">Add a logo or artwork file</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Link>
          </Card>
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors group cursor-pointer">
            <Link href="/design" target="_blank">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Sparkles className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Merchandise Designer</h3>
                  <p className="text-sm text-muted-foreground">Create with 4-step wizard</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-500 transition-colors" />
              </CardContent>
            </Link>
          </Card>
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors group cursor-pointer">
            <Link href="/admin/products">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <Package className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Manage Products</h3>
                  <p className="text-sm text-muted-foreground">View generated products</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Designs Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">All Designs</h2>
            <p className="text-sm text-muted-foreground">
              {totalDesigns} design{totalDesigns !== 1 ? 's' : ''} in your library
            </p>
          </div>
        </div>

        {designsWithMetrics.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No designs uploaded yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Upload your first basketball design to start generating products automatically, or use the merchandise designer.
              </p>
              <div className="flex gap-3 justify-center">
                <Button asChild>
                  <Link href="/admin/designs/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Design
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/design">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Use Designer
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {designsWithMetrics.map((design) => (
              <Card key={design.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
                {/* Design Image with Status Overlay */}
                <div className="aspect-[4/3] relative bg-gradient-to-br from-muted to-muted/50">
                  {design.proxyUrl ? (
                    <Image
                      src={design.proxyUrl}
                      alt={design.name}
                      fill
                      className="object-contain p-6 group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                  {/* Status Badge Overlay */}
                  <div className="absolute top-3 right-3">
                    <Badge
                      className={`shadow-lg ${
                        design.status === 'APPROVED'
                          ? 'bg-green-500 hover:bg-green-600'
                          : design.status === 'REJECTED'
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-amber-500 hover:bg-amber-600'
                      }`}
                    >
                      {design.status === 'APPROVED' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {design.status === 'REJECTED' && <XCircle className="h-3 w-3 mr-1" />}
                      {design.status === 'PENDING' && <Clock className="h-3 w-3 mr-1" />}
                      {design.status}
                    </Badge>
                  </div>
                </div>

                {/* Design Info */}
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-1">{design.name}</CardTitle>
                  <CardDescription className="flex items-center gap-3 text-xs">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(design.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <Package className="h-3 w-3 mr-1" />
                      {design.products.length} products
                    </span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Colors */}
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <div className="flex gap-1 flex-1">
                      {design.colors.length > 0 ? (
                        design.colors.slice(0, 6).map((color, index) => (
                          <div
                            key={index}
                            className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No colors</span>
                      )}
                    </div>
                  </div>

                  {/* Quick Metrics */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-600">${design.totalRevenue.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">{design.totalUnitsSold}</p>
                      <p className="text-xs text-muted-foreground">Units Sold</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <DesignActions designId={design.id} currentStatus={design.status} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
