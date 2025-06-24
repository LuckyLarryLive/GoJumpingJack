/**
 * @jest-environment node
 */

import { GET, HEAD } from '@/app/api/health/route';
import { NextRequest } from 'next/server';

// Mock the dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  })),
}));

jest.mock('@duffel/api', () => ({
  Duffel: jest.fn(() => ({
    airlines: {
      list: jest.fn(() => Promise.resolve({ data: [{ id: 'test' }] })),
    },
  })),
}));

// Mock environment variables
const originalEnv = process.env;

describe('/api/health', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      DUFFEL_TOKEN: 'test_token',
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      SUPABASE_SERVICE_ROLE_KEY: 'test_service_key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET();

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('environment');
      expect(data).toHaveProperty('checks');
      expect(data).toHaveProperty('uptime');

      // Check that all required checks are present
      expect(data.checks).toHaveProperty('database');
      expect(data.checks).toHaveProperty('duffel');
      expect(data.checks).toHaveProperty('unsplash');
      expect(data.checks).toHaveProperty('redis');
    });

    test('should include response times in checks', async () => {
      const response = await GET();
      const data = await response.json();

      // Each check should have a response time
      Object.values(data.checks).forEach((check: any) => {
        expect(check).toHaveProperty('responseTime');
        expect(typeof check.responseTime).toBe('number');
        expect(check.responseTime).toBeGreaterThanOrEqual(0);
      });
    });

    test('should handle missing environment variables gracefully', async () => {
      // Remove required environment variables
      delete process.env.DUFFEL_TOKEN;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const response = await GET();
      const data = await response.json();

      // Should still return a response, but with error status
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('checks');
    });

    test('should return proper status codes based on health', async () => {
      const response = await GET();

      // Should return 200 for healthy, 503 for unhealthy
      expect([200, 503]).toContain(response.status);
    });

    test('should include version information', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.version).toBeDefined();
      expect(typeof data.version).toBe('string');
    });

    test('should include environment information', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.environment).toBeDefined();
      expect(typeof data.environment).toBe('string');
    });

    test('should include timestamp in ISO format', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.timestamp).toBeDefined();
      expect(() => new Date(data.timestamp)).not.toThrow();

      // Should be a recent timestamp (within last minute)
      const timestamp = new Date(data.timestamp);
      const now = new Date();
      const diffMs = now.getTime() - timestamp.getTime();
      expect(diffMs).toBeLessThan(60000); // Less than 1 minute
    });

    test('should include uptime information', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.uptime).toBeDefined();
      expect(typeof data.uptime).toBe('number');
      expect(data.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('HEAD /api/health', () => {
    test('should return 200 status for liveness probe', async () => {
      const response = await HEAD();
      expect(response.status).toBe(200);
    });

    test('should not return body for HEAD request', async () => {
      const response = await HEAD();
      const text = await response.text();
      expect(text).toBe('');
    });
  });

  describe('Health check components', () => {
    test('should check database connectivity', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.checks.database).toHaveProperty('status');
      expect(data.checks.database).toHaveProperty('responseTime');
      expect(['ok', 'error', 'degraded']).toContain(data.checks.database.status);
    });

    test('should check Duffel API connectivity', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.checks.duffel).toHaveProperty('status');
      expect(data.checks.duffel).toHaveProperty('responseTime');
      expect(['ok', 'error', 'degraded']).toContain(data.checks.duffel.status);
    });

    test('should handle optional services gracefully', async () => {
      // Remove optional environment variables
      delete process.env.UNSPLASH_ACCESS_KEY;
      delete process.env.REDIS_URL;

      const response = await GET();
      const data = await response.json();

      // Optional services should be marked as degraded, not error
      expect(data.checks.unsplash.status).toBe('degraded');
      expect(data.checks.redis.status).toBe('degraded');
    });
  });
});
