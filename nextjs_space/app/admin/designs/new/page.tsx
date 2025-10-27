'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface AIAnalysis {
  placement: { score: number; feedback: string };
  size: { score: number; feedback: string };
  balance: { score: number; feedback: string };
  professional: { score: number; feedback: string };
  overallScore: number;
  recommendations: string[];
  approved: boolean;
}

interface MockupResult {
  type: string;
  path: string;
  analysis: AIAnalysis;
}

export default function NewDesignPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [mockups, setMockups] = useState<MockupResult[]>([]);
  const [averageScore, setAverageScore] = useState<number>(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoFile || !name) {
      setError('Please provide both design name and logo file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      formData.append('name', name);

      const response = await fetch('/api/admin/designs/upload-with-ai', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.error || 'Upload failed';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setMockups(data.mockups || []);
      setAverageScore(data.design?.averageScore || 0);
      setUploadComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload design');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 8) return <Badge className="bg-green-600">Excellent</Badge>;
    if (score >= 6) return <Badge className="bg-yellow-600">Good</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  if (uploadComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-yellow-500" />
                Vision AI Analysis Complete
              </h1>
              <p className="text-muted-foreground">
                Our AI has analyzed your logo placement across all product mockups
              </p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Overall Quality Score</span>
                  <span className={`text-4xl font-bold ${getScoreColor(averageScore)}`}>
                    {averageScore.toFixed(1)}/10
                  </span>
                </CardTitle>
                <CardDescription>
                  {averageScore >= 8 && "🎉 Excellent! Your design looks professional across all products."}
                  {averageScore >= 6 && averageScore < 8 && "👍 Good work! Minor adjustments could improve some mockups."}
                  {averageScore < 6 && "💡 Consider adjusting logo placement for better results."}
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {mockups.map((mockup) => (
                <Card key={mockup.type}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="capitalize">{mockup.type.replace(/-/g, ' ')}</span>
                      {getScoreBadge(mockup.analysis?.overallScore || 0)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                      <Image
                        src={mockup.path}
                        alt={mockup.type}
                        fill
                        className="object-contain"
                      />
                    </div>
                    
                    {mockup.analysis && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Placement:</span>
                          <span className={getScoreColor(mockup.analysis.placement?.score || 0)}>
                            {mockup.analysis.placement?.score || 0}/10
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span className={getScoreColor(mockup.analysis.size?.score || 0)}>
                            {mockup.analysis.size?.score || 0}/10
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Balance:</span>
                          <span className={getScoreColor(mockup.analysis.balance?.score || 0)}>
                            {mockup.analysis.balance?.score || 0}/10
                          </span>
                        </div>
                        
                        {mockup.analysis.recommendations && mockup.analysis.recommendations.length > 0 && (
                          <div className="pt-2 border-t">
                            <p className="font-medium mb-1">AI Recommendations:</p>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              {mockup.analysis.recommendations.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-4">
              <Button onClick={() => router.push('/admin/designs')} className="flex-1">
                <CheckCircle className="mr-2 h-4 w-4" />
                View All Designs
              </Button>
              <Button variant="outline" onClick={() => {
                setUploadComplete(false);
                setLogoFile(null);
                setLogoPreview(null);
                setName('');
                setMockups([]);
              }}>
                Upload Another Design
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-yellow-500" />
              AI-Powered Design Upload
            </h1>
            <p className="text-muted-foreground">
              Upload a logo and let Vision AI analyze placement quality across all products
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Design Details</CardTitle>
              <CardDescription>
                Our AI will analyze logo placement, size, and visual balance on real mockups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Design Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter design name (e.g., Rise as One Logo 2024)"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logo">Logo File</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    {logoPreview ? (
                      <div className="space-y-4">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="max-h-48 mx-auto"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setLogoFile(null);
                            setLogoPreview(null);
                          }}
                        >
                          Change Logo
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div>
                          <label
                            htmlFor="logo"
                            className="cursor-pointer text-primary hover:underline font-medium"
                          >
                            Choose a file
                          </label>
                          <p className="text-sm text-muted-foreground mt-1">
                            PNG, JPG or SVG (recommended: 500x500px transparent background)
                          </p>
                        </div>
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">What happens next:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>Logo placed on professional product mockups</li>
                        <li>Vision AI analyzes placement quality (0-10 score)</li>
                        <li>Get specific recommendations for each product</li>
                        <li>Review all mockups before publishing</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    disabled={uploading || !logoFile || !name}
                    className="flex-1"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Upload & Analyze with AI
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
