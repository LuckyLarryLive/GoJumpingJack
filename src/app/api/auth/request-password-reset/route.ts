import { NextResponse } from 'next/server';
import { passwordResetRequestSchema } from '@/types/user';
import { generateResetToken, getResetTokenExpiry } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { sendPasswordResetEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

function getSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

  return createClient(supabaseUrl, serviceKey);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = passwordResetRequestSchema.parse(body);

    const supabase = getSupabaseServiceClient();

    // Get user by email (case-insensitive)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .ilike('email', validatedData.email.toLowerCase())
      .single();

    if (error || !user) {
      // Return success even if user doesn't exist to prevent email enumeration
      logger.warn('Password reset requested for non-existent email', {
        email: validatedData.email,
        component: 'password-reset',
      });
      return NextResponse.json({ success: true });
    }

    // Generate reset token and expiry
    const resetToken = generateResetToken();
    const resetTokenExpiry = getResetTokenExpiry();

    // Update user with reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_password_token: resetToken,
        reset_password_expires: resetTokenExpiry,
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Send password reset email
    try {
      const userName = user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.first_name || 'User';

      await sendPasswordResetEmail(user.email, userName, resetToken);

      logger.info('Password reset email sent', {
        userId: user.id,
        email: user.email,
        component: 'password-reset',
      });
    } catch (emailError) {
      logger.error('Failed to send password reset email', emailError as Error, {
        userId: user.id,
        email: user.email,
        component: 'password-reset',
      });
      // Don't fail the request if email fails, but log the error
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
