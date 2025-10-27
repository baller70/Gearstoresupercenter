
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { Upload, Loader2, CheckCircle2, Sparkles } from 'lucide-react'

export default function NewDesignPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('Rise as One AAU')
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [designId, setDesignId] = useState('')
  const [analysis, setAnalysis] = useState<any>(null)
  const [selectedCategories, setSelectedCategories] = useState({
    PERFORMANCE_APPAREL: true,
    CASUAL_WEAR: true,
    ACCESSORIES: true,
  })
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      
      // Auto-fill name from filename if empty
      if (!name) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, '')
        setName(fileName)
      }
    }
  }
  
  const handleUpload = async () => {
    if (!file || !name) {
      toast.error('Please provide a design name and select a file')
      return
    }
    
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', name)
      formData.append('brand', brand)
      
      const response = await fetch('/api/admin/designs/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      
      const data = await response.json()
      setDesignId(data.designId)
      toast.success('Design uploaded successfully')
      
      // Automatically start analysis
      handleAnalyze(data.designId)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload design')
    } finally {
      setUploading(false)
    }
  }
  
  const handleAnalyze = async (id?: string) => {
    const idToAnalyze = id || designId
    
    if (!idToAnalyze) {
      toast.error('No design to analyze')
      return
    }
    
    setAnalyzing(true)
    
    try {
      const response = await fetch('/api/admin/designs/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designId: idToAnalyze }),
      })
      
      if (!response.ok) {
        throw new Error('Analysis failed')
      }
      
      const data = await response.json()
      setAnalysis(data.analysis)
      toast.success('AI analysis complete')
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error('Failed to analyze design')
    } finally {
      setAnalyzing(false)
    }
  }
  
  const handleGenerateProducts = async () => {
    if (!designId) {
      toast.error('No design selected')
      return
    }
    
    const categories = Object.keys(selectedCategories).filter(
      (cat) => selectedCategories[cat as keyof typeof selectedCategories]
    )
    
    if (categories.length === 0) {
      toast.error('Please select at least one product category')
      return
    }
    
    setGenerating(true)
    
    try {
      const response = await fetch('/api/admin/designs/generate-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId,
          categories,
          autoApprove: true,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Product generation failed')
      }
      
      const data = await response.json()
      toast.success(`Successfully created ${data.productsCreated} products!`)
      
      // Redirect to designs page after a short delay
      setTimeout(() => {
        router.push('/admin/designs')
      }, 1500)
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate products')
    } finally {
      setGenerating(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Upload New Design</h1>
          <p className="text-muted-foreground mt-2">
            Upload a basketball design and let AI generate products automatically
          </p>
        </div>
        
        <div className="space-y-6">
          {/* Step 1: Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-3 text-sm">
                  1
                </div>
                Upload Design
              </CardTitle>
              <CardDescription>
                Upload your basketball logo or design (PNG, JPG, or SVG)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Design Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Rise as One Logo 2024"
                  disabled={uploading || analyzing || generating}
                />
              </div>
              
              <div>
                <Label>Brand</Label>
                <RadioGroup
                  value={brand}
                  onValueChange={setBrand}
                  disabled={uploading || analyzing || generating}
                  className="mt-2 space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Rise as One AAU" id="brand-rise" />
                    <Label htmlFor="brand-rise" className="font-normal cursor-pointer">
                      Rise as One AAU (4 colors: Black, White, Red, Grey)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="The Basketball Factory Inc" id="brand-factory" />
                    <Label htmlFor="brand-factory" className="font-normal cursor-pointer">
                      The Basketball Factory Inc (3 colors: White, Black, Navy, Gold)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label htmlFor="file">Design File</Label>
                <div className="mt-2">
                  <label
                    htmlFor="file"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center py-6">
                      <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {file ? file.name : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, or SVG (MAX. 10MB)
                      </p>
                    </div>
                    <input
                      id="file"
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      onChange={handleFileChange}
                      disabled={uploading || analyzing || generating}
                    />
                  </label>
                </div>
              </div>
              
              <Button
                onClick={handleUpload}
                disabled={!file || !name || uploading || analyzing || generating}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : designId ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Uploaded
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Design
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          
          {/* Step 2: AI Analysis */}
          {designId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-3 text-sm">
                    2
                  </div>
                  AI Analysis
                  {analysis && <CheckCircle2 className="ml-auto h-5 w-5 text-green-500" />}
                </CardTitle>
                <CardDescription>
                  AI analyzes your design to extract colors and basketball elements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyzing ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3">Analyzing design...</span>
                  </div>
                ) : analysis ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Extracted Colors</div>
                      <div className="flex gap-2">
                        {analysis.colors?.map((color: string, index: number) => (
                          <div
                            key={index}
                            className="w-12 h-12 rounded border-2 border-border"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {analysis.basketballElements && (
                      <div>
                        <div className="text-sm font-medium mb-2">Basketball Elements</div>
                        <div className="flex flex-wrap gap-2">
                          {analysis.basketballElements.map((element: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-muted rounded text-sm"
                            >
                              {element}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {analysis.designStyle && (
                      <div>
                        <div className="text-sm font-medium mb-2">Design Style</div>
                        <p className="text-sm text-muted-foreground">{analysis.designStyle}</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
          
          {/* Step 3: Generate Products */}
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-3 text-sm">
                    3
                  </div>
                  Generate Products
                </CardTitle>
                <CardDescription>
                  Select product categories to generate automatically
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
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
                </div>
                
                <Button
                  onClick={handleGenerateProducts}
                  disabled={generating}
                  className="w-full"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Products...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Products
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
