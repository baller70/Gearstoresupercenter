
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface LogoPositionPreviewProps {
  logoFile: File | null;
  garmentType: string;
  brand: string;
  onPositionChange: (position: { x: number; y: number; scale: number }) => void;
  onAnalyze: () => void;
}

const BRAND_COLORS = {
  'rise-as-one': [
    { name: 'Black', hex: '#000000', textColor: 'text-white' },
    { name: 'White', hex: '#FFFFFF', textColor: 'text-black' },
    { name: 'Red', hex: '#DC2626', textColor: 'text-white' },
    { name: 'Grey', hex: '#6B7280', textColor: 'text-white' }
  ],
  'basketball-factory': [
    { name: 'White', hex: '#FFFFFF', textColor: 'text-black' },
    { name: 'Black', hex: '#000000', textColor: 'text-white' },
    { name: 'Navy', hex: '#1E3A8A', textColor: 'text-white' },
    { name: 'Gold', hex: '#F59E0B', textColor: 'text-black' }
  ]
};

export function LogoPositionPreview({
  logoFile,
  garmentType,
  brand,
  onPositionChange,
  onAnalyze
}: LogoPositionPreviewProps) {
  const [position, setPosition] = useState({ x: 50, y: 35, scale: 1 });
  const [selectedColor, setSelectedColor] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');

  const colors = BRAND_COLORS[brand as keyof typeof BRAND_COLORS] || BRAND_COLORS['rise-as-one'];

  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile);
      setLogoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [logoFile]);

  useEffect(() => {
    onPositionChange(position);
  }, [position, onPositionChange]);

  const handleAnalyze = async () => {
    if (!logoFile) return;

    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      formData.append('garmentType', garmentType);
      formData.append('x', position.x.toString());
      formData.append('y', position.y.toString());

      const response = await fetch('/api/admin/designs/analyze-position', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      if (data.success && data.analysis) {
        setPosition({
          x: data.analysis.x,
          y: data.analysis.y,
          scale: data.analysis.scale
        });
        setAiRecommendation(data.analysis.recommendation);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  if (!logoFile) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          Upload a logo to preview positioning
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Color Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Preview on Colors
        </label>
        <div className="flex gap-2">
          {colors.map((color, index) => (
            <button
              key={color.name}
              onClick={() => setSelectedColor(index)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                selectedColor === index
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div
                className="w-6 h-6 rounded-full border border-gray-300"
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-sm">{color.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Position Preview</h3>
          <Button
            onClick={handleAnalyze}
            disabled={analyzing}
            variant="outline"
            size="sm"
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                AI Optimize
              </>
            )}
          </Button>
        </div>

        {/* Garment Preview */}
        <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: colors[selectedColor].hex }}
          >
            {/* Garment outline/shape indicator */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <div className={`text-6xl ${colors[selectedColor].textColor}`}>
                {garmentType === 'jersey' ? '👔' : 
                 garmentType === 'hoodie' ? '🧥' : 
                 garmentType === 'shorts' ? '🩳' : '👕'}
              </div>
            </div>

            {/* Logo positioning */}
            <div
              className="absolute"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: `translate(-50%, -50%) scale(${position.scale})`,
                width: '120px',
                height: '120px'
              }}
            >
              <div className="relative w-full h-full">
                <Image
                  src={logoUrl}
                  alt="Logo preview"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Chest area guide */}
            <div className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2 w-32 h-24 border-2 border-dashed border-blue-500/30 rounded pointer-events-none">
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-blue-500 font-medium">
                Optimal Chest Area
              </span>
            </div>
          </div>
        </div>

        {aiRecommendation && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">AI Recommendation</p>
                <p className="text-sm text-blue-700 mt-1">{aiRecommendation}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Position Controls */}
      <Card className="p-6 space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Horizontal Position</label>
            <Badge variant="secondary">{position.x}%</Badge>
          </div>
          <Slider
            value={[position.x]}
            onValueChange={([x]) => setPosition({ ...position, x })}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Vertical Position</label>
            <Badge variant="secondary">{position.y}%</Badge>
          </div>
          <Slider
            value={[position.y]}
            onValueChange={([y]) => setPosition({ ...position, y })}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Logo Size</label>
            <Badge variant="secondary">{position.scale.toFixed(2)}x</Badge>
          </div>
          <Slider
            value={[position.scale * 100]}
            onValueChange={([scale]) => setPosition({ ...position, scale: scale / 100 })}
            min={50}
            max={200}
            step={5}
            className="w-full"
          />
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> For best results, keep the logo centered horizontally (50%) 
            and positioned in the chest area (30-40% vertically).
          </p>
        </div>
      </Card>
    </div>
  );
}
