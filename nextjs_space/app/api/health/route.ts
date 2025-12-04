import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: { status: string; latency?: number; error?: string };
    s3: { status: string; configured: boolean };
    stripe: { status: string; configured: boolean };
    email: { status: string; configured: boolean };
    pod: { status: string; configured: boolean };
  };
}

const startTime = Date.now();

async function checkDatabase(): Promise<{ status: string; latency?: number; error?: string }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', latency: Date.now() - start };
  } catch (error: any) {
    return { status: 'unhealthy', error: error.message };
  }
}

function checkS3(): { status: string; configured: boolean } {
  const configured = !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
  );
  return { status: configured ? 'healthy' : 'not_configured', configured };
}

function checkStripe(): { status: string; configured: boolean } {
  const configured = !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_WEBHOOK_SECRET
  );
  return { status: configured ? 'healthy' : 'not_configured', configured };
}

function checkEmail(): { status: string; configured: boolean } {
  const configured = !!process.env.RESEND_API_KEY;
  return { status: configured ? 'healthy' : 'not_configured', configured };
}

function checkPOD(): { status: string; configured: boolean } {
  const configured = !!process.env.PRINTIFY_API_KEY;
  return { status: configured ? 'healthy' : 'not_configured', configured };
}

export async function GET() {
  try {
    const [database] = await Promise.all([
      checkDatabase(),
    ]);

    const s3 = checkS3();
    const stripe = checkStripe();
    const email = checkEmail();
    const pod = checkPOD();

    const checks = { database, s3, stripe, email, pod };

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (database.status === 'unhealthy') {
      status = 'unhealthy';
    } else if (!stripe.configured || !email.configured) {
      status = 'degraded';
    }

    const health: HealthCheck = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks,
    };

    const httpStatus = status === 'unhealthy' ? 503 : status === 'degraded' ? 200 : 200;

    return NextResponse.json(health, { status: httpStatus });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 503 }
    );
  }
}

