
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, Save, Loader2, Sparkles, Eye, Package, 
  Palette, CheckCircle, RotateCw, Move, ZoomIn, Trash2,
  Upload as UploadIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

interface ProductMockup {
  type: string;
  path: string;
  angle: 'front' | 'back' | 'side';
  analysis?: any;
}

interface ColorVariant {
  name: string;
  hex: string;
  enabled: boolean;
}

interface LogoPosition {
  productType: string;
  angle: 'front' | 'back' | 'side';
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export default function DesignEditorPage() {
  const router = useRouter();
  const params = useParams();
  const designId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [design, setDesign] = useState<any>(null);
  const [mockups, setMockups] = useState<ProductMockup[]>([]);
  
  // Current editing state
  const [selectedProduct, setSelectedProduct] = useState<string>('basketball-tshirt');
  const [selectedAngle, setSelectedAngle] = useState<'front' | 'back' | 'side'>('front');
  const [activeTab, setActiveTab] = useState<'position' | 'colors' | 'preview'>('position');
  
  // Logo positioning (keyed by productType-angle)
  const [logoPositions, setLogoPositions] = useState<Record<string, LogoPosition>>({});
  const [currentPosition, setCurrentPosition] = useState<LogoPosition>({
    productType: 'basketball-tshirt',
    angle: 'front',
    x: 50,
    y: 40,
    scale: 1.0,
    rotation: 0
  });
  
  // Logo visibility and transparency
  const [logoVisible, setLogoVisible] = useState(true);
  const [logoOpacity, setLogoOpacity] = useState(1.0);
  
  // Color variants - Default to Rise as One colors
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([
    { name: 'Red', hex: '#DC2626', enabled: true },
    { name: 'Gray', hex: '#6B7280', enabled: true },
    { name: 'White', hex: '#FFFFFF', enabled: true },
    { name: 'Black', hex: '#000000', enabled: true },
    { name: 'Navy', hex: '#001F3F', enabled: false },
    { name: 'Royal Blue', hex: '#0074D9', enabled: false },
  ]);
  
  // Canvas ref for drag and drop
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    fetchDesignData();
  }, [designId]);
  
  useEffect(() => {
    // Load saved position for current product and angle
    const positionKey = `${selectedProduct}-${selectedAngle}`;
    if (logoPositions[positionKey]) {
      setCurrentPosition(logoPositions[positionKey]);
    } else {
      // Set default positions based on angle
      let defaultY = 40;
      if (selectedAngle === 'back') {
        defaultY = 35; // Slightly higher for back view
      } else if (selectedAngle === 'side') {
        defaultY = 45; // Slightly lower for side view
      }
      
      setCurrentPosition({
        productType: selectedProduct,
        angle: selectedAngle,
        x: 50,
        y: defaultY,
        scale: 1.0,
        rotation: 0
      });
    }
  }, [selectedProduct, selectedAngle, logoPositions]);
  
  const fetchDesignData = async () => {
    try {
      const response = await fetch(`/api/admin/designs?id=${designId}`);
      if (!response.ok) throw new Error('Failed to fetch design');
      
      const data = await response.json();
      setDesign(data);
      
      // Fetch mockups
      const mockupsResponse = await fetch(`/api/admin/designs/${designId}/mockups`);
      if (mockupsResponse.ok) {
        const mockupsData = await mockupsResponse.json();
        setMockups(mockupsData.mockups || []);
      }
      
      // Load saved positions
      if (data.logoPositions) {
        setLogoPositions(data.logoPositions);
      }
      
    } catch (error) {
      console.error('Error fetching design:', error);
      toast.error('Failed to load design');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    
    setIsDragging(true);
    const rect = canvasRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };
  
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setCurrentPosition(prev => ({
      ...prev,
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    }));
  };
  
  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleSavePosition = () => {
    const positionKey = `${selectedProduct}-${selectedAngle}`;
    setLogoPositions(prev => ({
      ...prev,
      [positionKey]: currentPosition
    }));
    toast.success(`Position saved for ${selectedProduct.replace(/-/g, ' ')} (${selectedAngle} view)`);
  };
  
  const handleSaveAll = async () => {
    setSaving(true);
    
    try {
      // Save positions and learn from them
      const response = await fetch('/api/admin/designs/learn-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId,
          positions: logoPositions,
          colorVariants: colorVariants.filter(c => c.enabled),
        }),
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
      toast.success('All changes saved! AI has learned from your adjustments.');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };
  
  const handlePublish = async () => {
    setPublishing(true);
    
    try {
      const response = await fetch('/api/admin/designs/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId,
          positions: logoPositions,
          colorVariants: colorVariants.filter(c => c.enabled),
        }),
      });
      
      if (!response.ok) throw new Error('Failed to publish');
      
      const data = await response.json();
      toast.success(`Published ${data.productsCreated} products to store!`);
      
      // Redirect to designs list after a short delay
      setTimeout(() => {
        router.push('/admin/designs');
      }, 2000);
      
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish design');
    } finally {
      setPublishing(false);
    }
  };
  
  const handleRegenerateMockups = async () => {
    toast.info('Regenerating mockups with new positions...');
    
    try {
      const response = await fetch('/api/admin/designs/regenerate-mockups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId,
          positions: logoPositions,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to regenerate');
      
      const data = await response.json();
      setMockups(data.mockups || []);
      toast.success('Mockups regenerated successfully!');
      
    } catch (error) {
      console.error('Regenerate error:', error);
      toast.error('Failed to regenerate mockups');
    }
  };
  
  const productTypes = [
    { 
      id: 'basketball-tshirt', 
      name: 'T-Shirt', 
      icon: '👕', 
      mockups: {
        front: '/mockups/basketball_tshirt_mockup.png',
        back: '/mockups/basketball_tshirt_back_mockup.png',
        side: '/mockups/basketball_tshirt_side_mockup.png'
      }
    },
    { 
      id: 'basketball-jersey', 
      name: 'Jersey', 
      icon: '🎽', 
      mockups: {
        front: '/mockups/basketball_jersey_mockup.png',
        back: '/mockups/basketball_jersey_back_mockup.png',
        side: '/mockups/basketball_jersey_side_mockup.png'
      }
    },
    { 
      id: 'basketball-hoodie', 
      name: 'Hoodie', 
      icon: '🧥', 
      mockups: {
        front: '/mockups/basketball_hoodie_mockup.png',
        back: '/mockups/basketball_hoodie_back_mockup.png',
        side: '/mockups/basketball_hoodie_side_mockup.png'
      }
    },
    { 
      id: 'basketball-sweatshirt', 
      name: 'Sweatshirt', 
      icon: '👔', 
      mockups: {
        front: '/mockups/basketball_sweatshirt_mockup.png',
        back: '/mockups/basketball_sweatshirt_back_mockup.png',
        side: '/mockups/basketball_sweatshirt_side_mockup.png'
      }
    },
    { 
      id: 'basketball-shorts', 
      name: 'Shorts', 
      icon: '🩳', 
      mockups: {
        front: '/mockups/basketball_shorts_mockup.png',
        back: '/mockups/basketball_shorts_back_mockup.png',
        side: '/mockups/basketball_shorts_side_mockup.png'
      }
    },
  ];
  
  const getCurrentMockup = () => {
    const product = productTypes.find(p => p.id === selectedProduct);
    if (!product) return '';
    
    // Return the correct mockup based on the selected angle
    return product.mockups[selectedAngle] || product.mockups.front;
  };
  
  const hasPositionSaved = (productId: string) => {
    // Check if any angle has a saved position for this product
    return ['front', 'back', 'side'].some(angle => logoPositions[`${productId}-${angle}`]);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/admin/designs">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-yellow-500" />
                Design Editor
              </h1>
              <p className="text-muted-foreground mt-1">{design.name}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={handleSaveAll} disabled={saving} variant="outline">
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" />Save All</>
              )}
            </Button>
            <Button onClick={handlePublish} disabled={publishing} className="bg-green-600 hover:bg-green-700">
              {publishing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Publishing...</>
              ) : (
                <><CheckCircle className="mr-2 h-4 w-4" />Publish to Store</>
              )}
            </Button>
          </div>
        </div>
        
        <Alert className="mb-6">
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <strong>AI Learning Mode:</strong> When you manually adjust logo positions, the AI learns your preferences 
            and will automatically apply similar positioning to future uploads of the same product type.
          </AlertDescription>
        </Alert>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="position" className="flex items-center gap-2">
              <Move className="h-4 w-4" />
              Position Editor
            </TabsTrigger>
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Color Variants
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview & Publish
            </TabsTrigger>
          </TabsList>
          
          {/* Position Editor Tab */}
          <TabsContent value="position" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Canvas Preview */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Canvas Editor</span>
                    <div className="flex gap-2">
                      <Badge variant="outline">{selectedProduct.replace(/-/g, ' ')}</Badge>
                      <Badge variant="outline">{selectedAngle}</Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Click and drag to position the logo. Changes are saved per product type.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Angle selector */}
                    <div className="flex gap-2">
                      <Button
                        variant={selectedAngle === 'front' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedAngle('front')}
                        className="relative"
                      >
                        Front View
                        {logoPositions[`${selectedProduct}-front`] && (
                          <CheckCircle className="ml-1 h-3 w-3 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant={selectedAngle === 'back' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedAngle('back')}
                        className="relative"
                      >
                        Back View
                        {logoPositions[`${selectedProduct}-back`] && (
                          <CheckCircle className="ml-1 h-3 w-3 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant={selectedAngle === 'side' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedAngle('side')}
                        className="relative"
                      >
                        Side View
                        {logoPositions[`${selectedProduct}-side`] && (
                          <CheckCircle className="ml-1 h-3 w-3 text-green-500" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Canvas */}
                    <div 
                      ref={canvasRef}
                      className="relative aspect-square bg-white rounded-lg border-2 border-dashed border-gray-300 cursor-crosshair overflow-hidden"
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={handleCanvasMouseUp}
                    >
                      {/* Product mockup background */}
                      {getCurrentMockup() ? (
                        <div className="absolute inset-0 flex items-center justify-center p-8">
                          <div className="relative w-full h-full">
                            <Image
                              src={getCurrentMockup()}
                              alt={`${selectedProduct} mockup`}
                              fill
                              className="object-contain"
                              priority
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center opacity-30">
                          <Package className="h-48 w-48 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Logo position indicator */}
                      {logoVisible && (
                        <div 
                          className="absolute w-24 h-24 border-2 border-primary rounded-lg flex items-center justify-center shadow-lg transition-all duration-100 pointer-events-none"
                          style={{
                            left: `${currentPosition.x}%`,
                            top: `${currentPosition.y}%`,
                            transform: `translate(-50%, -50%) scale(${currentPosition.scale}) rotate(${currentPosition.rotation}deg)`,
                            backgroundColor: 'transparent',
                            opacity: logoOpacity,
                          }}
                        >
                          {design.imageUrl && (
                            <div className="relative w-full h-full flex items-center justify-center">
                              <Image
                                src={`/api/images/${design.imageUrl.replace(/^\/+/, '')}`}
                                alt="Logo"
                                width={80}
                                height={80}
                                className="object-contain"
                                style={{
                                  mixBlendMode: 'multiply',
                                  filter: 'contrast(1.1)',
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Position coordinates and view info */}
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-10">
                        X: {currentPosition.x.toFixed(0)}% Y: {currentPosition.y.toFixed(0)}%
                      </div>
                      <div className="absolute top-2 right-2 bg-primary/90 text-white text-xs px-2 py-1 rounded z-10 font-medium">
                        {selectedAngle.toUpperCase()} VIEW
                      </div>
                      {selectedAngle !== 'front' && (
                        <div className="absolute bottom-2 left-2 right-2 bg-blue-500/90 text-white text-xs px-2 py-1 rounded z-10 text-center">
                          Note: Currently using front mockup template for reference
                        </div>
                      )}
                    </div>
                    
                    <Button onClick={handleSavePosition} className="w-full">
                      <Save className="mr-2 h-4 w-4" />
                      Save Position for {selectedProduct.replace(/-/g, ' ')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Controls */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Type</CardTitle>
                    <CardDescription>Select a product to edit</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-2">
                      {productTypes.map((product) => (
                        <Button
                          key={product.id}
                          variant={selectedProduct === product.id ? 'default' : 'outline'}
                          onClick={() => setSelectedProduct(product.id)}
                          className="justify-start"
                        >
                          <span className="mr-2">{product.icon}</span>
                          {product.name}
                          {hasPositionSaved(product.id) && (
                            <CheckCircle className="ml-auto h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Fine Tuning</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Scale: {currentPosition.scale.toFixed(1)}x</Label>
                      <Slider
                        value={[currentPosition.scale]}
                        onValueChange={([value]) => setCurrentPosition(prev => ({ ...prev, scale: value }))}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label>Rotation: {currentPosition.rotation}°</Label>
                      <Slider
                        value={[currentPosition.rotation]}
                        onValueChange={([value]) => setCurrentPosition(prev => ({ ...prev, rotation: value }))}
                        min={-45}
                        max={45}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label>Transparency: {Math.round(logoOpacity * 100)}%</Label>
                      <Slider
                        value={[logoOpacity]}
                        onValueChange={([value]) => setLogoOpacity(value)}
                        min={0.1}
                        max={1.0}
                        step={0.05}
                        className="mt-2"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCurrentPosition(prev => ({
                            ...prev,
                            scale: 1.0,
                            rotation: 0,
                            x: 50,
                            y: 40
                          }));
                          setLogoOpacity(1.0);
                        }}
                        className="flex-1"
                      >
                        <RotateCw className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                      
                      <Button
                        variant="destructive"
                        onClick={() => setLogoVisible(!logoVisible)}
                        className="flex-1"
                      >
                        {logoVisible ? (
                          <>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hide Logo
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Show Logo
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Color Variants Tab */}
          <TabsContent value="colors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Color Variants</CardTitle>
                <CardDescription>
                  Select which garment colors you want. Each enabled color will generate actual colored mockups and create separate products in your store (e.g., Red T-Shirt, Gray T-Shirt, Black T-Shirt).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {colorVariants.map((color, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        color.enabled ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setColorVariants(prev => prev.map((c, i) => 
                          i === index ? { ...c, enabled: !c.enabled } : c
                        ));
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                          style={{ backgroundColor: color.hex }}
                        />
                        <div>
                          <p className="font-medium">{color.name}</p>
                          <p className="text-xs text-muted-foreground">{color.hex}</p>
                        </div>
                      </div>
                      {color.enabled && (
                        <CheckCircle className="h-5 w-5 text-primary mt-2" />
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Selected:</strong> {colorVariants.filter(c => c.enabled).length} colors × {productTypes.length} products = {' '}
                    <strong>{colorVariants.filter(c => c.enabled).length * productTypes.length} total variants</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Preview All Products</h2>
                <p className="text-muted-foreground">Review before publishing to store</p>
              </div>
              <Button onClick={handleRegenerateMockups} variant="outline">
                <RotateCw className="mr-2 h-4 w-4" />
                Regenerate Mockups
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productTypes.map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span>{product.icon}</span>
                      {product.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="aspect-square relative bg-white rounded-lg border overflow-hidden">
                      {product.mockups?.front ? (
                        <div className="relative w-full h-full p-4">
                          <Image
                            src={product.mockups.front}
                            alt={`${product.name} mockup`}
                            fill
                            className="object-contain"
                          />
                          {/* Logo overlay preview (front view) */}
                          {design.imageUrl && logoPositions[`${product.id}-front`] && (
                            <div 
                              className="absolute"
                              style={{
                                left: `${logoPositions[`${product.id}-front`].x}%`,
                                top: `${logoPositions[`${product.id}-front`].y}%`,
                                transform: `translate(-50%, -50%) scale(${logoPositions[`${product.id}-front`].scale}) rotate(${logoPositions[`${product.id}-front`].rotation}deg)`,
                              }}
                            >
                              <Image
                                src={`/api/images/${design.imageUrl.replace(/^\/+/, '')}`}
                                alt="Logo preview"
                                width={60}
                                height={60}
                                className="object-contain"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="h-24 w-24 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Front Position:</span>
                        <span className="font-medium">
                          {logoPositions[`${product.id}-front`] ? 
                            `${logoPositions[`${product.id}-front`].x.toFixed(0)}%, ${logoPositions[`${product.id}-front`].y.toFixed(0)}%` :
                            'Not set'
                          }
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Views configured:</span>
                        <span className="font-medium">
                          {['front', 'back', 'side'].filter(angle => logoPositions[`${product.id}-${angle}`]).length}/3
                        </span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-muted-foreground">Colors:</span>
                        <span className="font-medium">{colorVariants.filter(c => c.enabled).length} variants</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-900">Ready to Publish?</CardTitle>
                <CardDescription className="text-green-700">
                  This will create {colorVariants.filter(c => c.enabled).length * productTypes.length} products in your store
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-green-900 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Logo positions configured for all products
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {colorVariants.filter(c => c.enabled).length} color variants selected
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    AI will learn from your manual adjustments
                  </li>
                </ul>
                <Button 
                  onClick={handlePublish} 
                  disabled={publishing}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {publishing ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Publishing Products...</>
                  ) : (
                    <><CheckCircle className="mr-2 h-5 w-5" />Publish to Store</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
