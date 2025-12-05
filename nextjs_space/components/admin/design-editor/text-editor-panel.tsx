'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Palette, Plus, Sparkles
} from 'lucide-react';
import { DesignLayer } from '@/hooks/use-design-editor';

interface TextEditorPanelProps {
  selectedLayer: DesignLayer | null;
  onUpdateLayer: (id: string, updates: Partial<DesignLayer>) => void;
  onAddTextLayer: (text: string, style: Partial<DesignLayer>) => void;
}

const FONT_FAMILIES = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Impact', label: 'Impact' },
  { value: 'Comic Sans MS', label: 'Comic Sans' },
  { value: 'Trebuchet MS', label: 'Trebuchet' },
  { value: 'Courier New', label: 'Courier' },
];

const PRESET_TEXTS = [
  { label: 'Team Name', text: 'RISE AS ONE', style: { fontSize: 32, fontWeight: 'bold', color: '#DC2626' } },
  { label: 'Player Number', text: '23', style: { fontSize: 48, fontWeight: 'bold', color: '#000000' } },
  { label: 'Player Name', text: 'JOHNSON', style: { fontSize: 24, fontWeight: 'bold', color: '#000000' } },
  { label: 'Slogan', text: 'BASKETBALL FACTORY', style: { fontSize: 18, fontWeight: 'normal', color: '#1F2937' } },
  { label: 'Year', text: '2024', style: { fontSize: 20, fontWeight: 'bold', color: '#6B7280' } },
];

const COLOR_PRESETS = [
  '#000000', '#FFFFFF', '#DC2626', '#EA580C', '#CA8A04', '#16A34A',
  '#0891B2', '#2563EB', '#7C3AED', '#DB2777', '#6B7280', '#1F2937',
];

export function TextEditorPanel({
  selectedLayer,
  onUpdateLayer,
  onAddTextLayer,
}: TextEditorPanelProps) {
  const [newText, setNewText] = useState('');
  const isTextLayer = selectedLayer?.type === 'text';

  const handleAddText = () => {
    if (newText.trim()) {
      onAddTextLayer(newText.trim(), {
        fontFamily: 'Arial',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'center',
      });
      setNewText('');
    }
  };

  const handlePresetClick = (preset: typeof PRESET_TEXTS[0]) => {
    onAddTextLayer(preset.text, {
      fontFamily: 'Arial',
      ...preset.style,
      textAlign: 'center',
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Type className="h-4 w-4" />
          Text Editor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Text */}
        <div className="space-y-2">
          <Label className="text-xs">Add Custom Text</Label>
          <div className="flex gap-2">
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Enter text..."
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
            />
            <Button size="sm" onClick={handleAddText} disabled={!newText.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <Label className="text-xs flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Quick Presets
          </Label>
          <div className="flex flex-wrap gap-1">
            {PRESET_TEXTS.map((preset, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Text Layer Properties */}
        {isTextLayer && selectedLayer && (
          <>
            <div className="border-t pt-3 space-y-3">
              <Label className="text-xs font-medium">Edit Selected Text</Label>
              
              {/* Text Content */}
              <Input
                value={selectedLayer.content || ''}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { content: e.target.value })}
                className="h-8 text-sm"
              />

              {/* Font Family */}
              <div>
                <Label className="text-xs">Font</Label>
                <Select
                  value={selectedLayer.fontFamily || 'Arial'}
                  onValueChange={(v) => onUpdateLayer(selectedLayer.id, { fontFamily: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map(font => (
                      <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Font Size */}
              <div>
                <Label className="text-xs">Size: {selectedLayer.fontSize || 24}px</Label>
                <Slider
                  value={[selectedLayer.fontSize || 24]}
                  onValueChange={([v]) => onUpdateLayer(selectedLayer.id, { fontSize: v })}
                  min={8}
                  max={120}
                  step={1}
                  className="mt-1"
                />
              </div>

              {/* Font Style */}
              <div className="flex items-center gap-1">
                <Toggle
                  pressed={selectedLayer.fontWeight === 'bold'}
                  onPressedChange={(p) => onUpdateLayer(selectedLayer.id, { fontWeight: p ? 'bold' : 'normal' })}
                  size="sm"
                >
                  <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle
                  pressed={selectedLayer.textAlign === 'left'}
                  onPressedChange={() => onUpdateLayer(selectedLayer.id, { textAlign: 'left' })}
                  size="sm"
                >
                  <AlignLeft className="h-4 w-4" />
                </Toggle>
                <Toggle
                  pressed={selectedLayer.textAlign === 'center'}
                  onPressedChange={() => onUpdateLayer(selectedLayer.id, { textAlign: 'center' })}
                  size="sm"
                >
                  <AlignCenter className="h-4 w-4" />
                </Toggle>
                <Toggle
                  pressed={selectedLayer.textAlign === 'right'}
                  onPressedChange={() => onUpdateLayer(selectedLayer.id, { textAlign: 'right' })}
                  size="sm"
                >
                  <AlignRight className="h-4 w-4" />
                </Toggle>
              </div>

              {/* Color Picker */}
              <div>
                <Label className="text-xs">Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0 border-2"
                        style={{ backgroundColor: selectedLayer.color || '#000000' }}
                      >
                        <span className="sr-only">Pick color</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3">
                      <div className="grid grid-cols-6 gap-1">
                        {COLOR_PRESETS.map(color => (
                          <button
                            key={color}
                            className="h-6 w-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                            style={{ backgroundColor: color }}
                            onClick={() => onUpdateLayer(selectedLayer.id, { color })}
                          />
                        ))}
                      </div>
                      <Input
                        type="color"
                        value={selectedLayer.color || '#000000'}
                        onChange={(e) => onUpdateLayer(selectedLayer.id, { color: e.target.value })}
                        className="h-8 w-full mt-2"
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    value={selectedLayer.color || '#000000'}
                    onChange={(e) => onUpdateLayer(selectedLayer.id, { color: e.target.value })}
                    className="h-8 text-xs flex-1"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* No Text Layer Selected */}
        {!isTextLayer && (
          <div className="text-center py-4 text-muted-foreground text-xs">
            Select a text layer to edit its properties, or add new text above.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

