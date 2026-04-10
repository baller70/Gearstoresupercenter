
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/navigation';
import { Ticket, Plus, Edit, Trash2, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';

export default function DiscountsAdminPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minPurchase: '',
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  });

  useEffect(() => {
    if (status === 'unauthenticated' || (session?.user?.role !== 'ADMIN')) {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchDiscounts();
    }
  }, [status, session]);

  const fetchDiscounts = async () => {
    try {
      const response = await fetch('/api/admin/discounts');
      if (response.ok) {
        const data = await response.json();
        setDiscounts(data);
      }
    } catch (error) {
      console.error('Failed to fetch discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          discountValue: parseFloat(formData.discountValue),
          minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : null,
        }),
      });

      if (response.ok) {
        toast.success('Discount code created!');
        setIsDialogOpen(false);
        setFormData({
          code: '',
          description: '',
          discountType: 'PERCENTAGE',
          discountValue: '',
          minPurchase: '',
          validFrom: new Date().toISOString().slice(0, 16),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        });
        fetchDiscounts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create discount');
      }
    } catch (error) {
      toast.error('Failed to create discount');
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch('/api/admin/discounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !currentActive }),
      });

      if (response.ok) {
        toast.success(currentActive ? 'Discount deactivated' : 'Discount activated');
        fetchDiscounts();
      }
    } catch (error) {
      toast.error('Failed to update discount');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-6 h-6" />
              Discount Codes
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Discount
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Discount Code</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Code *</label>
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="WELCOME20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Type *</label>
                      <Select
                        value={formData.discountType}
                        onValueChange={(value) => setFormData({ ...formData, discountType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                          <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                          <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description *</label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="20% off for new customers"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {formData.discountType === 'PERCENTAGE' ? 'Percentage' : 'Amount'} *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                        placeholder={formData.discountType === 'PERCENTAGE' ? '20' : '10.00'}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Min Purchase</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.minPurchase}
                        onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                        placeholder="50.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Valid From *</label>
                      <Input
                        type="datetime-local"
                        value={formData.validFrom}
                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Valid Until *</label>
                      <Input
                        type="datetime-local"
                        value={formData.validUntil}
                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">Create Discount Code</Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {discounts.map((discount) => (
                <div key={discount.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <code className="text-lg font-bold px-3 py-1 bg-muted rounded">
                        {discount.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCode(discount.code)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Badge variant={discount.active ? 'default' : 'secondary'}>
                        {discount.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(discount.id, discount.active)}
                    >
                      {discount.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                  <p className="text-sm">{discount.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      {discount.discountType === 'PERCENTAGE'
                        ? `${discount.discountValue}% off`
                        : discount.discountType === 'FIXED_AMOUNT'
                        ? `$${discount.discountValue} off`
                        : 'Free Shipping'}
                    </span>
                    {discount.minPurchase && <span>• Min: ${discount.minPurchase}</span>}
                    <span>• Used: {discount.usageCount} times</span>
                    <span>
                      • Valid: {new Date(discount.validFrom).toLocaleDateString()} -{' '}
                      {new Date(discount.validUntil).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
