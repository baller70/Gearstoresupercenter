'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Move, Lock, Unlock, ChevronRight, ChevronLeft } from 'lucide-react';
import { DesignElement, DesignerState, DesignerStep } from '../types';

interface PropertiesPanelProps {
  selectedElement: DesignElement | undefined;
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
  state: DesignerState;
  updateState: (updates: Partial<DesignerState>) => void;
  setStep: (step: DesignerStep) => void;
}

/**
 * PropertiesPanel Component
 * 
 * Right sidebar for editing selected element properties
 * and navigation between designer steps.
 */
export function PropertiesPanel({
  selectedElement,
  updateElement,
  state,
  updateState,
  setStep,
}: PropertiesPanelProps) {
  return (
    <>
      {selectedElement ? (
        <ElementPropertiesCard
          element={selectedElement}
          updateElement={updateElement}
        />
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

interface ElementPropertiesCardProps {
  element: DesignElement;
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
}

function ElementPropertiesCard({ element, updateElement }: ElementPropertiesCardProps) {
  return (
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
              value={[element.x]}
              onValueChange={([v]) => updateElement(element.id, { x: v })}
              min={0} max={100} step={1}
            />
          </div>
          <div>
            <Label className="text-xs">Y Position</Label>
            <Slider
              value={[element.y]}
              onValueChange={([v]) => updateElement(element.id, { y: v })}
              min={0} max={100} step={1}
            />
          </div>
        </div>

        {/* Size */}
        <div>
          <Label className="text-xs">Size: {element.width}%</Label>
          <Slider
            value={[element.width]}
            onValueChange={([v]) => updateElement(element.id, { width: v })}
            min={5} max={80} step={1}
          />
        </div>

        {/* Rotation */}
        <div>
          <Label className="text-xs">Rotation: {element.rotation}°</Label>
          <Slider
            value={[element.rotation]}
            onValueChange={([v]) => updateElement(element.id, { rotation: v })}
            min={-180} max={180} step={1}
          />
        </div>

        {/* Opacity */}
        <div>
          <Label className="text-xs">Opacity: {element.opacity}%</Label>
          <Slider
            value={[element.opacity]}
            onValueChange={([v]) => updateElement(element.id, { opacity: v })}
            min={10} max={100} step={1}
          />
        </div>

        {/* Text Properties */}
        {element.type === 'text' && (
          <TextProperties element={element} updateElement={updateElement} />
        )}

        {/* Lock */}
        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-sm">Lock Element</span>
          <Button
            variant={element.locked ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateElement(element.id, { locked: !element.locked })}
          >
            {element.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface TextPropertiesProps {
  element: DesignElement;
  updateElement: (id: string, updates: Partial<DesignElement>) => void;
}

function TextProperties({ element, updateElement }: TextPropertiesProps) {
  return (
    <>
      <div className="pt-3 border-t">
        <Label className="text-xs">Text Content</Label>
        <Input
          value={element.text || ''}
          onChange={(e) => updateElement(element.id, { text: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs">Font Size: {element.fontSize || 24}px</Label>
        <Slider
          value={[element.fontSize || 24]}
          onValueChange={([v]) => updateElement(element.id, { fontSize: v })}
          min={12} max={72} step={1}
        />
      </div>
      <div className="flex items-center gap-2">
        <Label className="text-xs">Color:</Label>
        <Input
          type="color"
          value={element.fill || '#000000'}
          onChange={(e) => updateElement(element.id, { fill: e.target.value })}
          className="w-10 h-8 p-1"
        />
      </div>
    </>
  );
}

export default PropertiesPanel;

