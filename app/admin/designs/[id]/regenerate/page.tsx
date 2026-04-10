
"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowLeft, RefreshCw, Loader2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function RegenerateDesignPage() {
  const router = useRouter()
  const params = useParams()
  const designId = params.id as string
  
  const [design, setDesign] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  
  const [selectedCategories, setSelectedCategories] = useState({
    PERFORMANCE_APPAREL: true,
    CASUAL_WEAR: true,
    ACCESSORIES: true,
  })
  
  const [deleteExisting, setDeleteExisting] = useState(false)
  
  useEffect(() => {
    fetchDesign()
  }, [designId])
  
  const fetchDesign = async () => {
    try {
      const response = await fetch(`/api/admin/designs?id=${designId}`)
      if (!response.ok) throw new Error('Failed to fetch design')
      
      const data = await response.json()
      setDesign(data)
    } catch (error) {
      console.error('Error fetching design:', error)
      toast.error('Failed to load design')
    } finally {
      setLoading(false)
    }
  }
  
  const handleRegenerate = async () => {
    setRegenerating(true)
    
    try {
      const categories = Object.keys(selectedCategories).filter(
        (cat) => selectedCategories[cat as keyof typeof selectedCategories]
      )
      
      if (categories.length === 0) {
        toast.error('Please select at least one product category')
        setRegenerating(false)
        return
      }
      
      const response = await fetch('/api/admin/designs/generate-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId,
          categories,
          deleteExisting,
        }),
      })
      
      if (!response.ok) throw new Error('Regeneration failed')
      
      const data = await response.json()
      toast.success(`Successfully generated ${data.productsCreated} products!`)
      
      setTimeout(() => {
        router.push(`/admin/designs/${designId}`)
      }, 1500)
    } catch (error) {
      console.error('Regeneration error:', error)
      toast.error('Failed to regenerate products')
    } finally {
      setRegenerating(false)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (!design) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">Design not found</p>
          <Button asChild>
            <Link href="/admin/designs">Back to Designs</Link>
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" asChild>
            <Link href={`/admin/designs/${designId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Regenerate Products</h1>
            <p className="text-muted-foreground mt-1">{design.name}</p>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
              <CardDescription>
                This design currently has {design.products?.length || 0} products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{design.products?.length || 0}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total Products</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{design.positionX}%, {design.positionY}%</p>
                  <p className="text-sm text-muted-foreground mt-1">Logo Position</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{design.scale}x</p>
                  <p className="text-sm text-muted-foreground mt-1">Logo Scale</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Categories Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Categories</CardTitle>
              <CardDescription>
                Choose which product categories to generate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="performance"
                  checked={selectedCategories.PERFORMANCE_APPAREL}
                  onCheckedChange={(checked) =>
                    setSelectedCategories((prev) => ({
                      ...prev,
                      PERFORMANCE_APPAREL: !!checked,
                    }))
                  }
                />
                <Label htmlFor="performance" className="cursor-pointer">
                  Performance Apparel (Jerseys, Shorts, Shooting Shirts)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="casual"
                  checked={selectedCategories.CASUAL_WEAR}
                  onCheckedChange={(checked) =>
                    setSelectedCategories((prev) => ({
                      ...prev,
                      CASUAL_WEAR: !!checked,
                    }))
                  }
                />
                <Label htmlFor="casual" className="cursor-pointer">
                  Casual Wear (Hoodies, T-Shirts, Joggers)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="accessories"
                  checked={selectedCategories.ACCESSORIES}
                  onCheckedChange={(checked) =>
                    setSelectedCategories((prev) => ({
                      ...prev,
                      ACCESSORIES: !!checked,
                    }))
                  }
                />
                <Label htmlFor="accessories" className="cursor-pointer">
                  Accessories (Caps, Bags, Headbands, Wristbands)
                </Label>
              </div>
            </CardContent>
          </Card>
          
          {/* Options */}
          {design.products?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Regeneration Options
                </CardTitle>
                <CardDescription>
                  Choose how to handle existing products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delete-existing"
                    checked={deleteExisting}
                    onCheckedChange={(checked) => setDeleteExisting(!!checked)}
                  />
                  <Label htmlFor="delete-existing" className="cursor-pointer">
                    Delete existing products before regenerating
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground mt-2 ml-6">
                  {deleteExisting 
                    ? 'All existing products will be removed and replaced with new ones.'
                    : 'New products will be added alongside existing ones (may cause duplicates).'}
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/admin/designs/${designId}`)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={regenerating}
                      className="flex-1"
                    >
                      {regenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Regenerate Products
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Regeneration</AlertDialogTitle>
                      <AlertDialogDescription>
                        {deleteExisting ? (
                          <>
                            This will delete all {design.products?.length || 0} existing products 
                            and create new ones with the current logo position settings.
                            <br /><br />
                            <strong>This action cannot be undone.</strong>
                          </>
                        ) : (
                          <>
                            This will create new products with the current logo position settings.
                            Existing products will remain unchanged.
                          </>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRegenerate}>
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
