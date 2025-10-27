
"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { ArrowLeft, Save, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function AdjustDesignPage() {
  const router = useRouter()
  const params = useParams()
  const designId = params.id as string
  
  const [design, setDesign] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  
  const [positionX, setPositionX] = useState(50)
  const [positionY, setPositionY] = useState(35)
  const [scale, setScale] = useState(1.0)
  
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  
  useEffect(() => {
    fetchDesign()
  }, [designId])
  
  const fetchDesign = async () => {
    try {
      const response = await fetch(`/api/admin/designs?id=${designId}`)
      if (!response.ok) throw new Error('Failed to fetch design')
      
      const data = await response.json()
      setDesign(data)
      setPositionX(data.positionX)
      setPositionY(data.positionY)
      setScale(data.scale)
    } catch (error) {
      console.error('Error fetching design:', error)
      toast.error('Failed to load design')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    
    try {
      const response = await fetch('/api/admin/designs/update-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId,
          positionX,
          positionY,
          scale,
        }),
      })
      
      if (!response.ok) throw new Error('Failed to update position')
      
      toast.success('Position settings saved successfully!')
      router.push(`/admin/designs/${designId}`)
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save position settings')
    } finally {
      setSaving(false)
    }
  }
  
  const handleAIAnalysis = async () => {
    setAnalyzing(true)
    
    try {
      const response = await fetch('/api/admin/designs/analyze-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId,
          positionX,
          positionY,
          scale,
        }),
      })
      
      if (!response.ok) throw new Error('AI analysis failed')
      
      const data = await response.json()
      setAiAnalysis(data.analysis)
      toast.success('AI Vision analysis complete!')
    } catch (error) {
      console.error('AI analysis error:', error)
      toast.error('Failed to analyze with AI Vision')
    } finally {
      setAnalyzing(false)
    }
  }
  
  const handleReset = () => {
    setPositionX(50)
    setPositionY(35)
    setScale(1.0)
    setAiAnalysis(null)
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
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" asChild>
            <Link href={`/admin/designs/${designId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Adjust Logo Position</h1>
            <p className="text-muted-foreground mt-1">{design.name}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>
                See how the logo will appear with current settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="aspect-square relative bg-muted rounded-lg overflow-hidden border-2 border-border">
                  {/* Mockup preview would go here */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        Preview will show here
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Position: ({positionX}%, {positionY}%) | Scale: {scale.toFixed(1)}x
                      </p>
                    </div>
                  </div>
                  
                  {/* Position indicator */}
                  <div 
                    className="absolute w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg"
                    style={{
                      left: `${positionX}%`,
                      top: `${positionY}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                </div>
                
                <Button 
                  onClick={handleAIAnalysis}
                  disabled={analyzing}
                  className="w-full"
                  variant="secondary"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      AI Vision Check
                    </>
                  )}
                </Button>
                
                {aiAnalysis && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">AI Vision Analysis</h4>
                    <div className="space-y-1 text-sm text-green-700">
                      <p>✓ Logo is visible and clear</p>
                      <p>✓ Position: {aiAnalysis.position || 'Center chest area'}</p>
                      <p>✓ Size: {aiAnalysis.size || 'Appropriate'}</p>
                      {aiAnalysis.suggestion && (
                        <p className="mt-2 text-blue-700">
                          💡 {aiAnalysis.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Position Controls</CardTitle>
              <CardDescription>
                Adjust logo placement and size
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Horizontal Position (X)</Label>
                    <span className="text-sm font-medium">{positionX}%</span>
                  </div>
                  <Slider
                    value={[positionX]}
                    onValueChange={([value]) => setPositionX(value)}
                    min={0}
                    max={100}
                    step={1}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Left</span>
                    <span>Center</span>
                    <span>Right</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Vertical Position (Y)</Label>
                    <span className="text-sm font-medium">{positionY}%</span>
                  </div>
                  <Slider
                    value={[positionY]}
                    onValueChange={([value]) => setPositionY(value)}
                    min={0}
                    max={100}
                    step={1}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Top</span>
                    <span>Middle</span>
                    <span>Bottom</span>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Logo Scale</Label>
                    <span className="text-sm font-medium">{scale.toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={[scale]}
                    onValueChange={([value]) => setScale(value)}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Small</span>
                    <span>Normal</span>
                    <span>Large</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPositionX(50)
                        setPositionY(35)
                      }}
                    >
                      Center Chest
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPositionX(25)
                        setPositionY(30)
                      }}
                    >
                      Left Chest
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPositionX(50)
                        setPositionY(40)
                      }}
                    >
                      Back
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="w-full"
                  >
                    Reset to Defaults
                  </Button>
                </div>
                
                <div className="pt-4 border-t flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/admin/designs/${designId}`)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Position Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium mb-2">Center Chest (Recommended)</p>
                <p className="text-muted-foreground">X: 50%, Y: 35%, Scale: 1.0x</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Best for team logos and brand visibility
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium mb-2">Left Chest</p>
                <p className="text-muted-foreground">X: 25%, Y: 30%, Scale: 0.8x</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Professional look for polo-style shirts
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium mb-2">Full Back</p>
                <p className="text-muted-foreground">X: 50%, Y: 40%, Scale: 1.5x</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Maximum visibility and impact
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
