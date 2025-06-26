import { compare, hash } from 'bcryptjs';
import { sign, verify, SignOptions } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { User } from '@/types/user';
import { getAuthConfig } from './env';
import { logger } from './logger';

const authConfig = getAuthConfig();
const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword);
}

export function generateToken(user: Omit<User, 'passwordHash'>): string {
  logger.debug('Generating JWT token', { userId: user.id, component: 'auth' });

  return sign(
    {
      id: user.id,
      email: user.email,
    },
    authConfig.jwtSecret,
    { expiresIn: '7d' } // Use string literal instead of config for now
  );
}

export function verifyToken(token: string): { id: string; email: string } {
  try {
    const decoded = verify(token, authConfig.jwtSecret) as { id: string; email: string };
    logger.debug('JWT token verified successfully', { userId: decoded.id, component: 'auth' });
    return decoded;
  } catch (error) {
    logger.warn('JWT token verification failed', {
      error: (error as Error).message,
      component: 'auth',
    });
    throw new Error('Invalid token');
  }
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  logger.debug('Getting auth token from cookies', {
    hasToken: !!token,
    tokenLength: token?.length || 0,
    component: 'auth'
  });
  return token;
}

export async function setAuthToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  logger.debug('Setting auth token cookie', {
    tokenLength: token.length,
    secure: authConfig.cookieSecure,
    maxAge: authConfig.cookieMaxAge,
    component: 'auth'
  });

  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: authConfig.cookieSecure,
    sameSite: 'lax',
    maxAge: authConfig.cookieMaxAge,
    path: '/',
  });

  logger.debug('Auth token cookie set successfully', { component: 'auth' });
}

export async function removeAuthToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}

export function generateResetToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function getResetTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1); // Token expires in 1 hour
  return expiry;
}

/**
 * Generates a cryptographically secure email verification token
 */
export function generateEmailVerificationToken(): string {
  // Generate a secure random token using crypto
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Gets the expiry time for email verification token (24 hours from now)
 */
export function getEmailVerificationTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // Token expires in 24 hours
  return expiry;
}
