
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Key, RefreshCw, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ApiCredentials {
  consumerKey: string;
  consumerSecret: string;
  storeUrl: string;
  createdAt: string;
}

export default function WooCommerceIntegration() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [credentials, setCredentials] = useState<ApiCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchCredentials();
  }, [session, status, router]);

  const fetchCredentials = async () => {
    try {
      const response = await fetch('/api/admin/woocommerce/credentials');
      if (response.ok) {
        const data = await response.json();
        setCredentials(data);
      }
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateCredentials = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/admin/woocommerce/credentials', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setCredentials(data);
        toast.success('API credentials generated successfully!');
      } else {
        toast.error('Failed to generate credentials');
      }
    } catch (error) {
      console.error('Failed to generate credentials:', error);
      toast.error('Failed to generate credentials');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">WooCommerce API Integration</h1>
        <p className="text-muted-foreground">
          Connect your custom store to print-on-demand companies that use WooCommerce plugins
        </p>
      </div>

      <Alert className="mb-8">
        <Key className="h-4 w-4" />
        <AlertDescription>
          Your custom Next.js store now has WooCommerce-compatible REST API endpoints. 
          POD companies can connect to your store as if it were a WooCommerce site.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
          <CardDescription>
            Use these credentials to connect POD companies to your store
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!credentials ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No API Credentials Yet</h3>
              <p className="text-muted-foreground mb-6">
                Generate credentials to allow POD companies to connect to your store
              </p>
              <Button onClick={generateCredentials} disabled={generating}>
                {generating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Generate Credentials
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Store URL */}
              <div>
                <label className="block text-sm font-medium mb-2">Store URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={credentials.storeUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-md bg-muted font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(credentials.storeUrl, 'Store URL')}
                  >
                    {copied === 'Store URL' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Consumer Key */}
              <div>
                <label className="block text-sm font-medium mb-2">Consumer Key</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={credentials.consumerKey}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-md bg-muted font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(credentials.consumerKey, 'Consumer Key')}
                  >
                    {copied === 'Consumer Key' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Consumer Secret */}
              <div>
                <label className="block text-sm font-medium mb-2">Consumer Secret</label>
                <div className="flex gap-2">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={credentials.consumerSecret}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-md bg-muted font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(credentials.consumerSecret, 'Consumer Secret')}
                  >
                    {copied === 'Consumer Secret' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <p className="font-semibold mb-2">How to use these credentials:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Copy the Store URL, Consumer Key, and Consumer Secret above</li>
                    <li>Go to your POD company's integration settings</li>
                    <li>Select "WooCommerce" as the platform</li>
                    <li>Paste the Store URL when asked for your WooCommerce site URL</li>
                    <li>Paste the Consumer Key and Consumer Secret in their respective fields</li>
                    <li>Save the integration - your POD company can now sync orders!</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button variant="outline" onClick={generateCredentials} disabled={generating}>
                  {generating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate Credentials
                    </>
                  )}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground mt-4">
                Created: {new Date(credentials.createdAt).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Endpoints Card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Available API Endpoints</CardTitle>
          <CardDescription>
            Your store now supports these WooCommerce-compatible endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">GET</span>
              <code>/wp-json/wc/v3/orders</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">GET</span>
              <code>/wp-json/wc/v3/orders/{'{'} id{'}'}</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">PUT</span>
              <code>/wp-json/wc/v3/orders/{'{'}id{'}'}</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">GET</span>
              <code>/wp-json/wc/v3/products</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">GET</span>
              <code>/wp-json/wc/v3/products/{'{'}id{'}'}</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
