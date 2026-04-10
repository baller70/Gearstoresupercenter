'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MockupProduct } from '@/lib/mockup-system';
import { DesignerState, DesignerStep } from '../types';
import { ProductColorOverlay } from './ProductColorOverlay';

/** Standard apparel sizes */
export const APPAREL_SIZES = [
  { id: 'xs', name: 'XS', displayName: 'Extra Small' },
  { id: 's', name: 'S', displayName: 'Small' },
  { id: 'm', name: 'M', displayName: 'Medium' },
  { id: 'l', name: 'L', displayName: 'Large' },
  { id: 'xl', name: 'XL', displayName: 'Extra Large' },
  { id: '2xl', name: '2XL', displayName: '2X Large' },
  { id: '3xl', name: '3XL', displayName: '3X Large' },
  { id: '4xl', name: '4XL', displayName: '4X Large' },
];

interface OptionsStepProps {
  state: DesignerState;
  updateState: (updates: Partial<DesignerState>) => void;
  setStep: (step: DesignerStep) => void;
}

/**
 * OptionsStep Component
 *
 * Step 3 of the designer workflow - configure design name, sizes, and pricing.
 */
export function OptionsStep({ state, updateState, setStep }: OptionsStepProps) {
  if (!state.product) return null;

  const productColor = state.customColor || state.color.hex;
  const mockupUrl = state.product.views.find(v => v.angle === state.view)?.mockupUrl || state.product.thumbnailUrl || '';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Configure Options</h2>
        <p className="text-gray-600">Set sizes and pricing for your design</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Preview */}
        <Card>
          <CardContent className="p-6">
            <div className="aspect-[3/4] bg-white rounded-lg overflow-hidden relative">
              <ProductColorOverlay
                mockupUrl={mockupUrl}
                productName={state.product.name}
                color={productColor}
              />
              {/* Design Elements Preview */}
              <div className="absolute inset-0">
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
                      <div style={{
                        fontFamily: el.fontFamily,
                        fontSize: `${(el.fontSize || 24) * 0.5}px`,
                        fontWeight: el.fontWeight,
                        color: el.fill
                      }}>
                        {el.text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 text-center">
              <Badge variant="secondary" className="text-lg px-4 py-1">
                {state.product.name} - {state.customColor ? 'Custom' : state.color.name}
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
          <SizeSelector
            selectedSizes={state.selectedSizes}
            onSizeToggle={(sizeId) => {
              updateState({
                selectedSizes: state.selectedSizes.includes(sizeId)
                  ? state.selectedSizes.filter(s => s !== sizeId)
                  : [...state.selectedSizes, sizeId]
              });
            }}
            onSelectAll={() => updateState({ selectedSizes: APPAREL_SIZES.map(s => s.id) })}
          />

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
  );
}

interface SizeSelectorProps {
  selectedSizes: string[];
  onSizeToggle: (sizeId: string) => void;
  onSelectAll: () => void;
}

function SizeSelector({ selectedSizes, onSizeToggle, onSelectAll }: SizeSelectorProps) {
  return (
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
                selectedSizes.includes(size.id)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSizeToggle(size.id)}
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
          onClick={onSelectAll}
        >
          Select All Sizes
        </Button>
      </CardContent>
    </Card>
  );
}

export default OptionsStep;

