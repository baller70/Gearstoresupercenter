'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft, Save, Loader2, Sparkles, Eye, Package,
  Palette, CheckCircle, Undo2, Redo2, Layers, Type,
  Settings, Wand2, Upload, Download, Grid, Ruler
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

// Import custom components
import { useDesignEditor, DesignLayer } from '@/hooks/use-design-editor';
import { AIAutomationPanel } from '@/components/admin/design-editor/ai-automation-panel';
import { DesignCanvas } from '@/components/admin/design-editor/design-canvas';
import { LayerPanel } from '@/components/admin/design-editor/layer-panel';
import { TextEditorPanel } from '@/components/admin/design-editor/text-editor-panel';

// Product types available
const PRODUCT_TYPES = [
  { id: 'basketball-tshirt', name: 'T-Shirt', icon: '👕' },
  { id: 'basketball-jersey', name: 'Jersey', icon: '🏀' },
  { id: 'basketball-hoodie', name: 'Hoodie', icon: '🧥' },
  { id: 'basketball-sweatshirt', name: 'Sweatshirt', icon: '👔' },
  { id: 'basketball-shorts', name: 'Shorts', icon: '🩳' },
];

const PRODUCT_ANGLES = ['front', 'back', 'side'] as const;

export default function DesignEditorPage() {
  const router = useRouter();
  const params = useParams();
  const designId = params.id as string;

  // Design editor state management
  const editor = useDesignEditor();

  // Page state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [design, setDesign] = useState<any>(null);
  const [mockups, setMockups] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ai' | 'layers' | 'text' | 'preview'>('ai');

  // Get current mockup image
  const getCurrentMockupSrc = useCallback(() => {
    const mockup = mockups.find(
      m => m.type === editor.state.productType && m.angle === editor.state.productAngle
    );
    if (mockup?.path) {
      if (mockup.path.startsWith('/')) return mockup.path;
      if (mockup.path.startsWith('http')) return mockup.path;
      return `/api/images/${mockup.path}`;
    }
    return '/placeholder-product.png';
  }, [mockups, editor.state.productType, editor.state.productAngle]);

  // Fetch design data on mount
  useEffect(() => {
    fetchDesignData();
  }, [designId]);

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

      // Initialize logo layer if design has a logo
      if (data.logoUrl) {
        editor.addLayer({
          type: 'logo',
          name: 'Main Logo',
          visible: true,
          locked: false,
          x: 50,
          y: 40,
          width: 150,
          height: 150,
          scale: 0.35,
          rotation: 0,
          opacity: 1,
          src: data.logoUrl.startsWith('/') ? data.logoUrl : `/api/images/${data.logoUrl}`,
        });
      }
    } catch (error) {
      console.error('Error fetching design:', error);
      toast.error('Failed to load design');
    } finally {
      setLoading(false);
    }
  };

  // Handle AI placements
  const handleApplyPlacements = (placements: Record<string, any>) => {
    const logoLayer = editor.state.layers.find(l => l.type === 'logo');
    if (logoLayer) {
      const key = `${editor.state.productType}-${editor.state.productAngle}`;
      const placement = placements[key];
      if (placement) {
        editor.updateLayer(logoLayer.id, {
          x: placement.x,
          y: placement.y,
          scale: placement.scale,
          rotation: placement.rotation || 0,
        });
      }
    }
    toast.success('AI placements applied!');
  };

  // Handle AI colors
  const handleApplyColors = (colors: string[]) => {
    if (colors.length > 0) {
      editor.setProductColor(colors[0]);
    }
    toast.success('Color scheme applied!');
  };

  // Handle AI variations
  const handleGenerateVariations = (variations: any[]) => {
    toast.info(`Generated ${variations.length} design variations`);
  };

  // Handle adding text layer
  const handleAddTextLayer = (text: string, style: Partial<DesignLayer>) => {
    editor.addLayer({
      type: 'text',
      name: text.substring(0, 20),
      visible: true,
      locked: false,
      x: 50,
      y: 60,
      width: 200,
      height: 40,
      scale: 1,
      rotation: 0,
      opacity: 1,
      content: text,
      fontFamily: style.fontFamily || 'Arial',
      fontSize: style.fontSize || 24,
      fontWeight: style.fontWeight || 'bold',
      color: style.color || '#000000',
      textAlign: 'center',
    });
    toast.success('Text layer added!');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Convert layers to positions format for API
  const convertLayersToPositions = () => {
    const positions: Record<string, { x: number; y: number; scale: number; rotation: number }> = {};
    const logoLayer = editor.state.layers.find(l => l.type === 'logo');

    if (logoLayer) {
      // Save position for current product type and angle
      const key = `${editor.state.productType}-${editor.state.productAngle}`;
      positions[key] = {
        x: logoLayer.x,
        y: logoLayer.y,
        scale: logoLayer.scale,
        rotation: logoLayer.rotation,
      };
    }

    return positions;
  };

  // Save design
  const handleSave = async () => {
    setSaving(true);
    try {
      const positions = convertLayersToPositions();
      const response = await fetch('/api/admin/designs/learn-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId,
          positions,
          colorVariants: [],
        }),
      });
      if (!response.ok) throw new Error('Failed to save');
      toast.success('Design saved! AI has learned from your adjustments.');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  // Publish design
  const handlePublish = async () => {
    setPublishing(true);
    try {
      const positions = convertLayersToPositions();
      const response = await fetch('/api/admin/designs/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId,
          positions,
          colorVariants: [],
        }),
      });
      if (!response.ok) throw new Error('Failed to publish');
      const data = await response.json();
      toast.success(`Published ${data.productsCreated || 0} products to store!`);
      setTimeout(() => router.push('/admin/designs'), 2000);
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish design');
    } finally {
      setPublishing(false);
    }
  };

  // Main render
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/designs">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold">{design?.name || 'Design Editor'}</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Design Studio</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Undo/Redo */}
              <Button variant="outline" size="icon" onClick={editor.undo} disabled={!editor.canUndo}>
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={editor.redo} disabled={!editor.canRedo}>
                <Redo2 className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6" />

              {/* Save & Publish */}
              <Button variant="outline" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
              </Button>
              <Button onClick={handlePublish} disabled={publishing} className="bg-green-600 hover:bg-green-700">
                {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Publish
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)]">
          {/* Left Sidebar - AI & Tools */}
          <div className="col-span-3 space-y-4 overflow-y-auto">
            {/* Product Selector */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={editor.state.productType} onValueChange={editor.setProductType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.icon} {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-1">
                  {PRODUCT_ANGLES.map(angle => (
                    <Button
                      key={angle}
                      variant={editor.state.productAngle === angle ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 capitalize"
                      onClick={() => editor.setProductAngle(angle)}
                    >
                      {angle}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Automation Panel */}
            <AIAutomationPanel
              designId={designId}
              logoUrl={design?.logoUrl || ''}
              productTypes={PRODUCT_TYPES.map(p => p.id)}
              onApplyPlacements={handleApplyPlacements}
              onApplyColors={handleApplyColors}
              onGenerateVariations={handleGenerateVariations}
              onAddTextLayer={handleAddTextLayer}
            />
          </div>

          {/* Center - Canvas */}
          <div className="col-span-6">
            <Card className="h-full">
              <DesignCanvas
                layers={editor.state.layers}
                selectedLayerId={editor.state.selectedLayerId}
                productMockupSrc={getCurrentMockupSrc()}
                productType={editor.state.productType}
                productAngle={editor.state.productAngle}
                zoom={editor.state.canvasZoom}
                showGrid={editor.state.showGrid}
                showRulers={editor.state.showRulers}
                snapToGrid={editor.state.snapToGrid}
                gridSize={editor.state.gridSize}
                onSelectLayer={editor.selectLayer}
                onUpdateLayer={editor.updateLayer}
                onZoomChange={editor.setZoom}
                onToggleGrid={editor.toggleGrid}
                onToggleRulers={editor.toggleRulers}
                onToggleSnap={editor.toggleSnapToGrid}
                snapPosition={editor.snapToGridPosition}
              />
            </Card>
          </div>

          {/* Right Sidebar - Layers & Properties */}
          <div className="col-span-3 space-y-4 overflow-y-auto">
            {/* Layers Panel */}
            <LayerPanel
              layers={editor.state.layers}
              selectedLayerId={editor.state.selectedLayerId}
              onSelectLayer={editor.selectLayer}
              onUpdateLayer={editor.updateLayer}
              onRemoveLayer={editor.removeLayer}
              onDuplicateLayer={editor.duplicateLayer}
              onMoveLayerOrder={editor.moveLayerOrder}
              onToggleVisibility={editor.toggleLayerVisibility}
              onToggleLock={editor.toggleLayerLock}
              onAddLayer={editor.addLayer}
            />

            {/* Text Editor Panel */}
            <TextEditorPanel
              selectedLayer={editor.selectedLayer}
              onUpdateLayer={editor.updateLayer}
              onAddTextLayer={handleAddTextLayer}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
