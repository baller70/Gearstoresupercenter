
"use client"

import { useState, useEffect } from 'react'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  AlertCircle, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  Search,
  Edit,
  Check,
  X
} from 'lucide-react'
import { toast } from 'sonner'

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingStock, setEditingStock] = useState<{ [key: string]: number }>({})
  
  useEffect(() => {
    fetchInventory()
  }, [])
  
  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/inventory')
      const data = await response.json()
      setInventory(data)
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }
  
  const handleUpdateStock = async (productId: string, newStock: number) => {
    try {
      const response = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, stock: newStock }),
      })
      
      if (!response.ok) throw new Error('Failed to update stock')
      
      toast.success('Stock updated successfully')
      setEditingStock((prev) => {
        const newState = { ...prev }
        delete newState[productId]
        return newState
      })
      fetchInventory()
    } catch (error) {
      console.error('Error updating stock:', error)
      toast.error('Failed to update stock')
    }
  }
  
  const filteredProducts = inventory?.products.filter((product: any) =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []
  
  if (loading || !inventory) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading inventory...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor stock levels and manage reorders
          </p>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.summary.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                In catalog
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{inventory.summary.outOfStock}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Needs immediate attention
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{inventory.summary.lowStock}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Less than 10 units
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Reorder</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{inventory.summary.needsReorder}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on sales velocity
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Product Inventory</CardTitle>
            <CardDescription>
              View stock levels, sales velocity, and reorder suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-6">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Design</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Sales (30d)</TableHead>
                    <TableHead className="text-right">Velocity</TableHead>
                    <TableHead className="text-right">Days Left</TableHead>
                    <TableHead className="text-right">Reorder Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                        {searchQuery ? 'No products found' : 'No products in inventory'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {product.designName}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingStock[product.id] !== undefined ? (
                            <div className="flex items-center justify-end gap-2">
                              <Input
                                type="number"
                                value={editingStock[product.id]}
                                onChange={(e) =>
                                  setEditingStock((prev) => ({
                                    ...prev,
                                    [product.id]: parseInt(e.target.value) || 0,
                                  }))
                                }
                                className="w-20 h-8"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpdateStock(product.id, editingStock[product.id])}
                              >
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setEditingStock((prev) => {
                                    const newState = { ...prev }
                                    delete newState[product.id]
                                    return newState
                                  })
                                }
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ) : (
                            <span className="font-medium">{product.stock}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{product.recentSales}</TableCell>
                        <TableCell className="text-right">
                          {product.salesVelocity.toFixed(2)}/day
                        </TableCell>
                        <TableCell className="text-right">
                          {product.daysUntilStockout !== null ? (
                            <span className={product.daysUntilStockout < 14 ? 'text-red-500 font-medium' : ''}>
                              {product.daysUntilStockout}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">∞</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.needsReorder ? (
                            <span className="text-blue-600 font-medium">
                              {product.suggestedReorderQuantity}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.status === 'OUT_OF_STOCK'
                                ? 'destructive'
                                : product.status === 'LOW_STOCK'
                                ? 'secondary'
                                : 'default'
                            }
                          >
                            {product.status === 'OUT_OF_STOCK'
                              ? 'Out of Stock'
                              : product.status === 'LOW_STOCK'
                              ? 'Low Stock'
                              : 'In Stock'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {editingStock[product.id] === undefined && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setEditingStock((prev) => ({
                                  ...prev,
                                  [product.id]: product.stock,
                                }))
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
