
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Sparkles, CheckCircle2, AlertCircle, Download, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface Mockup {
  id: string;
  productType: string;
  angle: string;
  color: string;
  mockupUrl: string;
  positionX: number;
  positionY: number;
  scale: number;
  approved: boolean;
}

interface Design {
  id: string;
  name: string;
  brand: string;
  logoUrl: string;
  status: string;
  mockupsGenerated: boolean;
  mockups: Mockup[];
}

export default function DesignEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession() || {};
  const [design, setDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('tshirt');
  const [selectedMockup, setSelectedMockup] = useState<Mockup | null>(null);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(35);
  const [scale, setScale] = useState(1.0);

  const productTypes = [
    { id: 'tshirt', name: 'T-Shirt', icon: '👕' },
    { id: 'jersey', name: 'Jersey', icon: '🏀' },
    { id: 'hoodie', name: 'Hoodie', icon: '🧥' },
    { id: 'shorts', name: 'Shorts', icon: '🩳' },
  ];

  const colors = [
    { id: 'black', name: 'Black', hex: '#000000' },
    { id: 'white', name: 'White', hex: '#FFFFFF' },
    { id: 'red', name: 'Red', hex: '#DC2626' },
    { id: 'grey', name: 'Grey', hex: '#6B7280' },
  ];

  useEffect(() => {
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }
    
    loadDesign();
  }, [params.id, session]);

  const loadDesign = async () => {
    try {
      const response = await fetch(`/api/design-studio/designs/${params.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setDesign(data.design);
        if (data.design.mockups?.length > 0) {
          setSelectedMockup(data.design.mockups[0]);
          setPositionX(data.design.mockups[0].positionX);
          setPositionY(data.design.mockups[0].positionY);
          setScale(data.design.mockups[0].scale);
        }
      } else {
        toast.error('Design not found');
        router.push('/design-studio');
      }
    } catch (error) {
      console.error('Failed to load design:', error);
      toast.error('Failed to load design');
    } finally {
      setLoading(false);
    }
  };

  const generateMockups = async () => {
    setGenerating(true);
    
    try {
      const response = await fetch(`/api/design-studio/generate-mockups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId: params.id,
          productTypes: [selectedProduct],
          positionX,
          positionY,
          scale,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Generated ${data.mockupsCreated} mockups!`);
        await loadDesign(); // Reload to see new mockups
      } else {
        toast.error(data.error || 'Failed to generate mockups');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate mockups');
    } finally {
      setGenerating(false);
    }
  };

  const updateMockupPosition = async () => {
    if (!selectedMockup) return;

    try {
      const response = await fetch(`/api/design-studio/update-position`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mockupId: selectedMockup.id,
          positionX,
          positionY,
          scale,
        }),
      });

      if (response.ok) {
        toast.success('Position updated! Regenerating mockup...');
        await generateMockups();
      } else {
        toast.error('Failed to update position');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update position');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading design editor...</p>
        </div>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Design not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{design.name} - Design Editor</h1>
        <p className="text-muted-foreground">
          Choose products, adjust logo position, and generate mockups
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Panel - Controls */}
        <div className="space-y-6">
          {/* Product Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>1. Choose Product</CardTitle>
              <CardDescription>Select the type of apparel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {productTypes.map((product) => (
                <Button
                  key={product.id}
                  variant={selectedProduct === product.id ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setSelectedProduct(product.id)}
                >
                  <span className="text-xl mr-2">{product.icon}</span>
                  {product.name}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Logo Position Controls */}
          <Card>
            <CardHeader>
              <CardTitle>2. Adjust Logo</CardTitle>
              <CardDescription>Position and size</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Horizontal Position ({positionX}%)</Label>
                <Slider
                  value={[positionX]}
                  onValueChange={(val) => setPositionX(val[0])}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Vertical Position ({positionY}%)</Label>
                <Slider
                  value={[positionY]}
                  onValueChange={(val) => setPositionY(val[0])}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Size ({(scale * 100).toFixed(0)}%)</Label>
                <Slider
                  value={[scale]}
                  onValueChange={(val) => setScale(val[0])}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                />
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            onClick={generateMockups}
            className="w-full"
            size="lg"
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Mockups...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Mockups
              </>
            )}
          </Button>
        </div>

        {/* Center Panel - Preview */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                See how your logo looks on {selectedProduct}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {design.mockups && design.mockups.length > 0 ? (
                <Tabs defaultValue={colors[0].id}>
                  <TabsList className="grid grid-cols-4 mb-4">
                    {colors.map((color) => (
                      <TabsTrigger key={color.id} value={color.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: color.hex }}
                          />
                          {color.name}
                        </div>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {colors.map((color) => {
                    const mockup = design.mockups.find(
                      (m) => m.productType === selectedProduct && m.color === color.id
                    );
                    return (
                      <TabsContent key={color.id} value={color.id}>
                        {mockup ? (
                          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                            <Image
                              src={`/api/images/proxy?path=${encodeURIComponent(mockup.mockupUrl)}`}
                              alt={`${selectedProduct} - ${color.name}`}
                              fill
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                            <p className="text-muted-foreground">
                              No mockup generated yet
                            </p>
                          </div>
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              ) : (
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Click "Generate Mockups" to create product previews
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>;
}
