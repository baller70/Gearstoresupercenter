
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Gift } from 'lucide-react';

interface LoyaltyTransaction {
  id: string;
  points: number;
  type: string;
  description: string;
  createdAt: string;
}

export default function LoyaltyDisplay() {
  const { data: session } = useSession() || {};
  const [points, setPoints] = useState(0);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchLoyaltyData();
    }
  }, [session]);

  const fetchLoyaltyData = async () => {
    try {
      const response = await fetch('/api/loyalty');
      const data = await response.json();
      setPoints(data.points || 0);
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch loyalty data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user || isLoading) {
    return null;
  }

  const getTierInfo = (pts: number) => {
    if (pts >= 1000) return { name: 'Gold', icon: Trophy, color: 'text-yellow-500' };
    if (pts >= 500) return { name: 'Silver', icon: Star, color: 'text-gray-400' };
    return { name: 'Bronze', icon: Gift, color: 'text-orange-500' };
  };

  const tier = getTierInfo(points);
  const TierIcon = tier.icon;

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TierIcon className={`h-5 w-5 ${tier.color}`} />
              Loyalty Rewards
            </CardTitle>
            <CardDescription>
              {tier.name} Member • Earn points with every purchase
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{points}</div>
            <div className="text-xs text-muted-foreground">points</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            💰 $1 = 10 points • 100 points = $1 discount
          </div>
          
          {transactions.length > 0 && (
            <div className="space-y-2 mt-4">
              <h4 className="text-sm font-semibold">Recent Activity</h4>
              <div className="space-y-2">
                {transactions.slice(0, 3).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between text-sm p-2 bg-background/50 rounded"
                  >
                    <span className="text-muted-foreground">
                      {transaction.description}
                    </span>
                    <Badge variant={transaction.points > 0 ? 'default' : 'secondary'}>
                      {transaction.points > 0 ? '+' : ''}{transaction.points}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Bronze</div>
              <div className="text-sm font-semibold">0+</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Silver</div>
              <div className="text-sm font-semibold">500+</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Gold</div>
              <div className="text-sm font-semibold">1000+</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
