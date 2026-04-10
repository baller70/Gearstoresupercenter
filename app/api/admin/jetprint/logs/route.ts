import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs/promises';

/**
 * GET /api/admin/jetprint/logs
 * Get recent WooCommerce API logs
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read the server log file
    const logPath = '/tmp/nextjs_server.log';
    
    try {
      const logContent = await fs.readFile(logPath, 'utf-8');
      const lines = logContent.split('\n');
      
      // Filter for WooCommerce API related logs
      const wcLogs = lines
        .filter(line => line.includes('WooCommerce API') || line.includes('wp-json'))
        .slice(-50); // Last 50 entries
      
      return NextResponse.json({ 
        logs: wcLogs,
        count: wcLogs.length
      });
    } catch (error) {
      return NextResponse.json({ 
        logs: ['No logs available yet. Server logs will appear here when Jetprint attempts to connect.'],
        count: 0
      });
    }
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
