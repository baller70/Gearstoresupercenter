
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, Sparkles, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomizePage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      toast.error('Please sign in to submit a customization request');
      router.push('/auth/signin');
      return;
    }

    if (!notes.trim()) {
      toast.error('Please describe your design ideas');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      formData.append('notes', notes);

      const response = await fetch('/api/customization', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setAiSuggestions(data.customization.aiSuggestions);
        setShowSuccess(true);
        toast.success('Customization request submitted successfully!');
      } else {
        toast.error(data.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit customization request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  if (showSuccess && aiSuggestions) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              <CardTitle>Request Submitted Successfully!</CardTitle>
            </div>
            <CardDescription>
              Our team will review your customization request and get back to you within 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">AI-Powered Suggestions:</div>
                <div className="whitespace-pre-wrap text-sm">
                  {aiSuggestions.suggestions}
                </div>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Estimated Time</div>
                <div className="text-lg font-semibold">{aiSuggestions.estimatedDays} days</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Price Range</div>
                <div className="text-lg font-semibold">{aiSuggestions.priceRange}</div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => router.push('/account')} className="flex-1">
                View My Requests
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuccess(false);
                  setAiSuggestions(null);
                  setFile(null);
                  setNotes('');
                }}
                className="flex-1"
              >
                Submit Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Custom Design Request</h1>
          <p className="text-muted-foreground">
            Tell us about your custom basketball apparel design and let our AI assist you!
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Design Details</CardTitle>
            <CardDescription>
              Upload a design file (optional) and describe your vision
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="file">Design File (Optional)</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <Input
                    id="file"
                    type="file"
                    accept="image/*,.pdf,.ai,.psd"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Label htmlFor="file" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    {file ? (
                      <p className="text-sm font-medium">{file.name}</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium">Click to upload design file</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, PDF, AI, or PSD (Max 10MB)
                        </p>
                      </>
                    )}
                  </Label>
                </div>
              </div>

              {/* Design Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Design Description *</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe your custom design ideas...&#10;&#10;Include details like:&#10;- Colors you want&#10;- Text or logos&#10;- Placement preferences&#10;- Product type (jersey, hoodie, etc.)&#10;- Any special requirements"
                  rows={10}
                  required
                />
              </div>

              {/* Info Alert */}
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Our AI will analyze your request and provide instant design suggestions,
                  pricing estimates, and timeline information!
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting || !notes.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Submit Custom Request
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By submitting, you agree to our terms. We&apos;ll contact you within 24 hours.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Response</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Get AI-powered suggestions instantly and human review within 24 hours
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Professional Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                All designs are professionally printed on premium basketball apparel
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Fair Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Transparent pricing with no hidden fees. Pay only for what you order
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
