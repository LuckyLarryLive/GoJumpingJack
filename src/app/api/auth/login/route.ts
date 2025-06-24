import { NextResponse } from 'next/server';
import { comparePasswords, generateToken, setAuthToken } from '@/lib/auth';
import { loginSchema } from '@/types/user';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Force Node.js runtime for auth routes that use bcrypt and JWT
export const runtime = 'nodejs';

function getSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

  return createClient(supabaseUrl, serviceKey);
}

export async function POST(request: Request) {
  const start = Date.now();
  try {
    logger.apiRequest('POST', '/api/auth/login');

    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    const supabase = getSupabaseServiceClient();

    logger.authAction('login_attempt', { email: validatedData.email });

    // Get user by email (case-insensitive)
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', validatedData.email.toLowerCase())
      .single();

    if (error || !user) {
      logger.authAction('login_failed', {
        email: validatedData.email,
        reason: 'user_not_found',
      });
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await comparePasswords(validatedData.password, user.password_hash);

    if (!isValidPassword) {
      logger.authAction('login_failed', {
        email: validatedData.email,
        reason: 'invalid_password',
      });
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate token and set cookie
    const token = generateToken(user);
    await setAuthToken(token);

    logger.authAction('login_success', {
      userId: user.id,
      email: validatedData.email,
    });

    // Return user data (excluding sensitive fields)
    const { password_hash, reset_password_token, reset_password_expires, ...userData } = user;

    const duration = Date.now() - start;
    logger.apiResponse('POST', '/api/auth/login', 200, duration);

    return NextResponse.json({ user: userData });
  } catch (error) {
    const duration = Date.now() - start;
    logger.apiError('POST', '/api/auth/login', error as Error);
    logger.apiResponse('POST', '/api/auth/login', 500, duration);

    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}
