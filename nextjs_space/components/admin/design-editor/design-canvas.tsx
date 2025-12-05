'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ZoomIn, ZoomOut, Grid, Ruler, Magnet, RotateCcw,
  MousePointer, Move, Maximize2, Minimize2
} from 'lucide-react';
import Image from 'next/image';
import { DesignLayer } from '@/hooks/use-design-editor';

interface DesignCanvasProps {
  layers: DesignLayer[];
  selectedLayerId: string | null;
  productMockupSrc: string;
  productType: string;
  productAngle: string;
  zoom: number;
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  gridSize: number;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, updates: Partial<DesignLayer>, addToHistory?: boolean) => void;
  onZoomChange: (zoom: number) => void;
  onToggleGrid: () => void;
  onToggleRulers: () => void;
  onToggleSnap: () => void;
  snapPosition: (x: number, y: number) => { x: number; y: number };
}

export function DesignCanvas({
  layers,
  selectedLayerId,
  productMockupSrc,
  productType,
  productAngle,
  zoom,
  showGrid,
  showRulers,
  snapToGrid,
  gridSize,
  onSelectLayer,
  onUpdateLayer,
  onZoomChange,
  onToggleGrid,
  onToggleRulers,
  onToggleSnap,
  snapPosition,
}: DesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  // Canvas dimensions (percentage based for responsiveness)
  const CANVAS_SIZE = 500; // Base canvas size in pixels

  // Handle mouse down on a layer
  const handleLayerMouseDown = (e: React.MouseEvent, layerId: string) => {
    e.stopPropagation();
    const layer = layers.find(l => l.id === layerId);
    if (!layer || layer.locked) return;

    onSelectLayer(layerId);
    setIsDragging(true);
    setDraggedLayerId(layerId);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left - (layer.x / 100) * rect.width,
        y: e.clientY - rect.top - (layer.y / 100) * rect.height,
      });
    }
  };

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !draggedLayerId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left - dragStart.x) / rect.width) * 100;
    let y = ((e.clientY - rect.top - dragStart.y) / rect.height) * 100;

    // Snap to grid if enabled
    if (snapToGrid) {
      const snapped = snapPosition(x, y);
      x = snapped.x;
      y = snapped.y;
    }

    // Clamp values
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    onUpdateLayer(draggedLayerId, { x, y }, false);
  }, [isDragging, draggedLayerId, dragStart, snapToGrid, snapPosition, onUpdateLayer]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isDragging && draggedLayerId) {
      // Record the final position in history
      const layer = layers.find(l => l.id === draggedLayerId);
      if (layer) {
        onUpdateLayer(draggedLayerId, { x: layer.x, y: layer.y }, true);
      }
    }
    setIsDragging(false);
    setDraggedLayerId(null);
    setIsResizing(false);
    setResizeHandle(null);
  }, [isDragging, draggedLayerId, layers, onUpdateLayer]);

  // Handle canvas click (deselect)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      onSelectLayer(null);
    }
  };

  // Zoom controls
  const handleZoomIn = () => onZoomChange(Math.min(zoom + 0.25, 4));
  const handleZoomOut = () => onZoomChange(Math.max(zoom - 0.25, 0.25));
  const handleZoomReset = () => onZoomChange(1);

  // Sort layers by z-index for rendering
  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="flex flex-col h-full">
      {/* Canvas Toolbar */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border-b rounded-t-lg">
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle pressed={showGrid} onPressedChange={onToggleGrid} size="sm">
                  <Grid className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Toggle Grid</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle pressed={showRulers} onPressedChange={onToggleRulers} size="sm">
                  <Ruler className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Toggle Rulers</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle pressed={snapToGrid} onPressedChange={onToggleSnap} size="sm">
                  <Magnet className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Snap to Grid</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {productType.replace(/-/g, ' ')} • {productAngle}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomReset}>
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Canvas with Rulers */}
      <div className="flex-1 relative overflow-auto bg-gray-100">
        {/* Horizontal Ruler */}
        {showRulers && (
          <div className="absolute top-0 left-8 right-0 h-6 bg-gray-200 border-b flex items-end z-10">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="flex-1 relative">
                <div className="absolute bottom-0 left-0 w-px h-3 bg-gray-400" />
                <span className="absolute bottom-1 left-1 text-[8px] text-gray-500">{i * 10}</span>
              </div>
            ))}
          </div>
        )}

        {/* Vertical Ruler */}
        {showRulers && (
          <div className="absolute top-6 left-0 bottom-0 w-6 bg-gray-200 border-r flex flex-col z-10">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="flex-1 relative">
                <div className="absolute left-0 top-0 h-px w-3 bg-gray-400" />
                <span className="absolute left-1 top-1 text-[8px] text-gray-500 writing-mode-vertical">{i * 10}</span>
              </div>
            ))}
          </div>
        )}

        {/* Main Canvas Area */}
        <div
          className={`${showRulers ? 'ml-6 mt-6' : ''} p-4 flex items-center justify-center min-h-full`}
          style={{ minHeight: '500px' }}
        >
          <div
            ref={canvasRef}
            className="relative bg-white rounded-lg shadow-lg overflow-hidden cursor-crosshair"
            style={{
              width: `${CANVAS_SIZE * zoom}px`,
              height: `${CANVAS_SIZE * zoom}px`,
              transform: `scale(1)`,
            }}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Grid Overlay */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
                  `,
                  backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
                }}
              />
            )}

            {/* Product Mockup Background */}
            {productMockupSrc && (
              <div className="absolute inset-0 p-4 z-0">
                <div className="relative w-full h-full">
                  <Image
                    src={productMockupSrc}
                    alt={`${productType} mockup`}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            )}

            {/* Design Layers */}
            {sortedLayers.filter(l => l.visible).map(layer => (
              <div
                key={layer.id}
                className={`absolute cursor-move transition-shadow ${
                  selectedLayerId === layer.id
                    ? 'ring-2 ring-blue-500 ring-offset-1'
                    : 'hover:ring-1 hover:ring-blue-300'
                } ${layer.locked ? 'cursor-not-allowed opacity-70' : ''}`}
                style={{
                  left: `${layer.x}%`,
                  top: `${layer.y}%`,
                  transform: `translate(-50%, -50%) scale(${layer.scale}) rotate(${layer.rotation}deg)`,
                  opacity: layer.opacity,
                  zIndex: layer.zIndex + 10,
                }}
                onMouseDown={(e) => handleLayerMouseDown(e, layer.id)}
              >
                {/* Layer Content based on type */}
                {layer.type === 'logo' && layer.src && (
                  <Image
                    src={layer.src}
                    alt={layer.name}
                    width={Math.round(layer.width * zoom)}
                    height={Math.round(layer.height * zoom)}
                    className="object-contain pointer-events-none"
                    style={{ mixBlendMode: 'multiply' }}
                  />
                )}

                {layer.type === 'text' && (
                  <div
                    className="whitespace-nowrap pointer-events-none select-none"
                    style={{
                      fontFamily: layer.fontFamily || 'Arial',
                      fontSize: `${(layer.fontSize || 24) * zoom}px`,
                      fontWeight: layer.fontWeight || 'normal',
                      color: layer.color || '#000000',
                      textAlign: layer.textAlign || 'center',
                    }}
                  >
                    {layer.content}
                  </div>
                )}

                {layer.type === 'shape' && (
                  <div
                    className="pointer-events-none"
                    style={{
                      width: `${layer.width * zoom}px`,
                      height: `${layer.height * zoom}px`,
                      backgroundColor: layer.fill || '#000000',
                      borderRadius: '4px',
                    }}
                  />
                )}

                {/* Resize Handles for Selected Layer */}
                {selectedLayerId === layer.id && !layer.locked && (
                  <>
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize" />
                  </>
                )}
              </div>
            ))}

            {/* Position Indicator */}
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded z-50">
              {selectedLayerId ? (
                `X: ${layers.find(l => l.id === selectedLayerId)?.x.toFixed(0)}% Y: ${layers.find(l => l.id === selectedLayerId)?.y.toFixed(0)}%`
              ) : (
                'Click layer to select'
              )}
            </div>

            {/* Angle Badge */}
            <div className="absolute top-2 right-2 bg-primary/90 text-white text-xs px-2 py-1 rounded z-50 font-medium">
              {productAngle.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

