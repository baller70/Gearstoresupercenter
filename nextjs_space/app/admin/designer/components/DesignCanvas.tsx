'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MockupView } from '@/lib/mockup-system';
import { DesignElement, DesignerState, DragState, ResizeState } from '../types';
import { ProductColorOverlay } from './ProductColorOverlay';

interface DesignCanvasProps {
  state: DesignerState;
  updateState: (updates: Partial<DesignerState>) => void;
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  canvasRef: React.RefObject<HTMLDivElement>;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  isResizing: boolean;
  setIsResizing: (resizing: boolean) => void;
  dragRef: React.MutableRefObject<DragState | null>;
  resizeRef: React.MutableRefObject<ResizeState | null>;
}

/**
 * DesignCanvas Component
 *
 * Main canvas area for the merchandise designer.
 * Handles product mockup display, design element rendering,
 * and drag/resize interactions.
 */
export function DesignCanvas({
  state,
  updateState,
  updateElement,
  canvasRef,
  isDragging,
  setIsDragging,
  isResizing,
  setIsResizing,
  dragRef,
  resizeRef,
}: DesignCanvasProps) {
  const productColor = state.customColor || state.color.hex;

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    const element = state.elements.find(el => el.id === elementId);
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

  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    const element = state.elements.find(el => el.id === state.selectedElementId);
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

  if (!state.product) return null;

  const currentView = state.product.views.find(v => v.angle === state.view);
  const mockupUrl = currentView?.mockupUrl || state.product.thumbnailUrl || '';

  return (
    <div className="col-span-6 flex flex-col">
      {/* View Toggle */}
      <div className="flex justify-center gap-2 mb-4">
        {state.product.views.map((view: MockupView) => (
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
            {/* Canvas Background - Always White */}
            <div className="absolute inset-0 bg-white" />

            {/* Product Mockup with Color Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <ProductColorOverlay
                mockupUrl={mockupUrl}
                productName={state.product.name}
                color={productColor}
              />
            </div>

            {/* Print Area Guide */}
            {state.showGuides && (
              <PrintAreaGuide printableArea={state.product.printableArea} />
            )}

            {/* Design Elements */}
            {state.elements.filter(el => el.visible).map(element => (
              <DesignElementRenderer
                key={element.id}
                element={element}
                isSelected={state.selectedElementId === element.id}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
                onResizeStart={handleResizeStart}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface PrintAreaGuideProps {
  printableArea: { x: number; y: number; width: number; height: number };
}

function PrintAreaGuide({ printableArea }: PrintAreaGuideProps) {
  return (
    <div
      className="absolute border-2 border-dashed border-blue-400/50 pointer-events-none"
      style={{
        left: `${printableArea.x}%`,
        top: `${printableArea.y}%`,
        width: `${printableArea.width}%`,
        height: `${printableArea.height}%`,
      }}
    >
      <span className="absolute -top-5 left-0 text-xs text-blue-500 bg-white px-1 rounded">
        Print Area
      </span>
    </div>
  );
}

interface DesignElementRendererProps {
  element: DesignElement;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent, corner: string) => void;
}

function DesignElementRenderer({
  element,
  isSelected,
  onMouseDown,
  onResizeStart,
}: DesignElementRendererProps) {
  return (
    <div
      className={`absolute cursor-move ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${element.locked ? 'cursor-not-allowed' : ''}`}
      style={{
        left: `${element.x}%`,
        top: `${element.y}%`,
        width: `${element.width}%`,
        transform: `translate(-50%, -50%) rotate(${element.rotation}deg)`,
        opacity: element.opacity / 100,
      }}
      onMouseDown={onMouseDown}
      onClick={(e) => e.stopPropagation()}
    >
      {element.type === 'image' && element.src && (
        <img
          src={element.src}
          alt=""
          className="w-full h-auto pointer-events-none"
          draggable={false}
        />
      )}
      {element.type === 'text' && (
        <div
          className="whitespace-nowrap pointer-events-none"
          style={{
            fontFamily: element.fontFamily || 'Arial',
            fontSize: `${element.fontSize || 24}px`,
            fontWeight: element.fontWeight || 'normal',
            color: element.fill || '#000000',
            textAlign: element.textAlign || 'center',
          }}
        >
          {element.text}
        </div>
      )}
      {/* Resize Handles */}
      {isSelected && !element.locked && (
        <>
          <div
            className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize"
            onMouseDown={(e) => onResizeStart(e, 'nw')}
          />
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize"
            onMouseDown={(e) => onResizeStart(e, 'ne')}
          />
          <div
            className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize"
            onMouseDown={(e) => onResizeStart(e, 'sw')}
          />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize"
            onMouseDown={(e) => onResizeStart(e, 'se')}
          />
        </>
      )}
    </div>
  );
}

export default DesignCanvas;

