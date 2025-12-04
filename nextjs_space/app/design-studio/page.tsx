
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, Sparkles, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function DesignStudioPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [designName, setDesignName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDesignId, setUploadedDesignId] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'processing' | 'editor'>('upload');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a logo file');
      return;
    }
    
    if (!designName.trim()) {
      toast.error('Please enter a design name');
      return;
    }
    
    if (!session?.user) {
      toast.error('Please sign in to upload a logo');
      router.push('/auth/signin');
      return;
    }

    setIsUploading(true);
    setStep('processing');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', designName);
      formData.append('brand', 'Rise as One AAU'); // Default brand

      const response = await fetch('/api/design-studio/upload-logo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadedDesignId(data.designId);
        toast.success('Logo uploaded successfully!');
        
        // Move to editor step after a brief delay
        setTimeout(() => {
          setStep('editor');
          router.push(`/design-studio/editor/${data.designId}`);
        }, 1500);
      } else {
        toast.error(data.error || 'Failed to upload logo');
        setStep('upload');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload logo');
      setStep('upload');
    } finally {
      setIsUploading(false);
    }
  };

  if (step === 'processing') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-16 text-center">
            <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />
            <h3 className="text-xl font-semibold mb-2">Processing Your Logo</h3>
            <p className="text-muted-foreground mb-6">
              We&apos;re analyzing your logo and preparing it for mockup generation...
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Analyzing logo dimensions and quality</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Preparing product templates</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Setting up mockup editor</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Design Studio</h1>
          <p className="text-muted-foreground">
            Upload your logo and create custom basketball apparel with AI-powered mockups
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8 gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
              1
            </div>
            <span className="font-medium">Upload Logo</span>
          </div>
          <div className="w-16 h-0.5 bg-muted" />
          <div className="flex items-center gap-2 opacity-50">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-semibold">
              2
            </div>
            <span className="font-medium">Choose Products</span>
          </div>
          <div className="w-16 h-0.5 bg-muted" />
          <div className="flex items-center gap-2 opacity-50">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground font-semibold">
              3
            </div>
            <span className="font-medium">Edit & Preview</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Your Logo</CardTitle>
              <CardDescription>
                Upload a high-quality PNG or SVG file for best results
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="designName">Design Name</Label>
                <Input
                  id="designName"
                  placeholder="e.g., Rise As One AAU Logo"
                  value={designName}
                  onChange={(e) => setDesignName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Logo File</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <Input
                    id="file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Label htmlFor="file" className="cursor-pointer">
                    {preview ? (
                      <div className="space-y-2">
                        <div className="relative w-32 h-32 mx-auto">
                          <Image
                            src={preview}
                            alt="Logo preview"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <p className="text-sm font-medium">{file?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Click to change
                        </p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Click to upload logo</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, or SVG (Max 10MB)
                        </p>
                      </>
                    )}
                  </Label>
                </div>
              </div>

              <Button
                onClick={handleUpload}
                className="w-full"
                size="lg"
                disabled={isUploading || !file || !designName.trim()}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start Creating Mockups
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What Happens Next?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">AI Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      Our AI analyzes your logo for optimal placement and size
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Product Templates</h4>
                    <p className="text-sm text-muted-foreground">
                      Choose from t-shirts, hoodies, jerseys, and more
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Color Variants</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatically generate 4 color variants (red, black, white, grey)
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Manual Editor</h4>
                    <p className="text-sm text-muted-foreground">
                      Fine-tune position, size, and add multiple logos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                <strong>Pro Tip:</strong> Use a transparent PNG with your logo on a clear background for the best mockup quality.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}
