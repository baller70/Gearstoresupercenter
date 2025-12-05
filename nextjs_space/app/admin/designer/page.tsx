'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Upload, Type, Palette, Layers, Trash2, Move, RotateCcw,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Eye, EyeOff,
  Download, Save, Package, Check, Loader2, ArrowLeft,
  Copy, FlipHorizontal, FlipVertical, Lock, Unlock, Maximize2
} from 'lucide-react';
import Link from 'next/link';
import { MOCKUP_PRODUCTS, PRO_COLORS, APPAREL_SIZES, MockupProduct, ProductColor } from '@/lib/mockup-system';

// Design element interface
interface DesignElement {
  id: string;
  type: 'image' | 'text';
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  // Image specific
  src?: string;
  originalWidth?: number;
  originalHeight?: number;
  // Text specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fill?: string;
  textAlign?: 'left' | 'center' | 'right';
}

// Designer state
interface DesignerState {
  product: MockupProduct | null;
  color: ProductColor;
  customColor: string;
  view: 'front' | 'back';
  elements: DesignElement[];
  selectedElementId: string | null;
  selectedSizes: string[];
  zoom: number;
  showGuides: boolean;
  designName: string;
}

export default function AdminDesignerPage() {
  const { data: session, status } = useSession();
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; elementStartX: number; elementStartY: number } | null>(null);
  const resizeRef = useRef<{ corner: string; startX: number; startY: number; elementStartWidth: number; elementStartHeight: number } | null>(null);

  // Designer state
  const [state, setState] = useState<DesignerState>({
    product: null,
    color: PRO_COLORS[0],
    customColor: '',
    view: 'front',
    elements: [],
    selectedElementId: null,
    selectedSizes: [],
    zoom: 100,
    showGuides: true,
    designName: '',
  });

  const [step, setStep] = useState<'product' | 'design' | 'options' | 'save'>('product');
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Auth check
  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      redirect('/');
    }
  }, [status, session]);

  // Get selected element
  const selectedElement = state.elements.find(e => e.id === state.selectedElementId);

  // Update state helper
  const updateState = useCallback((updates: Partial<DesignerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Update element helper
  const updateElement = useCallback((id: string, updates: Partial<DesignElement>) => {
    setState(prev => ({
      ...prev,
      elements: prev.elements.map(el => el.id === id ? { ...el, ...updates } : el),
    }));
  }, []);

  // Select product
  const selectProduct = useCallback((product: MockupProduct) => {
    updateState({ product, elements: [], selectedElementId: null });
    setStep('design');
  }, [updateState]);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const newElement: DesignElement = {
          id: `img-${Date.now()}`,
          type: 'image',
          src: event.target?.result as string,
          x: 35, y: 30, width: 30, height: 30,
          rotation: 0, opacity: 100, locked: false, visible: true,
          originalWidth: img.width, originalHeight: img.height,
        };
        setState(prev => ({
          ...prev,
          elements: [...prev.elements, newElement],
          selectedElementId: newElement.id,
        }));
        toast.success('Image added to design');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // Add text element
  const addTextElement = useCallback(() => {
    const newElement: DesignElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      text: 'Your Text Here',
      x: 35, y: 50, width: 30, height: 10,
      rotation: 0, opacity: 100, locked: false, visible: true,
      fontSize: 32, fontFamily: 'Arial', fontWeight: 'bold',
      fill: '#000000', textAlign: 'center',
    };
    setState(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
      selectedElementId: newElement.id,
    }));
  }, []);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/designs">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <h1 className="text-xl font-bold">Product Designer</h1>
              {state.product && (
                <Badge variant="secondary">{state.product.name}</Badge>
              )}
            </div>
            {/* Step indicators */}
            <div className="hidden md:flex items-center gap-2">
              {[
                { key: 'product', label: '1. Product' },
                { key: 'design', label: '2. Design' },
                { key: 'options', label: '3. Options' },
                { key: 'save', label: '4. Save' },
              ].map((s, i, arr) => (
                <div key={s.key} className="flex items-center">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    step === s.key
                      ? 'bg-primary text-white'
                      : arr.findIndex(x => x.key === step) > i
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-500'
                  }`}>
                    {arr.findIndex(x => x.key === step) > i ? <Check className="w-3 h-3 inline mr-1" /> : null}
                    {s.label}
                  </div>
                  {i < arr.length - 1 && <div className="w-4 h-0.5 bg-gray-200 mx-1" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {/* Step 1: Product Selection */}
        {step === 'product' && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Select a Product</h2>
              <p className="text-gray-600">Choose the product you want to customize</p>
            </div>
            <Tabs defaultValue="tops" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
                <TabsTrigger value="tops">Tops</TabsTrigger>
                <TabsTrigger value="bottoms">Bottoms</TabsTrigger>
                <TabsTrigger value="accessories">Accessories</TabsTrigger>
              </TabsList>
              {['tops', 'bottoms', 'accessories'].map(category => (
                <TabsContent key={category} value={category}>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {MOCKUP_PRODUCTS.filter(p => p.category === category).map(product => (
                      <Card
                        key={product.id}
                        className="cursor-pointer hover:shadow-xl transition-all group overflow-hidden"
                        onClick={() => selectProduct(product)}
                      >
                        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                          {/* Product mockup placeholder - would be real image */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div
                              className="w-3/4 h-3/4 rounded-lg shadow-inner"
                              style={{ backgroundColor: PRO_COLORS[5].hex }}
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-primary">${product.basePrice}</span>
                            <Badge variant="secondary">{product.views.length} views</Badge>
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
        {step === 'design' && state.product && (
          <div className="grid grid-cols-12 gap-6 h-[calc(100vh-180px)]">
            {/* Left Sidebar - Tools */}
            <div className="col-span-3 space-y-4 overflow-y-auto">
              {/* Upload */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Add Elements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  <Button className="w-full" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" /> Upload Image
                  </Button>
                  <Button variant="outline" className="w-full" onClick={addTextElement}>
                    <Type className="w-4 h-4 mr-2" /> Add Text
                  </Button>
                </CardContent>
              </Card>

              {/* Color Selection */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Product Color
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-6 gap-2 mb-3">
                    {PRO_COLORS.slice(0, 12).map(color => (
                      <button
                        key={color.id}
                        className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                          state.color.id === color.id && !state.customColor
                            ? 'border-primary ring-2 ring-primary/30 scale-110'
                            : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        onClick={() => updateState({ color, customColor: '' })}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Label className="text-xs">Custom:</Label>
                    <Input
                      type="color"
                      value={state.customColor || state.color.hex}
                      onChange={(e) => updateState({ customColor: e.target.value })}
                      className="w-10 h-8 p-1 border rounded cursor-pointer"
                    />
                    <span className="text-xs text-gray-500 flex-1 text-right">
                      {state.customColor || state.color.hex}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Layers */}
              <Card className="flex-1">
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Layers ({state.elements.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {state.elements.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No elements added yet</p>
                  ) : (
                    <div className="space-y-2">
                      {[...state.elements].reverse().map(el => (
                        <div
                          key={el.id}
                          className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            state.selectedElementId === el.id
                              ? 'bg-primary/10 border border-primary/30'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => updateState({ selectedElementId: el.id })}
                        >
                          <button
                            className="p-1 hover:bg-gray-200 rounded"
                            onClick={(e) => { e.stopPropagation(); updateElement(el.id, { visible: !el.visible }); }}
                          >
                            {el.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-gray-400" />}
                          </button>
                          <span className="flex-1 text-sm truncate">
                            {el.type === 'image' ? '🖼️ Image' : `📝 ${el.text?.substring(0, 15) || 'Text'}`}
                          </span>
                          <button
                            className="p-1 hover:bg-red-100 rounded text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              setState(prev => ({
                                ...prev,
                                elements: prev.elements.filter(x => x.id !== el.id),
                                selectedElementId: prev.selectedElementId === el.id ? null : prev.selectedElementId,
                              }));
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Canvas continues in next chunk */}
            <DesignCanvas
              state={state}
              updateState={updateState}
              updateElement={updateElement}
              canvasRef={canvasRef}
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              isResizing={isResizing}
              setIsResizing={setIsResizing}
              dragRef={dragRef}
              resizeRef={resizeRef}
            />

            {/* Right Sidebar - Properties */}
            <div className="col-span-3 space-y-4 overflow-y-auto">
              <PropertiesPanel
                selectedElement={selectedElement}
                updateElement={updateElement}
                state={state}
                updateState={updateState}
                setStep={setStep}
              />
            </div>
          </div>
        )}

        {/* Step 3: Options */}
        {step === 'options' && state.product && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Product Options</h2>
              <p className="text-gray-600">Configure sizes and pricing for your design</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Design Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="aspect-[3/4] rounded-lg relative overflow-hidden"
                    style={{ backgroundColor: state.customColor || state.color.hex }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      {state.elements.filter(e => e.visible).map(el => (
                        <div
                          key={el.id}
                          className="absolute"
                          style={{
                            left: `${el.x}%`,
                            top: `${el.y}%`,
                            width: `${el.width}%`,
                            transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`,
                            opacity: el.opacity / 100,
                          }}
                        >
                          {el.type === 'image' && el.src && (
                            <img src={el.src} alt="" className="w-full h-auto" />
                          )}
                          {el.type === 'text' && (
                            <div style={{ fontFamily: el.fontFamily, fontSize: `${(el.fontSize || 24) * 0.5}px`, fontWeight: el.fontWeight, color: el.fill }}>
                              {el.text}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <Badge variant="secondary" className="text-lg px-4 py-1">
                      {state.product.name} - {state.color.name}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Options */}
              <div className="space-y-6">
                {/* Design Name */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Design Name</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      placeholder="Enter a name for this design..."
                      value={state.designName}
                      onChange={(e) => updateState({ designName: e.target.value })}
                    />
                  </CardContent>
                </Card>

                {/* Size Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Available Sizes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2">
                      {APPAREL_SIZES.map(size => (
                        <button
                          key={size.id}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            state.selectedSizes.includes(size.id)
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            updateState({
                              selectedSizes: state.selectedSizes.includes(size.id)
                                ? state.selectedSizes.filter(s => s !== size.id)
                                : [...state.selectedSizes, size.id]
                            });
                          }}
                        >
                          <div className="font-bold">{size.name}</div>
                          <div className="text-xs text-gray-500">{size.displayName}</div>
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => updateState({ selectedSizes: APPAREL_SIZES.map(s => s.id) })}
                    >
                      Select All Sizes
                    </Button>
                  </CardContent>
                </Card>

                {/* Pricing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Pricing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>Base Price:</span>
                      <span className="text-xl font-bold">${state.product.basePrice}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep('design')}>
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back to Design
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setStep('save')}
                    disabled={!state.designName || state.selectedSizes.length === 0}
                  >
                    Continue <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Save/Publish */}
        {step === 'save' && state.product && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Save Your Design</h2>
              <p className="text-gray-600">Review and publish your custom product</p>
            </div>
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-500">Product</span>
                    <p className="font-semibold">{state.product.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Color</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: state.customColor || state.color.hex }} />
                      <span className="font-semibold">{state.customColor ? 'Custom' : state.color.name}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Design Name</span>
                    <p className="font-semibold">{state.designName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Sizes</span>
                    <p className="font-semibold">{state.selectedSizes.length} sizes selected</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Elements</span>
                    <p className="font-semibold">{state.elements.length} design elements</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Price</span>
                    <p className="font-semibold text-primary">${state.product.basePrice}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    className="w-full h-12 text-lg"
                    onClick={async () => {
                      setSaving(true);
                      try {
                        // Save design to API
                        const response = await fetch('/api/designer/save', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: state.designName,
                            productId: state.product?.id,
                            color: state.customColor || state.color.hex,
                            colorName: state.customColor ? 'Custom' : state.color.name,
                            elements: state.elements,
                            sizes: state.selectedSizes,
                            price: state.product?.basePrice,
                          }),
                        });
                        if (response.ok) {
                          toast.success('Design saved successfully!');
                          // Reset or redirect
                        } else {
                          throw new Error('Failed to save');
                        }
                      } catch (error) {
                        toast.error('Failed to save design');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving}
                  >
                    {saving ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="w-5 h-5 mr-2" /> Save Design</>
                    )}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setStep('options')}>
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back to Options
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

