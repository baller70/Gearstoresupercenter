'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Shirt, 
  Upload, 
  Palette, 
  Type, 
  Move, 
  RotateCw, 
  ZoomIn, 
  ZoomOut,
  ShoppingCart,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Minus
} from 'lucide-react';
import { ProductTemplate, ProductColor, STANDARD_COLORS } from '@/lib/product-templates';

interface DesignLayer {
  id: string;
  type: 'logo' | 'text';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  textColor?: string;
}

export default function MerchandiseDesignerPage() {
  // State
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [selectedView, setSelectedView] = useState<string>('front');
  const [selectedColor, setSelectedColor] = useState<ProductColor>(STANDARD_COLORS[0]);
  const [customColor, setCustomColor] = useState<string>('');
  const [layers, setLayers] = useState<DesignLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'product' | 'design' | 'options' | 'review'>('product');
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load templates
  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch('/api/designer/templates');
        const data = await res.json();
        setTemplates(data.templates || []);
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, []);

  // Handle template selection
  const selectTemplate = useCallback((template: ProductTemplate) => {
    setSelectedTemplate(template);
    setSelectedView(template.views[0]?.id || 'front');
    setSelectedColor(template.availableColors[0] || STANDARD_COLORS[0]);
    setSelectedSizes([]);
    setLayers([]);
    setStep('design');
  }, []);

  // Handle logo upload
  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const logoUrl = event.target?.result as string;
      const newLayer: DesignLayer = {
        id: `logo-${Date.now()}`,
        type: 'logo',
        content: logoUrl,
        x: 50,
        y: 40,
        width: 25,
        height: 25,
        rotation: 0,
        opacity: 100,
        visible: true,
      };
      setLayers(prev => [...prev, newLayer]);
      setSelectedLayerId(newLayer.id);
    };
    reader.readAsDataURL(file);
  }, []);

  // Add text layer
  const addTextLayer = useCallback(() => {
    const newLayer: DesignLayer = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: 'Your Text',
      x: 50,
      y: 60,
      width: 30,
      height: 10,
      rotation: 0,
      opacity: 100,
      visible: true,
      fontFamily: 'Arial',
      fontSize: 24,
      fontWeight: 'bold',
      textColor: '#000000',
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  }, []);

  // Update layer
  const updateLayer = useCallback((layerId: string, updates: Partial<DesignLayer>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, ...updates } : layer
    ));
  }, []);

  // Delete layer
  const deleteLayer = useCallback((layerId: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
  }, [selectedLayerId]);

  // Toggle size selection
  const toggleSize = useCallback((sizeId: string) => {
    setSelectedSizes(prev => 
      prev.includes(sizeId) 
        ? prev.filter(s => s !== sizeId)
        : [...prev, sizeId]
    );
  }, []);

  // Get selected layer
  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  // Calculate price
  const calculatePrice = () => {
    if (!selectedTemplate) return 0;
    return selectedTemplate.basePrice * quantity;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Design Your Gear</h1>
            <div className="flex items-center gap-4">
              {/* Step indicators */}
              <div className="hidden md:flex items-center gap-2">
                {['product', 'design', 'options', 'review'].map((s, i) => (
                  <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step === s ? 'bg-orange-500 text-white' :
                      ['product', 'design', 'options', 'review'].indexOf(step) > i ? 'bg-green-500 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {['product', 'design', 'options', 'review'].indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    {i < 3 && <div className="w-8 h-0.5 bg-gray-200 mx-1" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Step 1: Product Selection */}
        {step === 'product' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Product</h2>
              <p className="text-gray-600">Select a product to customize with your design</p>
            </div>

            {/* Category tabs */}
            <Tabs defaultValue="tops" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
                <TabsTrigger value="tops">Tops</TabsTrigger>
                <TabsTrigger value="bottoms">Bottoms</TabsTrigger>
                <TabsTrigger value="accessories">Accessories</TabsTrigger>
              </TabsList>

              {['tops', 'bottoms', 'accessories'].map(category => (
                <TabsContent key={category} value={category} className="mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {templates.filter(t => t.category === category).map(template => (
                      <Card
                        key={template.id}
                        className="cursor-pointer hover:shadow-lg transition-shadow group"
                        onClick={() => selectTemplate(template)}
                      >
                        <CardContent className="p-4">
                          <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                            <Shirt className="w-24 h-24 text-gray-400" />
                          </div>
                          <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{template.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-orange-600">${template.basePrice.toFixed(2)}</span>
                            <Badge variant="secondary">{template.availableColors.length} colors</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        {/* Step 2: Design Editor */}
        {step === 'design' && selectedTemplate && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel - Tools */}
            <div className="lg:col-span-3 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="w-5 h-5" /> Add Design
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" /> Upload Logo
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={addTextLayer}
                  >
                    <Type className="w-4 h-4 mr-2" /> Add Text
                  </Button>
                </CardContent>
              </Card>

              {/* Color Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="w-5 h-5" /> Product Color
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {selectedTemplate.availableColors.map(color => (
                      <button
                        key={color.id}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          selectedColor.id === color.id ? 'border-orange-500 scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        onClick={() => {
                          setSelectedColor(color);
                          setCustomColor('');
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Custom:</Label>
                    <Input
                      type="color"
                      value={customColor || selectedColor.hex}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="w-12 h-8 p-0 border-0"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Layers Panel */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5" /> Layers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {layers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No layers yet. Add a logo or text.</p>
                  ) : (
                    <div className="space-y-2">
                      {layers.map(layer => (
                        <div
                          key={layer.id}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                            selectedLayerId === layer.id ? 'bg-orange-100 border border-orange-300' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => setSelectedLayerId(layer.id)}
                        >
                          <button onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}>
                            {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                          </button>
                          <span className="flex-1 text-sm truncate">
                            {layer.type === 'logo' ? 'Logo' : layer.content}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Center - Canvas */}
            <div className="lg:col-span-6">
              <Card className="h-full">
                <CardContent className="p-4">
                  {/* View selector */}
                  <div className="flex justify-center gap-2 mb-4">
                    {selectedTemplate.views.map(view => (
                      <Button
                        key={view.id}
                        variant={selectedView === view.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedView(view.id)}
                      >
                        {view.name}
                      </Button>
                    ))}
                  </div>

                  {/* Canvas */}
                  <div
                    ref={canvasRef}
                    className="relative bg-gray-100 rounded-lg overflow-hidden mx-auto"
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      aspectRatio: '4/5',
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: 'center center'
                    }}
                  >
                    {/* Product SVG */}
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ color: customColor || selectedColor.hex }}
                    >
                      <object
                        data={selectedTemplate.views.find(v => v.id === selectedView)?.templatePath}
                        type="image/svg+xml"
                        className="w-full h-full"
                        style={{ color: 'inherit' }}
                      />
                    </div>

                    {/* Design layers */}
                    {layers.filter(l => l.visible).map(layer => (
                      <div
                        key={layer.id}
                        className={`absolute cursor-move ${selectedLayerId === layer.id ? 'ring-2 ring-orange-500' : ''}`}
                        style={{
                          left: `${layer.x}%`,
                          top: `${layer.y}%`,
                          width: `${layer.width}%`,
                          transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                          opacity: layer.opacity / 100,
                        }}
                        onClick={() => setSelectedLayerId(layer.id)}
                      >
                        {layer.type === 'logo' ? (
                          <img src={layer.content} alt="Logo" className="w-full h-auto" />
                        ) : (
                          <div
                            style={{
                              fontFamily: layer.fontFamily,
                              fontSize: `${layer.fontSize}px`,
                              fontWeight: layer.fontWeight,
                              color: layer.textColor,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {layer.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Zoom controls */}
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <Button variant="outline" size="icon" onClick={() => setZoom(Math.max(50, zoom - 10))}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium w-16 text-center">{zoom}%</span>
                    <Button variant="outline" size="icon" onClick={() => setZoom(Math.min(150, zoom + 10))}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Layer Properties */}
            <div className="lg:col-span-3 space-y-4">
              {selectedLayer && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Move className="w-5 h-5" /> Layer Properties
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Position */}
                    <div className="space-y-2">
                      <Label className="text-sm">Position X: {selectedLayer.x}%</Label>
                      <Slider
                        value={[selectedLayer.x]}
                        onValueChange={([v]) => updateLayer(selectedLayer.id, { x: v })}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Position Y: {selectedLayer.y}%</Label>
                      <Slider
                        value={[selectedLayer.y]}
                        onValueChange={([v]) => updateLayer(selectedLayer.id, { y: v })}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Size: {selectedLayer.width}%</Label>
                      <Slider
                        value={[selectedLayer.width]}
                        onValueChange={([v]) => updateLayer(selectedLayer.id, { width: v })}
                        min={5}
                        max={80}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Rotation: {selectedLayer.rotation}°</Label>
                      <Slider
                        value={[selectedLayer.rotation]}
                        onValueChange={([v]) => updateLayer(selectedLayer.id, { rotation: v })}
                        min={-180}
                        max={180}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Opacity: {selectedLayer.opacity}%</Label>
                      <Slider
                        value={[selectedLayer.opacity]}
                        onValueChange={([v]) => updateLayer(selectedLayer.id, { opacity: v })}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>

                    {/* Text-specific properties */}
                    {selectedLayer.type === 'text' && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-sm">Text Content</Label>
                          <Input
                            value={selectedLayer.content}
                            onChange={(e) => updateLayer(selectedLayer.id, { content: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Font Size: {selectedLayer.fontSize}px</Label>
                          <Slider
                            value={[selectedLayer.fontSize || 24]}
                            onValueChange={([v]) => updateLayer(selectedLayer.id, { fontSize: v })}
                            min={12}
                            max={72}
                            step={1}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Text Color:</Label>
                          <Input
                            type="color"
                            value={selectedLayer.textColor || '#000000'}
                            onChange={(e) => updateLayer(selectedLayer.id, { textColor: e.target.value })}
                            className="w-12 h-8 p-0 border-0"
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Navigation */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('product')}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Button className="flex-1" onClick={() => setStep('options')}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Size & Quantity Options */}
        {step === 'options' && selectedTemplate && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Options</h2>
              <p className="text-gray-600">Choose sizes and quantity for your order</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Select Sizes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {selectedTemplate.availableSizes.map(size => (
                    <button
                      key={size.id}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        selectedSizes.includes(size.id)
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleSize(size.id)}
                    >
                      <div className="font-semibold">{size.name}</div>
                      {size.chest && <div className="text-xs text-gray-500">{size.chest}</div>}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quantity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-3xl font-bold w-20 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Price Summary */}
            <Card className="bg-gray-50">
              <CardContent className="p-6">
                <div className="flex justify-between items-center text-lg">
                  <span>Base Price:</span>
                  <span>${selectedTemplate.basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span>Quantity:</span>
                  <span>×{quantity}</span>
                </div>
                <div className="border-t mt-4 pt-4 flex justify-between items-center text-2xl font-bold">
                  <span>Total:</span>
                  <span className="text-orange-600">${calculatePrice().toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep('design')}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Design
              </Button>
              <Button
                className="flex-1"
                onClick={() => setStep('review')}
                disabled={selectedSizes.length === 0}
              >
                Review Order <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Add to Cart */}
        {step === 'review' && selectedTemplate && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Review Your Order</h2>
              <p className="text-gray-600">Confirm your design and add to cart</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Design Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="relative bg-gray-100 rounded-lg overflow-hidden mx-auto"
                    style={{
                      width: '100%',
                      maxWidth: '300px',
                      aspectRatio: '4/5',
                      color: customColor || selectedColor.hex
                    }}
                  >
                    <object
                      data={selectedTemplate.views[0]?.templatePath}
                      type="image/svg+xml"
                      className="w-full h-full"
                    />
                    {layers.filter(l => l.visible).map(layer => (
                      <div
                        key={layer.id}
                        className="absolute"
                        style={{
                          left: `${layer.x}%`,
                          top: `${layer.y}%`,
                          width: `${layer.width}%`,
                          transform: `translate(-50%, -50%) rotate(${layer.rotation}deg)`,
                          opacity: layer.opacity / 100,
                        }}
                      >
                        {layer.type === 'logo' ? (
                          <img src={layer.content} alt="Logo" className="w-full h-auto" />
                        ) : (
                          <div style={{
                            fontFamily: layer.fontFamily,
                            fontSize: `${layer.fontSize}px`,
                            fontWeight: layer.fontWeight,
                            color: layer.textColor,
                          }}>
                            {layer.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Product:</span>
                    <span className="font-medium">{selectedTemplate.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Color:</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full border"
                        style={{ backgroundColor: customColor || selectedColor.hex }}
                      />
                      <span>{customColor ? 'Custom' : selectedColor.name}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sizes:</span>
                    <span className="font-medium">{selectedSizes.join(', ').toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{quantity}</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-orange-600">${calculatePrice().toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep('options')}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button className="flex-1 bg-orange-500 hover:bg-orange-600">
                <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
