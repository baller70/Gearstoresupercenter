'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Bug,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react"

interface RequestLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: any;
  status: number;
  response: any;
  error?: string;
}

export default function DebugPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    fetchLogs();
    
    // Poll for new logs every 2 seconds
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [session, status, router]);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/debug/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    try {
      await fetch('/api/admin/debug/logs', { method: 'DELETE' });
      setLogs([]);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 max-w-7xl py-8">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 max-w-7xl py-8">
        
        {/* Header */}
        <div className="space-y-2 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20 mb-2">
                <Bug className="mr-2 h-4 w-4" />
                Debug Mode
              </Badge>
              <h1 className="text-3xl font-bold">Jetprint Request Debugger</h1>
              <p className="text-muted-foreground">
                Real-time monitoring of Jetprint API requests
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={fetchLogs}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                onClick={clearLogs}
              >
                Clear Logs
              </Button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <Card className="mb-8 border-blue-500/50 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <AlertCircle className="h-5 w-5" />
              How to Use This Debugger
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">1. Keep this page open</p>
            <p className="text-sm">2. Go to Jetprint and try to publish a product</p>
            <p className="text-sm">3. Watch this page for real-time requests and errors</p>
            <p className="text-sm">4. Check the detailed logs below to see what went wrong</p>
          </CardContent>
        </Card>

        {/* Request Logs */}
        <div className="space-y-4">
          {logs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Requests Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Try publishing a product from Jetprint to see requests appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            logs.map((log) => (
              <Card key={log.id} className={
                log.status >= 200 && log.status < 300 
                  ? 'border-green-500/50' 
                  : 'border-red-500/50'
              }>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {log.status >= 200 && log.status < 300 ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <CardTitle className="text-lg">
                          {log.method} {log.url}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant={log.status >= 200 && log.status < 300 ? 'default' : 'destructive'}>
                      Status: {log.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {log.error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-500/50 rounded p-4">
                      <h4 className="font-semibold text-red-600 mb-2">Error</h4>
                      <pre className="text-xs overflow-x-auto">{log.error}</pre>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-semibold mb-2">Headers</h4>
                    <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                      {JSON.stringify(log.headers, null, 2)}
                    </pre>
                  </div>
                  
                  {log.body && (
                    <div>
                      <h4 className="font-semibold mb-2">Request Body</h4>
                      <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                        {JSON.stringify(log.body, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-semibold mb-2">Response</h4>
                    <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                      {JSON.stringify(log.response, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
