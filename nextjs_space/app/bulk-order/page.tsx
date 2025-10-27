
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navigation } from '@/components/navigation';
import { Users, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface OrderItem {
  id: string;
  productId: string;
  playerName: string;
  playerNumber: string;
  size: string;
  color: string;
  quantity: number;
}

export default function BulkOrderPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [teamName, setTeamName] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const addPlayer = () => {
    setItems([
      ...items,
      {
        id: `temp-${Date.now()}`,
        productId: '',
        playerName: '',
        playerNumber: '',
        size: 'M',
        color: 'Black',
        quantity: 1,
      },
    ]);
  };

  const removePlayer = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updatePlayer = (id: string, field: string, value: string | number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      toast.error('Please sign in to place a bulk order');
      router.push('/auth/signin');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one player');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/bulk-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName,
          items: items.map(({ id, ...item }) => item),
          notes,
        }),
      });

      if (response.ok) {
        toast.success('Bulk order submitted! Our team will contact you soon.');
        setTeamName('');
        setNotes('');
        setItems([]);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit order');
      }
    } catch (error) {
      toast.error('Failed to submit order');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6" />
              Bulk Team Order
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Get 15% off for orders of 10+ items! Perfect for teams, clubs, and organizations.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Team Name *</label>
                <Input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Rise as One AAU"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Players</label>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Player {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePlayer(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Player Name"
                          value={item.playerName}
                          onChange={(e) =>
                            updatePlayer(item.id, 'playerName', e.target.value)
                          }
                          required
                        />
                        <Input
                          placeholder="Number (optional)"
                          value={item.playerNumber}
                          onChange={(e) =>
                            updatePlayer(item.id, 'playerNumber', e.target.value)
                          }
                        />
                        <Select
                          value={item.size}
                          onValueChange={(value) =>
                            updatePlayer(item.id, 'size', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="XS">XS</SelectItem>
                            <SelectItem value="S">S</SelectItem>
                            <SelectItem value="M">M</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                            <SelectItem value="XL">XL</SelectItem>
                            <SelectItem value="2XL">2XL</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={item.color}
                          onValueChange={(value) =>
                            updatePlayer(item.id, 'color', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Color" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Black">Black</SelectItem>
                            <SelectItem value="White">White</SelectItem>
                            <SelectItem value="Red">Red</SelectItem>
                            <SelectItem value="Blue">Blue</SelectItem>
                            <SelectItem value="Orange">Orange</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addPlayer}
                  className="w-full mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Player
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Additional Notes (optional)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special requests, design preferences, etc."
                  rows={4}
                />
              </div>

              {items.length >= 10 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    🎉 You qualify for 15% team discount!
                  </p>
                </div>
              )}

              <Button type="submit" disabled={submitting} className="w-full" size="lg">
                <ShoppingCart className="w-5 h-5 mr-2" />
                {submitting ? 'Submitting...' : 'Submit Bulk Order'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
