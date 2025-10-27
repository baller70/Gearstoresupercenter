
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Ruler } from 'lucide-react';

interface SizeGuideItem {
  id: string;
  category: string;
  sizeName: string;
  chest: string;
  waist: string;
  hip?: string;
  length: string;
  weight?: string;
  height?: string;
  fitType: string;
}

interface SizeRecommendation {
  recommendedSize: string;
  confidence: string;
  reasoning: string;
  alternativeSizes: string[];
  fitTips: string;
}

export default function SizeGuidePage() {
  const { data: session } = useSession();
  const [sizeGuides, setSizeGuides] = useState<SizeGuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<SizeRecommendation | null>(null);
  const [activeTab, setActiveTab] = useState('find-size');
  
  // Form state
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [preferredFit, setPreferredFit] = useState('REGULAR');
  const [category, setCategory] = useState('PERFORMANCE_APPAREL');

  useEffect(() => {
    fetchSizeGuides();
  }, []);

  const fetchSizeGuides = async () => {
    try {
      const response = await fetch('/api/size-guide');
      if (!response.ok) throw new Error('Failed to fetch size guides');
      const data = await response.json();
      setSizeGuides(data);
    } catch (error) {
      console.error('Error fetching size guides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRecommendation = async () => {
    if (!height || !weight) {
      alert('Please provide at least height and weight');
      return;
    }

    setRecommendationLoading(true);
    try {
      const response = await fetch('/api/size-guide/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          height: parseFloat(height),
          weight: parseFloat(weight),
          chest: chest ? parseFloat(chest) : null,
          waist: waist ? parseFloat(waist) : null,
          preferredFit,
          category,
        }),
      });

      if (!response.ok) throw new Error('Failed to get recommendation');
      const data = await response.json();
      setRecommendation(data);
    } catch (error) {
      console.error('Error getting recommendation:', error);
      alert('Failed to get size recommendation');
    } finally {
      setRecommendationLoading(false);
    }
  };

  const groupedSizeGuides = sizeGuides.reduce((acc, guide) => {
    if (!acc[guide.category]) {
      acc[guide.category] = [];
    }
    acc[guide.category].push(guide);
    return acc;
  }, {} as Record<string, SizeGuideItem[]>);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Size Guide</h1>
          <p className="text-muted-foreground">
            Find your perfect fit with our AI-powered sizing assistant
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="find-size">Find Your Size</TabsTrigger>
            <TabsTrigger value="size-charts">Size Charts</TabsTrigger>
          </TabsList>

        <TabsContent value="find-size">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="w-5 h-5" />
                AI Size Recommendation
              </CardTitle>
              <CardDescription>
                Enter your measurements to get personalized size recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">Height (inches) *</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="e.g., 72"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    e.g., 6&apos;0&quot; = 72 inches
                  </p>
                </div>

                <div>
                  <Label htmlFor="weight">Weight (lbs) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="e.g., 180"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="chest">Chest (inches)</Label>
                  <Input
                    id="chest"
                    type="number"
                    placeholder="Optional"
                    value={chest}
                    onChange={(e) => setChest(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="waist">Waist (inches)</Label>
                  <Input
                    id="waist"
                    type="number"
                    placeholder="Optional"
                    value={waist}
                    onChange={(e) => setWaist(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="fit">Preferred Fit</Label>
                  <Select value={preferredFit} onValueChange={setPreferredFit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SLIM">Slim</SelectItem>
                      <SelectItem value="REGULAR">Regular</SelectItem>
                      <SelectItem value="RELAXED">Relaxed</SelectItem>
                      <SelectItem value="OVERSIZED">Oversized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Product Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERFORMANCE_APPAREL">Performance Apparel</SelectItem>
                      <SelectItem value="CASUAL_WEAR">Casual Wear</SelectItem>
                      <SelectItem value="ACCESSORIES">Accessories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGetRecommendation}
                disabled={recommendationLoading || !height || !weight}
                className="w-full md:w-auto"
              >
                {recommendationLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Get Size Recommendation
              </Button>

              {recommendation && (
                <Alert className="bg-primary/5 border-primary">
                  <AlertDescription>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">
                          Recommended Size: {recommendation.recommendedSize}
                        </span>
                        <Badge variant={
                          recommendation.confidence === 'high' ? 'default' :
                          recommendation.confidence === 'medium' ? 'secondary' : 'outline'
                        }>
                          {recommendation.confidence} confidence
                        </Badge>
                      </div>
                      <p className="text-sm">{recommendation.reasoning}</p>
                      {recommendation.alternativeSizes.length > 0 && (
                        <div>
                          <p className="text-sm font-medium">Alternative sizes:</p>
                          <p className="text-sm">{recommendation.alternativeSizes.join(', ')}</p>
                        </div>
                      )}
                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium">Fit Tips:</p>
                        <p className="text-sm">{recommendation.fitTips}</p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="size-charts">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSizeGuides).map(([category, guides]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle>{category.replace('_', ' ')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Size</TableHead>
                            <TableHead>Chest</TableHead>
                            <TableHead>Waist</TableHead>
                            <TableHead>Length</TableHead>
                            <TableHead>Fit Type</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {guides.map((guide) => (
                            <TableRow key={guide.id}>
                              <TableCell className="font-medium">{guide.sizeName}</TableCell>
                              <TableCell>{guide.chest}</TableCell>
                              <TableCell>{guide.waist}</TableCell>
                              <TableCell>{guide.length}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{guide.fitType}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
