'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Type, Palette, Layers, Eye, EyeOff, Trash2 } from 'lucide-react';
import { PRO_COLORS, ProductColor } from '@/lib/mockup-system';
import { DesignElement, DesignerState } from '../types';

interface DesignToolbarProps {
  state: DesignerState;
  updateState: (updates: Partial<DesignerState>) => void;
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  onAddImage: (file: File) => void;
  onAddText: () => void;
  onDeleteElement: (id: string) => void;
}

/**
 * DesignToolbar Component
 *
 * Left sidebar containing tools for adding elements, selecting colors,
 * and managing design layers.
 */
export function DesignToolbar({
  state,
  updateState,
  updateElement,
  onAddImage,
  onAddText,
  onDeleteElement,
}: DesignToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddImage(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="col-span-3 space-y-4 overflow-y-auto">
      {/* Upload Section */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4" /> Add Elements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button className="w-full" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" /> Upload Image
          </Button>
          <Button variant="outline" className="w-full" onClick={onAddText}>
            <Type className="w-4 h-4 mr-2" /> Add Text
          </Button>
        </CardContent>
      </Card>

      {/* Color Selection */}
      <ColorSelector
        selectedColor={state.color}
        customColor={state.customColor}
        onColorSelect={(color) => updateState({ color, customColor: '' })}
        onCustomColorChange={(hex) => updateState({ customColor: hex })}
      />

      {/* Layers Panel */}
      <LayersPanel
        elements={state.elements}
        selectedElementId={state.selectedElementId}
        onSelectElement={(id) => updateState({ selectedElementId: id })}
        onToggleVisibility={(id) => {
          const el = state.elements.find(e => e.id === id);
          if (el) updateElement(id, { visible: !el.visible });
        }}
        onDeleteElement={onDeleteElement}
      />
    </div>
  );
}

interface ColorSelectorProps {
  selectedColor: ProductColor;
  customColor: string;
  onColorSelect: (color: ProductColor) => void;
  onCustomColorChange: (hex: string) => void;
}

function ColorSelector({ selectedColor, customColor, onColorSelect, onCustomColorChange }: ColorSelectorProps) {
  return (
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
                selectedColor.id === color.id && !customColor
                  ? 'border-primary ring-2 ring-primary/30 scale-110'
                  : 'border-gray-200'
              }`}
              style={{ backgroundColor: color.hex }}
              onClick={() => onColorSelect(color)}
              title={color.name}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2 border-t">
          <Label className="text-xs">Custom:</Label>
          <Input
            type="color"
            value={customColor || selectedColor.hex}
            onChange={(e) => onCustomColorChange(e.target.value)}
            className="w-10 h-8 p-1 border rounded cursor-pointer"
          />
          <span className="text-xs text-gray-500 flex-1 text-right">
            {customColor || selectedColor.hex}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface LayersPanelProps {
  elements: DesignElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDeleteElement: (id: string) => void;
}

function LayersPanel({ elements, selectedElementId, onSelectElement, onToggleVisibility, onDeleteElement }: LayersPanelProps) {
  return (
    <Card className="flex-1">
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="w-4 h-4" /> Layers ({elements.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {elements.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No elements added yet</p>
        ) : (
          <div className="space-y-2">
            {[...elements].reverse().map(el => (
              <LayerItem
                key={el.id}
                element={el}
                isSelected={selectedElementId === el.id}
                onSelect={() => onSelectElement(el.id)}
                onToggleVisibility={() => onToggleVisibility(el.id)}
                onDelete={() => onDeleteElement(el.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface LayerItemProps {
  element: DesignElement;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}

function LayerItem({ element, isSelected, onSelect, onToggleVisibility, onDelete }: LayerItemProps) {
  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? 'bg-primary/10 border border-primary/30'
          : 'bg-gray-50 hover:bg-gray-100'
      }`}
      onClick={onSelect}
    >
      <button
        className="p-1 hover:bg-gray-200 rounded"
        onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
      >
        {element.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-gray-400" />}
      </button>
      <span className="flex-1 text-sm truncate">
        {element.type === 'image' ? '🖼️ Image' : `📝 ${element.text?.substring(0, 15) || 'Text'}`}
      </span>
      <button
        className="p-1 hover:bg-red-100 rounded text-red-500"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

export default DesignToolbar;

