import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Force Node.js runtime for database operations
export const runtime = 'nodejs';

function getSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

  return createClient(supabaseUrl, serviceKey);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      logger.warn('Email verification attempted without token', {
        component: 'email-verification',
      });
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    logger.info('Email verification attempt', {
      token: token.substring(0, 8) + '...',
      component: 'email-verification',
    });

    // Find user with matching verification token
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, email_verified, email_verification_token_expires_at, first_name, last_name')
      .eq('email_verification_token', token)
      .single();

    if (error || !user) {
      logger.warn('Invalid verification token used', {
        token: token.substring(0, 8) + '...',
        component: 'email-verification',
      });
      return NextResponse.json(
        { error: 'Invalid or expired verification link' },
        { status: 400 }
      );
    }

    // Check if email is already verified
    if (user.email_verified) {
      logger.info('Email already verified', {
        userId: user.id,
        email: user.email,
        component: 'email-verification',
      });
      return NextResponse.json(
        { message: 'Email already verified', alreadyVerified: true },
        { status: 200 }
      );
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(user.email_verification_token_expires_at);
    
    if (now > expiresAt) {
      logger.warn('Expired verification token used', {
        userId: user.id,
        email: user.email,
        expiresAt: expiresAt.toISOString(),
        component: 'email-verification',
      });
      return NextResponse.json(
        { error: 'Verification link has expired' },
        { status: 400 }
      );
    }

    // Update user to mark email as verified and clear verification token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        email_verification_token: null,
        email_verification_token_expires_at: null,
      })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Failed to update user verification status', updateError, {
        userId: user.id,
        email: user.email,
        component: 'email-verification',
      });
      throw updateError;
    }

    logger.info('Email verification successful', {
      userId: user.id,
      email: user.email,
      component: 'email-verification',
    });

    return NextResponse.json(
      { 
        message: 'Email successfully verified',
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
        }
      },
      { status: 200 }
    );

  } catch (error) {
    logger.error('Email verification error', error as Error, {
      component: 'email-verification',
    });
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}
