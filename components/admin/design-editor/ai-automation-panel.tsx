'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sparkles, Wand2, Zap, Target, Palette, Layout, 
  ChevronDown, Loader2, CheckCircle, AlertCircle,
  RefreshCw, Copy, Layers, Type, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface AISuggestion {
  id: string;
  type: 'placement' | 'color' | 'size' | 'text' | 'layout';
  title: string;
  description: string;
  confidence: number;
  applied: boolean;
}

interface AIAutomationPanelProps {
  designId: string;
  logoUrl: string;
  productTypes: string[];
  onApplyPlacements: (placements: Record<string, any>) => void;
  onApplyColors: (colors: string[]) => void;
  onGenerateVariations: (variations: any[]) => void;
  onAddTextLayer: (text: string, style: any) => void;
}

export function AIAutomationPanel({
  designId,
  logoUrl,
  productTypes,
  onApplyPlacements,
  onApplyColors,
  onGenerateVariations,
  onAddTextLayer,
}: AIAutomationPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(productTypes);
  const [expandedSections, setExpandedSections] = useState({
    quickActions: true,
    suggestions: true,
    bulkOps: false,
  });

  // AI Quick Actions
  const handleAutoPlaceAll = async () => {
    setIsGenerating(true);
    setProgress(0);
    setCurrentTask('Analyzing logo and products...');
    
    try {
      const placements: Record<string, any> = {};
      const total = selectedProducts.length * 3; // 3 angles per product
      let completed = 0;

      for (const product of selectedProducts) {
        for (const angle of ['front', 'back', 'side'] as const) {
          setCurrentTask(`Optimizing ${product} (${angle})...`);
          
          // Call AI to get optimal placement
          const response = await fetch('/api/admin/designs/ai-optimize-placement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ designId, productType: product, angle, logoUrl }),
          });

          if (response.ok) {
            const data = await response.json();
            placements[`${product}-${angle}`] = data.placement;
          }

          completed++;
          setProgress((completed / total) * 100);
        }
      }

      onApplyPlacements(placements);
      toast.success(`AI optimized placements for ${selectedProducts.length} products!`);
      
      // Generate suggestions
      await generateSuggestions();
    } catch (error) {
      console.error('AI placement error:', error);
      toast.error('Failed to generate AI placements');
    } finally {
      setIsGenerating(false);
      setCurrentTask('');
    }
  };

  const handleGenerateColorScheme = async () => {
    setIsGenerating(true);
    setCurrentTask('Analyzing logo colors...');
    
    try {
      const response = await fetch('/api/admin/designs/ai-color-scheme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designId, logoUrl }),
      });

      if (response.ok) {
        const data = await response.json();
        onApplyColors(data.colors);
        toast.success('AI generated complementary color scheme!');
      }
    } catch (error) {
      console.error('AI color error:', error);
      toast.error('Failed to generate color scheme');
    } finally {
      setIsGenerating(false);
      setCurrentTask('');
    }
  };

  const generateSuggestions = async () => {
    try {
      const response = await fetch('/api/admin/designs/ai-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designId }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(p => p !== productId)
        : [...prev, productId]
    );
  };

  // Content continues in next part due to size...
  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Sparkles className="h-5 w-5 text-purple-600" />
          AI Design Assistant
        </CardTitle>
        <CardDescription>Let AI handle 90% of your design work</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress indicator when generating */}
        {isGenerating && (
          <div className="space-y-2 p-3 bg-white/80 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              {currentTask}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Quick Actions Section */}
        <Collapsible open={expandedSections.quickActions} onOpenChange={() => toggleSection('quickActions')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-white/50 rounded-lg">
            <div className="flex items-center gap-2 font-medium text-purple-900">
              <Zap className="h-4 w-4" />
              Quick AI Actions
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.quickActions ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <Button
              onClick={handleAutoPlaceAll}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Auto-Place on All Products
            </Button>

            <Button
              onClick={handleGenerateColorScheme}
              disabled={isGenerating}
              variant="outline"
              className="w-full border-purple-300 hover:bg-purple-100"
            >
              <Palette className="mr-2 h-4 w-4" />
              Generate Color Scheme
            </Button>

            <Button
              onClick={() => {
                onAddTextLayer('RISE AS ONE', { fontSize: 24, fontWeight: 'bold', color: '#DC2626' });
              }}
              disabled={isGenerating}
              variant="outline"
              className="w-full border-purple-300 hover:bg-purple-100"
            >
              <Type className="mr-2 h-4 w-4" />
              Add Team Name Text
            </Button>

            <Button
              onClick={generateSuggestions}
              disabled={isGenerating}
              variant="outline"
              className="w-full border-purple-300 hover:bg-purple-100"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Get AI Suggestions
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* Product Selection for Bulk Operations */}
        <Collapsible open={expandedSections.bulkOps} onOpenChange={() => toggleSection('bulkOps')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-white/50 rounded-lg">
            <div className="flex items-center gap-2 font-medium text-purple-900">
              <Layers className="h-4 w-4" />
              Bulk Operations
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.bulkOps ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="text-xs text-muted-foreground mb-2">Select products for bulk AI operations:</div>
            <div className="grid grid-cols-2 gap-2">
              {productTypes.map(product => (
                <div key={product} className="flex items-center space-x-2">
                  <Checkbox
                    id={product}
                    checked={selectedProducts.includes(product)}
                    onCheckedChange={() => toggleProduct(product)}
                  />
                  <Label htmlFor={product} className="text-xs capitalize">
                    {product.replace(/-/g, ' ')}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedProducts(productTypes)} className="flex-1">
                Select All
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedProducts([])} className="flex-1">
                Clear All
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* AI Suggestions */}
        {suggestions.length > 0 && (
          <Collapsible open={expandedSections.suggestions} onOpenChange={() => toggleSection('suggestions')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-white/50 rounded-lg">
              <div className="flex items-center gap-2 font-medium text-purple-900">
                <Target className="h-4 w-4" />
                AI Suggestions
                <Badge variant="secondary" className="ml-1">{suggestions.length}</Badge>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.suggestions ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {suggestions.map(suggestion => (
                    <div
                      key={suggestion.id}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        suggestion.applied
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {suggestion.type === 'placement' && <Target className="h-3 w-3 text-blue-500" />}
                            {suggestion.type === 'color' && <Palette className="h-3 w-3 text-pink-500" />}
                            {suggestion.type === 'text' && <Type className="h-3 w-3 text-green-500" />}
                            {suggestion.type === 'layout' && <Layout className="h-3 w-3 text-orange-500" />}
                            <span className="text-sm font-medium">{suggestion.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {Math.round(suggestion.confidence * 100)}%
                          </Badge>
                          {suggestion.applied && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* AI Learning Tip */}
        <Alert className="bg-blue-50 border-blue-200">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-xs text-blue-800">
            <strong>AI Learning:</strong> Your manual adjustments teach the AI. Over time, it will match your preferences automatically!
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

