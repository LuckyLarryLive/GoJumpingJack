import { NextResponse } from 'next/server';
import { passwordResetRequestSchema } from '@/types/user';
import { generateResetToken, getResetTokenExpiry } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = passwordResetRequestSchema.parse(body);

    // Get user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', validatedData.email)
      .single();

    if (error || !user) {
      // Return success even if user doesn't exist to prevent email enumeration
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

    // TODO: Send password reset email
    // This would typically involve calling your email service provider
    // For now, we'll just log the token (in production, you'd send an email)
    console.log('Password reset token:', resetToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
