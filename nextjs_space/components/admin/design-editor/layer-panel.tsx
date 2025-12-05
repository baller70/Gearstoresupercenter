'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Layers, Eye, EyeOff, Lock, Unlock, Trash2, Copy,
  ChevronUp, ChevronDown, ChevronsUp, ChevronsDown,
  MoreVertical, Type, Image as ImageIcon, Square, Plus
} from 'lucide-react';
import { DesignLayer } from '@/hooks/use-design-editor';

interface LayerPanelProps {
  layers: DesignLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<DesignLayer>) => void;
  onRemoveLayer: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onMoveLayerOrder: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onAddLayer: (layer: Omit<DesignLayer, 'id' | 'zIndex'>) => void;
}

export function LayerPanel({
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onRemoveLayer,
  onDuplicateLayer,
  onMoveLayerOrder,
  onToggleVisibility,
  onToggleLock,
  onAddLayer,
}: LayerPanelProps) {
  const [editingName, setEditingName] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  // Sort layers by z-index (highest first for display)
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);
  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  const handleStartRename = (layer: DesignLayer) => {
    setEditingName(layer.id);
    setTempName(layer.name);
  };

  const handleFinishRename = (layerId: string) => {
    if (tempName.trim()) {
      onUpdateLayer(layerId, { name: tempName.trim() });
    }
    setEditingName(null);
    setTempName('');
  };

  const getLayerIcon = (type: DesignLayer['type']) => {
    switch (type) {
      case 'logo': return <ImageIcon className="h-4 w-4 text-blue-500" />;
      case 'text': return <Type className="h-4 w-4 text-green-500" />;
      case 'shape': return <Square className="h-4 w-4 text-orange-500" />;
      case 'graphic': return <ImageIcon className="h-4 w-4 text-purple-500" />;
      default: return <Layers className="h-4 w-4" />;
    }
  };

  const handleAddTextLayer = () => {
    onAddLayer({
      type: 'text',
      name: 'New Text',
      visible: true,
      locked: false,
      x: 50,
      y: 50,
      width: 100,
      height: 30,
      scale: 1,
      rotation: 0,
      opacity: 1,
      content: 'New Text',
      fontFamily: 'Arial',
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000000',
      textAlign: 'center',
    });
  };

  const handleAddShapeLayer = () => {
    onAddLayer({
      type: 'shape',
      name: 'New Shape',
      visible: true,
      locked: false,
      x: 50,
      y: 50,
      width: 50,
      height: 50,
      scale: 1,
      rotation: 0,
      opacity: 1,
      fill: '#3B82F6',
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Layers
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleAddTextLayer}>
                <Type className="mr-2 h-4 w-4" /> Add Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAddShapeLayer}>
                <Square className="mr-2 h-4 w-4" /> Add Shape
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-2 pt-0 overflow-hidden">
        {/* Layer List */}
        <ScrollArea className="flex-1 -mx-2 px-2">
          <div className="space-y-1">
            {sortedLayers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No layers yet. Add a logo or text to get started.
              </div>
            ) : (
              sortedLayers.map(layer => (
                <div
                  key={layer.id}
                  className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                    selectedLayerId === layer.id
                      ? 'bg-blue-100 border border-blue-300'
                      : 'hover:bg-gray-100 border border-transparent'
                  }`}
                  onClick={() => onSelectLayer(layer.id)}
                >
                  {/* Layer Icon */}
                  {getLayerIcon(layer.type)}
                  {/* Layer Name */}
                  <div className="flex-1 min-w-0">
                    {editingName === layer.id ? (
                      <Input
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onBlur={() => handleFinishRename(layer.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFinishRename(layer.id)}
                        className="h-6 text-xs"
                        autoFocus
                      />
                    ) : (
                      <span 
                        className={`text-xs truncate block ${!layer.visible ? 'opacity-50' : ''}`}
                        onDoubleClick={() => handleStartRename(layer)}
                      >
                        {layer.name}
                      </span>
                    )}
                  </div>
                  {/* Quick Actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}>
                      {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onToggleLock(layer.id); }}>
                      {layer.locked ? <Lock className="h-3 w-3 text-orange-500" /> : <Unlock className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        {/* Selected Layer Properties */}
        {selectedLayer && (
          <>
            <Separator className="my-2" />
            <div className="space-y-3">
              <div className="text-xs font-medium text-muted-foreground">Layer Properties</div>

              {/* Position */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">X Position</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedLayer.x)}
                    onChange={(e) => onUpdateLayer(selectedLayer.id, { x: Number(e.target.value) })}
                    className="h-7 text-xs"
                    min={0}
                    max={100}
                  />
                </div>
                <div>
                  <Label className="text-xs">Y Position</Label>
                  <Input
                    type="number"
                    value={Math.round(selectedLayer.y)}
                    onChange={(e) => onUpdateLayer(selectedLayer.id, { y: Number(e.target.value) })}
                    className="h-7 text-xs"
                    min={0}
                    max={100}
                  />
                </div>
              </div>

              {/* Scale */}
              <div>
                <Label className="text-xs">Scale: {(selectedLayer.scale * 100).toFixed(0)}%</Label>
                <Slider
                  value={[selectedLayer.scale * 100]}
                  onValueChange={([v]) => onUpdateLayer(selectedLayer.id, { scale: v / 100 })}
                  min={10}
                  max={300}
                  step={5}
                  className="mt-1"
                />
              </div>

              {/* Rotation */}
              <div>
                <Label className="text-xs">Rotation: {selectedLayer.rotation}°</Label>
                <Slider
                  value={[selectedLayer.rotation]}
                  onValueChange={([v]) => onUpdateLayer(selectedLayer.id, { rotation: v })}
                  min={-180}
                  max={180}
                  step={1}
                  className="mt-1"
                />
              </div>

              {/* Opacity */}
              <div>
                <Label className="text-xs">Opacity: {Math.round(selectedLayer.opacity * 100)}%</Label>
                <Slider
                  value={[selectedLayer.opacity * 100]}
                  onValueChange={([v]) => onUpdateLayer(selectedLayer.id, { opacity: v / 100 })}
                  min={0}
                  max={100}
                  step={5}
                  className="mt-1"
                />
              </div>

              {/* Layer Order */}
              <div>
                <Label className="text-xs">Layer Order</Label>
                <div className="flex gap-1 mt-1">
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onMoveLayerOrder(selectedLayer.id, 'top')}>
                    <ChevronsUp className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onMoveLayerOrder(selectedLayer.id, 'up')}>
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onMoveLayerOrder(selectedLayer.id, 'down')}>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onMoveLayerOrder(selectedLayer.id, 'bottom')}>
                    <ChevronsDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onDuplicateLayer(selectedLayer.id)}>
                  <Copy className="mr-1 h-3 w-3" /> Duplicate
                </Button>
                <Button variant="destructive" size="sm" className="flex-1" onClick={() => onRemoveLayer(selectedLayer.id)}>
                  <Trash2 className="mr-1 h-3 w-3" /> Delete
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

