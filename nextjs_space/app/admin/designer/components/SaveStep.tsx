'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DesignerState, DesignerStep } from '../types';

interface SaveStepProps {
  state: DesignerState;
  setStep: (step: DesignerStep) => void;
}

/**
 * SaveStep Component
 * 
 * Step 4 of the designer workflow - review and save/publish the design.
 */
export function SaveStep({ state, setStep }: SaveStepProps) {
  const [saving, setSaving] = useState(false);

  if (!state.product) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
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
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Save Your Design</h2>
        <p className="text-gray-600">Review and publish your custom product</p>
      </div>
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <SummaryItem label="Product" value={state.product.name} />
            <SummaryItem
              label="Color"
              value={
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: state.customColor || state.color.hex }}
                  />
                  <span className="font-semibold">
                    {state.customColor ? 'Custom' : state.color.name}
                  </span>
                </div>
              }
            />
            <SummaryItem label="Design Name" value={state.designName} />
            <SummaryItem label="Sizes" value={`${state.selectedSizes.length} sizes selected`} />
            <SummaryItem label="Elements" value={`${state.elements.length} design elements`} />
            <SummaryItem
              label="Price"
              value={<span className="text-primary">${state.product.basePrice}</span>}
            />
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              className="w-full h-12 text-lg"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" /> Save Design
                </>
              )}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setStep('options')}>
              <ChevronLeft className="w-4 h-4 mr-2" /> Back to Options
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SummaryItemProps {
  label: string;
  value: React.ReactNode;
}

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div>
      <span className="text-sm text-gray-500">{label}</span>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

export default SaveStep;

