
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// In-memory log storage (in production, use Redis or database)
const requestLogs: any[] = [];
const MAX_LOGS = 50;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    logs: requestLogs.slice(-MAX_LOGS).reverse() // Return latest logs first
  });
}

export async function POST(req: NextRequest) {
  try {
    const log = await req.json();
    requestLogs.push({
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    });

    // Keep only last MAX_LOGS
    if (requestLogs.length > MAX_LOGS) {
      requestLogs.splice(0, requestLogs.length - MAX_LOGS);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to log request:', error);
    return NextResponse.json(
      { error: 'Failed to log request' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  requestLogs.length = 0; // Clear all logs
  return NextResponse.json({ success: true });
}