// Design Canvas Component
function DesignCanvas({ state, updateState, updateElement, canvasRef, isDragging, setIsDragging, isResizing, setIsResizing, dragRef, resizeRef }: any) {
  const productColor = state.customColor || state.color.hex;

  // Mouse handlers for drag
  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    const element = state.elements.find((el: DesignElement) => el.id === elementId);
    if (!element || element.locked) return;

    e.preventDefault();
    e.stopPropagation();

    updateState({ selectedElementId: elementId });
    setIsDragging(true);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      elementStartX: element.x,
      elementStartY: element.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragRef.current || !state.selectedElementId) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const dx = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
    const dy = ((e.clientY - dragRef.current.startY) / rect.height) * 100;

    updateElement(state.selectedElementId, {
      x: Math.max(0, Math.min(100, dragRef.current.elementStartX + dx)),
      y: Math.max(0, Math.min(100, dragRef.current.elementStartY + dy)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    dragRef.current = null;
    resizeRef.current = null;
  };

  // Resize handler
  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    const element = state.elements.find((el: DesignElement) => el.id === state.selectedElementId);
    if (!element || element.locked) return;

    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    resizeRef.current = {
      corner,
      startX: e.clientX,
      startY: e.clientY,
      elementStartWidth: element.width,
      elementStartHeight: element.height,
    };
  };

  return (
    <div className="col-span-6 flex flex-col">
      {/* View Toggle */}
      <div className="flex justify-center gap-2 mb-4">
        {state.product?.views.map((view: any) => (
          <Button
            key={view.id}
            variant={state.view === view.angle ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateState({ view: view.angle as 'front' | 'back' })}
          >
            {view.name}
          </Button>
        ))}
      </div>

      {/* Canvas Area */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-4 h-full flex items-center justify-center bg-[#f5f5f5]">
          <div
            ref={canvasRef}
            className="relative bg-white rounded-lg shadow-lg overflow-hidden"
            style={{
              width: '100%',
              maxWidth: '500px',
              aspectRatio: '3/4',
              transform: `scale(${state.zoom / 100})`,
              transformOrigin: 'center',
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => updateState({ selectedElementId: null })}
          >
            {/* Product Base with Color */}
            <div
              className="absolute inset-0"
              style={{ backgroundColor: productColor }}
            >
              {/* Fabric texture overlay for realism */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
                  opacity: 0.03,
                  mixBlendMode: 'overlay',
                }}
              />
            </div>

            {/* Print Area Guide */}
            {state.showGuides && state.product && (
              <div
                className="absolute border-2 border-dashed border-blue-400/50 pointer-events-none"
                style={{
                  left: `${state.product.printableArea.x}%`,
                  top: `${state.product.printableArea.y}%`,
                  width: `${state.product.printableArea.width}%`,
                  height: `${state.product.printableArea.height}%`,
                }}
              >
                <span className="absolute -top-5 left-0 text-xs text-blue-500 bg-white px-1 rounded">
                  Print Area
                </span>
              </div>
            )}

            {/* Design Elements */}
            {state.elements.filter((el: DesignElement) => el.visible).map((element: DesignElement) => (
              <div
                key={element.id}
                className={`absolute cursor-move transition-shadow ${
                  state.selectedElementId === element.id ? 'ring-2 ring-primary shadow-lg' : ''
                } ${element.locked ? 'cursor-not-allowed' : ''}`}
                style={{
                  left: `${element.x}%`,
                  top: `${element.y}%`,
                  width: `${element.width}%`,
                  transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
                  opacity: element.opacity / 100,
                }}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
                onClick={(e) => e.stopPropagation()}
              >
                {element.type === 'image' && element.src && (
                  <img
                    src={element.src}
                    alt="Design"
                    className="w-full h-auto pointer-events-none"
                    draggable={false}
                  />
                )}
                {element.type === 'text' && (
                  <div
                    className="whitespace-nowrap pointer-events-none"
                    style={{
                      fontFamily: element.fontFamily,
                      fontSize: `${element.fontSize}px`,
                      fontWeight: element.fontWeight,
                      color: element.fill,
                      textAlign: element.textAlign,
                    }}
                  >
                    {element.text}
                  </div>
                )}

                {/* Resize Handles */}
                {state.selectedElementId === element.id && !element.locked && (
                  <>
                    {['nw', 'ne', 'sw', 'se'].map(corner => (
                      <div
                        key={corner}
                        className="absolute w-3 h-3 bg-white border-2 border-primary rounded-sm cursor-nwse-resize"
                        style={{
                          ...(corner.includes('n') ? { top: -6 } : { bottom: -6 }),
                          ...(corner.includes('w') ? { left: -6 } : { right: -6 }),
                        }}
                        onMouseDown={(e) => handleResizeStart(e, corner)}
                      />
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Zoom Controls */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <Button variant="outline" size="icon" onClick={() => updateState({ zoom: Math.max(50, state.zoom - 10) })}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-sm font-medium w-16 text-center">{state.zoom}%</span>
        <Button variant="outline" size="icon" onClick={() => updateState({ zoom: Math.min(150, state.zoom + 10) })}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <div className="w-px h-6 bg-gray-200 mx-2" />
        <Button
          variant={state.showGuides ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateState({ showGuides: !state.showGuides })}
        >
          Guides {state.showGuides ? 'On' : 'Off'}
        </Button>
      </div>
    </div>
  );
}

// Properties Panel Component
function PropertiesPanel({ selectedElement, updateElement, state, updateState, setStep }: any) {
  return (
    <>
      {selectedElement ? (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Move className="w-4 h-4" /> Element Properties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Position */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">X Position</Label>
                <Slider
                  value={[selectedElement.x]}
                  onValueChange={([v]) => updateElement(selectedElement.id, { x: v })}
                  min={0} max={100} step={1}
                />
              </div>
              <div>
                <Label className="text-xs">Y Position</Label>
                <Slider
                  value={[selectedElement.y]}
                  onValueChange={([v]) => updateElement(selectedElement.id, { y: v })}
                  min={0} max={100} step={1}
                />
              </div>
            </div>

            {/* Size */}
            <div>
              <Label className="text-xs">Size: {selectedElement.width}%</Label>
              <Slider
                value={[selectedElement.width]}
                onValueChange={([v]) => updateElement(selectedElement.id, { width: v })}
                min={5} max={80} step={1}
              />
            </div>

            {/* Rotation */}
            <div>
              <Label className="text-xs">Rotation: {selectedElement.rotation}°</Label>
              <Slider
                value={[selectedElement.rotation]}
                onValueChange={([v]) => updateElement(selectedElement.id, { rotation: v })}
                min={-180} max={180} step={1}
              />
            </div>

            {/* Opacity */}
            <div>
              <Label className="text-xs">Opacity: {selectedElement.opacity}%</Label>
              <Slider
                value={[selectedElement.opacity]}
                onValueChange={([v]) => updateElement(selectedElement.id, { opacity: v })}
                min={10} max={100} step={1}
              />
            </div>

            {/* Text Properties */}
            {selectedElement.type === 'text' && (
              <>
                <div className="pt-3 border-t">
                  <Label className="text-xs">Text Content</Label>
                  <Input
                    value={selectedElement.text}
                    onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Font Size: {selectedElement.fontSize}px</Label>
                  <Slider
                    value={[selectedElement.fontSize || 24]}
                    onValueChange={([v]) => updateElement(selectedElement.id, { fontSize: v })}
                    min={12} max={72} step={1}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Color:</Label>
                  <Input
                    type="color"
                    value={selectedElement.fill || '#000000'}
                    onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value })}
                    className="w-10 h-8 p-1"
                  />
                </div>
              </>
            )}

            {/* Lock */}
            <div className="flex items-center justify-between pt-3 border-t">
              <span className="text-sm">Lock Element</span>
              <Button
                variant={selectedElement.locked ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateElement(selectedElement.id, { locked: !selectedElement.locked })}
              >
                {selectedElement.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <Move className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Select an element to edit its properties</p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Button className="w-full" onClick={() => setStep('options')}>
            Continue to Options <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setStep('product')}>
            <ChevronLeft className="w-4 h-4 mr-2" /> Change Product
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

