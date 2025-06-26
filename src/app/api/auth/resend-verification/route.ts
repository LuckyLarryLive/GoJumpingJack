import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateEmailVerificationToken, getEmailVerificationTokenExpiry } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Force Node.js runtime for database operations
export const runtime = 'nodejs';

function getSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

  return createClient(supabaseUrl, serviceKey);
}

// Schema for resend verification request
const resendVerificationSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = resendVerificationSchema.parse(body);

    const supabase = getSupabaseServiceClient();

    logger.info('Resend verification email request', {
      email: validatedData.email,
      component: 'resend-verification',
    });

    // Find user by email (case-insensitive)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, email_verified, first_name, last_name')
      .ilike('email', validatedData.email.toLowerCase())
      .single();

    if (error || !user) {
      // Return success even if user doesn't exist to prevent email enumeration
      logger.warn('Resend verification requested for non-existent email', {
        email: validatedData.email,
        component: 'resend-verification',
      });
      return NextResponse.json({ success: true });
    }

    // Check if email is already verified
    if (user.email_verified) {
      logger.info('Resend verification requested for already verified email', {
        userId: user.id,
        email: user.email,
        component: 'resend-verification',
      });
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate new verification token
    const emailVerificationToken = generateEmailVerificationToken();
    const emailVerificationTokenExpiresAt = getEmailVerificationTokenExpiry();

    // Update user with new verification token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verification_token: emailVerificationToken,
        email_verification_token_expires_at: emailVerificationTokenExpiresAt,
      })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Failed to update verification token', updateError, {
        userId: user.id,
        email: user.email,
        component: 'resend-verification',
      });
      throw updateError;
    }

    // Send verification email
    try {
      const userName = user.first_name && user.last_name 
        ? `${user.first_name} ${user.last_name}`
        : user.first_name || 'User';

      await sendVerificationEmail(
        user.email,
        userName,
        emailVerificationToken
      );

      logger.info('Verification email resent successfully', {
        userId: user.id,
        email: user.email,
        component: 'resend-verification',
      });
    } catch (emailError) {
      logger.error('Failed to resend verification email', emailError as Error, {
        userId: user.id,
        email: user.email,
        component: 'resend-verification',
      });
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid resend verification request', {
        errors: error.errors,
        component: 'resend-verification',
      });
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    logger.error('Resend verification error', error as Error, {
      component: 'resend-verification',
    });
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}
