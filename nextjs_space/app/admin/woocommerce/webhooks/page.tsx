
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2, Plus, Check, AlertCircle } from 'lucide-react';

interface Webhook {
  id: string;
  name: string;
  topic: string;
  deliveryUrl: string;
  status: 'active' | 'paused';
  createdAt: string;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [newWebhook, setNewWebhook] = useState({
    name: 'Jetprint Order Fulfillment',
    topic: 'order.created',
    deliveryUrl: '',
  });

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/admin/webhooks');
      if (response.ok) {
        const data = await response.json();
        setWebhooks(data.webhooks || []);
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!newWebhook.deliveryUrl) {
      toast.error('Please enter a delivery URL');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/admin/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWebhook),
      });

      if (response.ok) {
        const data = await response.json();
        setWebhooks([...webhooks, data.webhook]);
        toast.success('Webhook created successfully');
        setNewWebhook({
          name: 'Jetprint Order Fulfillment',
          topic: 'order.created',
          deliveryUrl: '',
        });
      } else {
        toast.error('Failed to create webhook');
      }
    } catch (error) {
      toast.error('Error creating webhook');
    } finally {
      setCreating(false);
    }
  };

  const deleteWebhook = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/webhooks/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWebhooks(webhooks.filter(w => w.id !== id));
        toast.success('Webhook deleted');
      } else {
        toast.error('Failed to delete webhook');
      }
    } catch (error) {
      toast.error('Error deleting webhook');
    }
  };

  const testWebhook = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/webhooks/${id}/test`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Test webhook sent successfully');
      } else {
        toast.error('Failed to send test webhook');
      }
    } catch (error) {
      toast.error('Error testing webhook');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Webhook Management</h1>
        <p className="text-muted-foreground mt-2">
          Configure webhooks to automatically send order notifications to Jetprint and other POD services
        </p>
      </div>

      {/* Create New Webhook */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create New Webhook</CardTitle>
          <CardDescription>
            Set up automatic order notifications for your print-on-demand service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Webhook Name</Label>
              <Input
                id="name"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                placeholder="Jetprint Order Fulfillment"
              />
            </div>

            <div>
              <Label htmlFor="topic">Event Topic</Label>
              <Select 
                value={newWebhook.topic} 
                onValueChange={(value) => setNewWebhook({ ...newWebhook, topic: value })}
              >
                <SelectTrigger id="topic">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order.created">Order Created</SelectItem>
                  <SelectItem value="order.updated">Order Updated</SelectItem>
                  <SelectItem value="order.completed">Order Completed</SelectItem>
                  <SelectItem value="order.cancelled">Order Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="deliveryUrl">Delivery URL</Label>
            <Input
              id="deliveryUrl"
              value={newWebhook.deliveryUrl}
              onChange={(e) => setNewWebhook({ ...newWebhook, deliveryUrl: e.target.value })}
              placeholder="https://api.jetprint.com/webhooks/orders"
              type="url"
            />
            <p className="text-sm text-muted-foreground mt-1">
              The URL where webhook notifications will be sent
            </p>
          </div>

          <Button onClick={createWebhook} disabled={creating}>
            <Plus className="mr-2 h-4 w-4" />
            Create Webhook
          </Button>
        </CardContent>
      </Card>

      {/* Existing Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle>Active Webhooks</CardTitle>
          <CardDescription>
            Manage your configured webhooks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading webhooks...
            </div>
          ) : webhooks.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No webhooks configured yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Create your first webhook to start automatic order fulfillment
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{webhook.name}</h3>
                      <Badge variant={webhook.status === 'active' ? 'default' : 'secondary'}>
                        {webhook.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Topic: <span className="font-medium">{webhook.topic}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      URL: <span className="font-mono text-xs">{webhook.deliveryUrl}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(webhook.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testWebhook(webhook.id)}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Test
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteWebhook(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Jetprint Integration Guide */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Jetprint Integration Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Step 1: Get Your Jetprint Webhook URL</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Log into your Jetprint account</li>
              <li>Go to Settings → Integrations</li>
              <li>Copy your webhook URL (usually looks like: https://api.jetprint.com/webhooks/YOUR_ID)</li>
            </ol>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Step 2: Create Webhook</h4>
            <p className="text-sm text-muted-foreground">
              Use the form above to create a webhook with:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-2">
              <li>Topic: "Order Created" (for new orders)</li>
              <li>Delivery URL: Your Jetprint webhook URL from Step 1</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Step 3: Test the Integration</h4>
            <p className="text-sm text-muted-foreground">
              Click the "Test" button on your webhook to send a test order notification to Jetprint
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
