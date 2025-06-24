// src/lib/env.ts
// Environment variable validation and configuration

import { logger } from './logger';

interface EnvConfig {
  // Required environment variables
  required: string[];
  // Optional environment variables with defaults
  optional: Record<string, string>;
  // Environment-specific requirements
  development?: string[];
  production?: string[];
  test?: string[];
}

const envConfig: EnvConfig = {
  required: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
  ],
  optional: {
    LOG_LEVEL: 'info',
    NODE_ENV: 'development',
    DUFFEL_MODE: 'test',
  },
  development: ['DUFFEL_TOKEN'],
  production: ['DUFFEL_TOKEN', 'VERCEL_CRON_SECRET'],
  test: [
    // Test environment can work with minimal config
  ],
};

class EnvironmentError extends Error {
  constructor(
    message: string,
    public missingVars: string[]
  ) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

/**
 * Validates that all required environment variables are present
 * @param throwOnMissing - Whether to throw an error if variables are missing
 * @returns Object with validation results
 */
export function validateEnvironment(throwOnMissing = true) {
  const env = process.env.NODE_ENV || 'development';
  const missingVars: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  envConfig.required.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Check environment-specific variables
  const envSpecific = envConfig[env as keyof typeof envConfig];
  if (Array.isArray(envSpecific)) {
    envSpecific.forEach(varName => {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    });
  }

  // Check for insecure defaults
  if (process.env.JWT_SECRET === 'your-secret-key') {
    warnings.push('JWT_SECRET is using default value - this is insecure!');
  }

  // Check for development-specific issues
  if (env === 'production') {
    if (process.env.DUFFEL_MODE === 'test') {
      warnings.push('DUFFEL_MODE is set to "test" in production environment');
    }
  }

  // Log validation results
  if (missingVars.length > 0) {
    logger.error('Missing required environment variables', undefined, {
      missingVars,
      environment: env,
      component: 'env-validation',
    });

    if (throwOnMissing) {
      throw new EnvironmentError(
        `Missing required environment variables: ${missingVars.join(', ')}`,
        missingVars
      );
    }
  }

  if (warnings.length > 0) {
    warnings.forEach(warning => {
      logger.warn('Environment configuration warning', {
        warning,
        environment: env,
        component: 'env-validation',
      });
    });
  }

  if (missingVars.length === 0 && warnings.length === 0) {
    logger.info('Environment validation passed', {
      environment: env,
      component: 'env-validation',
    });
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
    warnings,
    environment: env,
  };
}

/**
 * Gets an environment variable with optional default value
 * @param key - Environment variable name
 * @param defaultValue - Default value if not set
 * @param required - Whether this variable is required
 */
export function getEnvVar(key: string, defaultValue?: string, required = false): string {
  const value = process.env[key];

  if (!value) {
    if (required) {
      // During build time, provide fallback values for required variables
      if (process.env.NEXT_PHASE || process.env.NODE_ENV === 'production') {
        return defaultValue || 'build-time-placeholder';
      }
      throw new EnvironmentError(`Required environment variable ${key} is not set`, [key]);
    }

    if (defaultValue !== undefined) {
      logger.debug('Using default value for environment variable', {
        key,
        defaultValue,
        component: 'env-validation',
      });
      return defaultValue;
    }

    throw new EnvironmentError(`Environment variable ${key} is not set and no default provided`, [
      key,
    ]);
  }

  return value;
}

/**
 * Gets a boolean environment variable
 * @param key - Environment variable name
 * @param defaultValue - Default value if not set
 */
export function getBooleanEnvVar(key: string, defaultValue = false): boolean {
  const value = process.env[key];

  if (!value) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Gets a numeric environment variable
 * @param key - Environment variable name
 * @param defaultValue - Default value if not set
 */
export function getNumericEnvVar(key: string, defaultValue?: number): number {
  const value = process.env[key];

  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new EnvironmentError(`Environment variable ${key} is not set and no default provided`, [
      key,
    ]);
  }

  const numValue = parseInt(value, 10);
  if (isNaN(numValue)) {
    throw new EnvironmentError(`Environment variable ${key} is not a valid number: ${value}`, [
      key,
    ]);
  }

  return numValue;
}

/**
 * Checks if we're running in a specific environment
 */
export const isProduction = () => process.env.NODE_ENV === 'production';
export const isDevelopment = () => process.env.NODE_ENV === 'development';
export const isTest = () => process.env.NODE_ENV === 'test';

/**
 * Gets database configuration
 */
export function getDatabaseConfig() {
  return {
    url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL', undefined, true),
    anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', undefined, true),
    serviceRoleKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY', undefined, true),
  };
}

/**
 * Gets authentication configuration
 */
export function getAuthConfig() {
  return {
    jwtSecret: getEnvVar('JWT_SECRET', isTest() ? 'test_jwt_secret' : undefined, !isTest()),
    tokenExpiry: getEnvVar('JWT_EXPIRY', '7d'),
    cookieSecure: isProduction(),
    cookieMaxAge: getNumericEnvVar('COOKIE_MAX_AGE', 7 * 24 * 60 * 60), // 7 days
  };
}

/**
 * Gets external API configuration
 */
export function getExternalApiConfig() {
  return {
    duffel: {
      token: getEnvVar('DUFFEL_TOKEN', undefined, !isTest()),
      mode: getEnvVar('DUFFEL_MODE', 'test') as 'test' | 'live',
    },
    unsplash: {
      accessKey: getEnvVar('UNSPLASH_ACCESS_KEY'),
    },
    qstash: {
      currentSigningKey: getEnvVar('QSTASH_CURRENT_SIGNING_KEY'),
      nextSigningKey: getEnvVar('QSTASH_NEXT_SIGNING_KEY'),
      token: getEnvVar('QSTASH_TOKEN'),
    },
  };
}

// Validate environment on module load (except in test environment and build time)
if (!isTest() &&
    process.env.NODE_ENV !== 'production' &&
    !process.env.NEXT_PHASE &&
    typeof window === 'undefined') {
  try {
    validateEnvironment();
  } catch (error) {
    if (error instanceof EnvironmentError) {
      console.error('Environment validation failed:', error.message);
      console.error('Missing variables:', error.missingVars);
    }
  }
}
