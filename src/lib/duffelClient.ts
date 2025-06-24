import { Duffel } from '@duffel/api';
import { z } from 'zod';

// Constants
const RATE_LIMIT_DELAY = 1000; // 1 second
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Types
export interface DuffelConfig {
  token: string;
  mode: 'test' | 'live';
  version?: string;
}

// Duffel API response types
interface DuffelOfferRequest {
  data: {
    id: string;
    [key: string]: any;
  };
}

interface DuffelOffers {
  data: any[];
  meta: {
    [key: string]: any;
  };
}

interface DuffelPassenger {
  type: 'adult' | 'child' | 'infant';
  given_name: string;
  family_name: string;
  age?: number;
  email: string;
  phone_number: string;
  id: string;
  born_on: string;
  gender: 'm' | 'f';
  title: 'mr' | 'ms' | 'mrs' | 'miss' | 'dr';
}

// Validation schemas
const TimeRangeSchema = z.object({
  from: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  to: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

const PassengerSchema = z.object({
  type: z.enum(['adult', 'child', 'infant']),
  given_name: z.string(),
  family_name: z.string(),
  age: z.number().optional(),
  email: z.string().email(),
  phone_number: z.string(),
  id: z.string(),
  born_on: z.string(),
  gender: z.enum(['m', 'f']),
  title: z.enum(['mr', 'ms', 'mrs', 'miss', 'dr']),
});

const FlightSearchParamsSchema = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  returnDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  passengers: z.object({
    adults: z.number().min(1),
    children: z.number().min(0).optional(),
    infants: z.number().min(0).optional(),
  }),
  cabinClass: z.enum(['economy', 'premium_economy', 'business', 'first']),
  after: z.string().optional(),
  sort: z.enum(['total_amount', 'total_duration', '-total_amount', '-total_duration']).optional(),
  limit: z.number().min(1).max(50).optional(),
});

// Cache implementation
class RequestCache {
  private cache: Map<string, { data: any; timestamp: number }>;
  private ttl: number;

  constructor(ttl = 5 * 60 * 1000) {
    // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Enhanced Duffel Client
export class EnhancedDuffelClient {
  private client: Duffel;
  private cache: RequestCache;
  private lastRequestTime: number = 0;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue: boolean = false;

  constructor(config: DuffelConfig) {
    this.client = new Duffel({
      token: config.token,
    });
    this.cache = new RequestCache();
  }

  // Rate limiting
  private async rateLimitedRequest<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
    return fn();
  }

  // Retry logic
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: any;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        if (error.status === 429) {
          const delay = Math.pow(2, i) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }

  // Request queue processing
  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;

    this.isProcessingQueue = true;
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Error processing queued request:', error);
        }
      }
    }
    this.isProcessingQueue = false;
  }

  // Queue a request
  private queueRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  // Enhanced search flights with all features
  async searchFlights(params: z.infer<typeof FlightSearchParamsSchema>) {
    // Validate input
    const validatedParams = FlightSearchParamsSchema.parse(params);

    // Generate cache key
    const cacheKey = `search_${JSON.stringify(validatedParams)}`;
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) return cachedResult;

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), REQUEST_TIMEOUT)
    );

    // Execute request with all enhancements
    const result = await this.queueRequest(async () => {
      return this.withRetry(async () => {
        return this.rateLimitedRequest(async () => {
          // Create offer request
          const offerRequest = (await Promise.race([
            this.client.offerRequests.create({
              slices: [
                {
                  origin: validatedParams.origin,
                  destination: validatedParams.destination,
                  departure_date: validatedParams.departureDate,
                  arrival_time: { from: '06:00', to: '22:00' },
                  departure_time: { from: '06:00', to: '22:00' },
                },
                ...(validatedParams.returnDate
                  ? [
                      {
                        origin: validatedParams.destination,
                        destination: validatedParams.origin,
                        departure_date: validatedParams.returnDate,
                        arrival_time: { from: '06:00', to: '22:00' },
                        departure_time: { from: '06:00', to: '22:00' },
                      },
                    ]
                  : []),
              ],
              passengers: [
                ...Array(validatedParams.passengers.adults).fill({ type: 'adult' }),
                ...Array(validatedParams.passengers.children || 0).fill({ type: 'child' }),
                ...Array(validatedParams.passengers.infants || 0).fill({ type: 'infant' }),
              ],
              cabin_class: validatedParams.cabinClass,
            }),
            timeoutPromise,
          ])) as DuffelOfferRequest;

          // List offers
          const offers = (await Promise.race([
            this.client.offers.list({
              offer_request_id: offerRequest.data.id,
              limit: validatedParams.limit || 15,
              sort: validatedParams.sort?.replace('-', '') as 'total_amount' | 'total_duration',
              after: validatedParams.after,
            }),
            timeoutPromise,
          ])) as DuffelOffers;

          return {
            data: offers.data,
            meta: offers.meta,
          };
        });
      });
    });

    // Cache the result
    this.cache.set(cacheKey, result);
    return result;
  }

  // Enhanced get offer details
  async getOfferDetails(offerId: string) {
    const cacheKey = `offer_${offerId}`;
    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) return cachedResult;

    const result = await this.queueRequest(async () => {
      return this.withRetry(async () => {
        return this.rateLimitedRequest(async () => {
          const offer = await this.client.offers.get(offerId);
          return offer.data;
        });
      });
    });

    this.cache.set(cacheKey, result);
    return result;
  }

  // Enhanced create order
  async createOrder(offerId: string, passengers: z.infer<typeof PassengerSchema>[]) {
    // Validate passengers
    const validatedPassengers = z.array(PassengerSchema).parse(passengers);

    return this.queueRequest(async () => {
      return this.withRetry(async () => {
        return this.rateLimitedRequest(async () => {
          const order = await this.client.orders.create({
            type: 'instant',
            selected_offers: [offerId],
            passengers: validatedPassengers,
          });
          return order.data;
        });
      });
    });
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

// Export a singleton instance
let duffelClientInstance: EnhancedDuffelClient | null = null;

export function getDuffelClient(config: DuffelConfig): EnhancedDuffelClient {
  if (!duffelClientInstance) {
    duffelClientInstance = new EnhancedDuffelClient(config);
  }
  return duffelClientInstance;
}
