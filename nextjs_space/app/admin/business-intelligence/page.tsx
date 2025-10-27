
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, Users, DollarSign, Target } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Forecast {
  nextMonth: {
    predictedRevenue: number;
    confidence: string;
    trend: string;
  };
  byCategory: Record<string, { predicted: number; confidence: number }>;
  insights: string[];
  recommendations: string[];
}

interface CustomerLTV {
  userId: string;
  email: string;
  name: string;
  totalSpent: number;
  orderCount: number;
  avgOrderValue: number;
  predictedLTV: number;
  segment: string;
  lastPurchaseDate: string | null;
  daysSinceLastPurchase: number | null;
}

interface Cohort {
  month: string;
  totalCustomers: number;
  totalRevenue: number;
  avgRevenuePerCustomer: number;
  retentionRates: Record<string, number>;
}

export default function BusinessIntelligencePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [ltvData, setLtvData] = useState<{ customers: CustomerLTV[]; summary: any } | null>(null);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [activeTab, setActiveTab] = useState('forecast');

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (activeTab === 'forecast' && !forecast) {
      fetchForecast();
    } else if (activeTab === 'ltv' && !ltvData) {
      fetchLTV();
    } else if (activeTab === 'cohort' && cohorts.length === 0) {
      fetchCohorts();
    }
  }, [session, router, activeTab]);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/forecast');
      if (!response.ok) throw new Error('Failed to fetch forecast');
      const data = await response.json();
      setForecast(data);
    } catch (error) {
      console.error('Error fetching forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLTV = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/customer-ltv');
      if (!response.ok) throw new Error('Failed to fetch LTV data');
      const data = await response.json();
      setLtvData(data);
    } catch (error) {
      console.error('Error fetching LTV data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCohorts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analytics/cohort');
      if (!response.ok) throw new Error('Failed to fetch cohort data');
      const data = await response.json();
      setCohorts(data);
    } catch (error) {
      console.error('Error fetching cohort data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSegmentBadge = (segment: string) => {
    const colors: Record<string, string> = {
      HIGH_VALUE: 'bg-green-500',
      MEDIUM_VALUE: 'bg-blue-500',
      LOW_VALUE: 'bg-gray-500',
      AT_RISK: 'bg-red-500',
    };

    return (
      <Badge className={colors[segment] || 'bg-gray-500'}>
        {segment.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Business Intelligence</h1>
        <p className="text-muted-foreground">
          Advanced analytics and insights for strategic decision-making
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="forecast">Sales Forecast</TabsTrigger>
          <TabsTrigger value="ltv">Customer LTV</TabsTrigger>
          <TabsTrigger value="cohort">Cohort Analysis</TabsTrigger>
        </TabsList>

        {/* Sales Forecast */}
        <TabsContent value="forecast">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : forecast ? (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Predicted Revenue (30 Days)
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${forecast.nextMonth.predictedRevenue.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {forecast.nextMonth.confidence} confidence
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Trend
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold capitalize">
                      {forecast.nextMonth.trend}
                    </div>
                    <Badge variant={
                      forecast.nextMonth.trend === 'up' ? 'default' :
                      forecast.nextMonth.trend === 'down' ? 'destructive' : 'secondary'
                    }>
                      {forecast.nextMonth.trend === 'up' ? '↑' :
                       forecast.nextMonth.trend === 'down' ? '↓' : '→'} Trending
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Top Category
                    </CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Object.entries(forecast.byCategory).sort((a, b) => b[1].predicted - a[1].predicted)[0]?.[0].replace('_', ' ') || 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Best performing category
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Category Forecasts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(forecast.byCategory).map(([category, data]) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="font-medium">{category.replace('_', ' ')}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold">
                            ${data.predicted.toFixed(2)}
                          </span>
                          <Badge variant="outline">
                            {Math.round(data.confidence * 100)}% confidence
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {forecast.insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {forecast.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-600">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert>
              <AlertDescription>No forecast data available</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Customer LTV */}
        <TabsContent value="ltv">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : ltvData ? (
            <div className="space-y-6">
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Customers
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {ltvData.summary.totalCustomers}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Average LTV
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${ltvData.summary.averageLTV.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      High Value Customers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {ltvData.summary.highValue}
                    </div>
                    <Badge className="bg-green-500 mt-1">Top Tier</Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      At Risk
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {ltvData.summary.atRisk}
                    </div>
                    <Badge variant="destructive" className="mt-1">Needs Attention</Badge>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Top Customers by Predicted LTV</CardTitle>
                  <CardDescription>
                    Showing top 20 customers with highest lifetime value
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Total Spent</TableHead>
                          <TableHead>Orders</TableHead>
                          <TableHead>Avg Order</TableHead>
                          <TableHead>Predicted LTV</TableHead>
                          <TableHead>Segment</TableHead>
                          <TableHead>Last Purchase</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ltvData.customers.slice(0, 20).map((customer) => (
                          <TableRow key={customer.userId}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{customer.name || 'N/A'}</div>
                                <div className="text-xs text-muted-foreground">{customer.email}</div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              ${customer.totalSpent.toFixed(2)}
                            </TableCell>
                            <TableCell>{customer.orderCount}</TableCell>
                            <TableCell>${customer.avgOrderValue.toFixed(2)}</TableCell>
                            <TableCell className="font-bold">
                              ${customer.predictedLTV.toFixed(2)}
                            </TableCell>
                            <TableCell>{getSegmentBadge(customer.segment)}</TableCell>
                            <TableCell className="text-sm">
                              {customer.lastPurchaseDate
                                ? new Date(customer.lastPurchaseDate).toLocaleDateString()
                                : 'Never'}
                              {customer.daysSinceLastPurchase && (
                                <div className="text-xs text-muted-foreground">
                                  ({customer.daysSinceLastPurchase} days ago)
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Alert>
              <AlertDescription>No LTV data available</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Cohort Analysis */}
        <TabsContent value="cohort">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : cohorts.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Cohort Analysis</CardTitle>
                <CardDescription>
                  Customer retention by cohort (month of first purchase)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cohort Month</TableHead>
                        <TableHead>Customers</TableHead>
                        <TableHead>Total Revenue</TableHead>
                        <TableHead>Avg Revenue</TableHead>
                        <TableHead>Retention</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cohorts.map((cohort) => (
                        <TableRow key={cohort.month}>
                          <TableCell className="font-medium">{cohort.month}</TableCell>
                          <TableCell>{cohort.totalCustomers}</TableCell>
                          <TableCell>${cohort.totalRevenue.toFixed(2)}</TableCell>
                          <TableCell>${cohort.avgRevenuePerCustomer.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {Object.entries(cohort.retentionRates).slice(0, 3).map(([month, rate]) => (
                                <Badge key={month} variant="outline" className="text-xs">
                                  {rate}%
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertDescription>No cohort data available</AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
