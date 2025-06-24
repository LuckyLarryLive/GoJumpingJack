// src/app/api/health/route.ts
// Health check endpoint for monitoring and load balancer health checks

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Duffel } from '@duffel/api';
import { logger } from '@/lib/logger';

interface HealthCheck {
  status: 'ok' | 'error' | 'degraded';
  message?: string;
  responseTime?: number;
  details?: any;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    database: HealthCheck;
    duffel: HealthCheck;
    unsplash?: HealthCheck;
    redis?: HealthCheck;
  };
  uptime: number;
}

const startTime = Date.now();

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Simple query to check database connectivity
    const { data, error } = await supabase.from('users').select('count').limit(1);

    if (error) {
      throw error;
    }

    const responseTime = Date.now() - start;
    return {
      status: 'ok',
      message: 'Database connection successful',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - start;
    logger.error('Health check: Database connection failed', error as Error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Database connection failed',
      responseTime,
    };
  }
}

async function checkDuffelAPI(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    if (!process.env.DUFFEL_TOKEN) {
      return {
        status: 'error',
        message: 'Duffel API token not configured',
        responseTime: Date.now() - start,
      };
    }

    const duffel = new Duffel({
      token: process.env.DUFFEL_TOKEN,
    });

    // Simple API call to check connectivity
    const response = await duffel.airlines.list({ limit: 1 });

    if (!response.data) {
      throw new Error('No data received from Duffel API');
    }

    const responseTime = Date.now() - start;
    return {
      status: 'ok',
      message: 'Duffel API connection successful',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - start;
    logger.error('Health check: Duffel API connection failed', error as Error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Duffel API connection failed',
      responseTime,
    };
  }
}

async function checkUnsplashAPI(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    if (!process.env.UNSPLASH_ACCESS_KEY) {
      return {
        status: 'degraded',
        message: 'Unsplash API not configured (optional service)',
        responseTime: Date.now() - start,
      };
    }

    // Simple request to check Unsplash API
    const response = await fetch('https://api.unsplash.com/photos/random?count=1', {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Unsplash API returned ${response.status}`);
    }

    const responseTime = Date.now() - start;
    return {
      status: 'ok',
      message: 'Unsplash API connection successful',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - start;
    logger.warn('Health check: Unsplash API connection failed', error as Error);
    return {
      status: 'degraded',
      message: error instanceof Error ? error.message : 'Unsplash API connection failed',
      responseTime,
    };
  }
}

async function checkRedis(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    if (!process.env.REDIS_URL) {
      return {
        status: 'degraded',
        message: 'Redis not configured (optional service)',
        responseTime: Date.now() - start,
      };
    }

    // TODO: Implement Redis health check when Redis is added
    // const redis = new Redis(process.env.REDIS_URL);
    // await redis.ping();

    const responseTime = Date.now() - start;
    return {
      status: 'degraded',
      message: 'Redis health check not implemented',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - start;
    logger.warn('Health check: Redis connection failed', error as Error);
    return {
      status: 'degraded',
      message: error instanceof Error ? error.message : 'Redis connection failed',
      responseTime,
    };
  }
}

export async function GET() {
  const startTime = Date.now();

  try {
    logger.info('Health check requested');

    // Run all health checks in parallel
    const [database, duffel, unsplash, redis] = await Promise.all([
      checkDatabase(),
      checkDuffelAPI(),
      checkUnsplashAPI(),
      checkRedis(),
    ]);

    const checks = {
      database,
      duffel,
      unsplash,
      redis,
    };

    // Determine overall health status
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    // Critical services (database, duffel) must be healthy
    if (database.status === 'error' || duffel.status === 'error') {
      overallStatus = 'unhealthy';
    } else if (
      database.status === 'degraded' ||
      duffel.status === 'degraded' ||
      unsplash?.status === 'error' ||
      redis?.status === 'error'
    ) {
      overallStatus = 'degraded';
    }

    const response: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
      uptime: Date.now() - startTime,
    };

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    logger.info('Health check completed', {
      status: overallStatus,
      duration: Date.now() - startTime,
      checks: Object.entries(checks).map(([name, check]) => ({
        name,
        status: check.status,
        responseTime: check.responseTime,
      })),
    });

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    logger.error('Health check failed', error as Error);

    const errorResponse: HealthResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: { status: 'error', message: 'Health check failed' },
        duffel: { status: 'error', message: 'Health check failed' },
      },
      uptime: Date.now() - startTime,
    };

    return NextResponse.json(errorResponse, { status: 503 });
  }
}

// Simple liveness probe (for Kubernetes)
export async function HEAD() {
  return new Response(null, { status: 200 });
}
