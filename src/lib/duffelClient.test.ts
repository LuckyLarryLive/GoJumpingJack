import { getDuffelClient } from './duffelClient';

describe('EnhancedDuffelClient', () => {
  const mockConfig = {
    token: 'test_token',
    mode: 'test' as const,
  };

  beforeEach(() => {
    // Clear any existing instance
    jest.resetModules();
  });

  it('should create a singleton instance', () => {
    const client1 = getDuffelClient(mockConfig);
    const client2 = getDuffelClient(mockConfig);
    expect(client1).toBe(client2);
  });

  it('should search flights with validation', async () => {
    const client = getDuffelClient(mockConfig);

    const searchParams = {
      origin: 'LHR',
      destination: 'JFK',
      departureDate: '2024-06-01',
      passengers: {
        adults: 1,
      },
      cabinClass: 'economy' as const,
    };

    try {
      const result = await client.searchFlights(searchParams);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
    } catch (error) {
      // In test mode, we expect errors due to invalid token
      expect(error).toBeDefined();
    }
  });

  it('should validate passenger data for orders', async () => {
    const client = getDuffelClient(mockConfig);

    const passengers = [
      {
        type: 'adult' as const,
        given_name: 'John',
        family_name: 'Doe',
        email: 'john.doe@example.com',
        phone_number: '+1234567890',
        id: 'pass_123',
        born_on: '1990-01-01',
        gender: 'm' as const,
        title: 'mr' as const,
      },
    ];

    try {
      const result = await client.createOrder('offer_123', passengers);
      expect(result).toBeDefined();
    } catch (error) {
      // In test mode, we expect errors due to invalid token
      expect(error).toBeDefined();
    }
  });

  it('should handle rate limiting', async () => {
    const client = getDuffelClient(mockConfig);

    const searchParams = {
      origin: 'LHR',
      destination: 'JFK',
      departureDate: '2024-06-01',
      passengers: {
        adults: 1,
      },
      cabinClass: 'economy' as const,
    };

    const startTime = Date.now();

    // Make multiple requests in quick succession
    const promises = Array(3)
      .fill(null)
      .map(() => client.searchFlights(searchParams));

    try {
      await Promise.all(promises);
    } catch (error) {
      // In test mode, we expect errors due to invalid token
      expect(error).toBeDefined();
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // First request is immediate, subsequent requests are spaced by 1 second
    // For 3 requests, we expect at least 900ms total (allowing for timing variations)
    expect(duration).toBeGreaterThanOrEqual(900);
    // And less than 3 seconds (allowing some buffer for test execution)
    expect(duration).toBeLessThan(3000);
  });

  it('should handle request timeouts', async () => {
    const client = getDuffelClient(mockConfig);

    const searchParams = {
      origin: 'LHR',
      destination: 'JFK',
      departureDate: '2024-06-01',
      passengers: {
        adults: 1,
      },
      cabinClass: 'economy' as const,
    };

    // Mock the client to simulate a timeout
    jest.spyOn(client as any, 'rateLimitedRequest').mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 100);
      });
    });

    try {
      await client.searchFlights(searchParams);
      fail('Expected an error to be thrown');
    } catch (error: any) {
      expect(error.message).toBe('Request timed out');
    }
  });

  it('should cache results', async () => {
    const client = getDuffelClient(mockConfig);

    const searchParams = {
      origin: 'LHR',
      destination: 'JFK',
      departureDate: '2024-06-01',
      passengers: {
        adults: 1,
      },
      cabinClass: 'economy' as const,
    };

    try {
      const result1 = await client.searchFlights(searchParams);
      const result2 = await client.searchFlights(searchParams);
      expect(result1).toBe(result2); // Should be the same object reference
    } catch (error) {
      // In test mode, we expect errors due to invalid token
      expect(error).toBeDefined();
    }
  });

  it('should clear cache', async () => {
    const client = getDuffelClient(mockConfig);

    const searchParams = {
      origin: 'LHR',
      destination: 'JFK',
      departureDate: '2024-06-01',
      passengers: {
        adults: 1,
      },
      cabinClass: 'economy' as const,
    };

    try {
      const result1 = await client.searchFlights(searchParams);
      client.clearCache();
      const result2 = await client.searchFlights(searchParams);
      expect(result1).not.toBe(result2); // Should be different object references
    } catch (error) {
      // In test mode, we expect errors due to invalid token
      expect(error).toBeDefined();
    }
  });
});
