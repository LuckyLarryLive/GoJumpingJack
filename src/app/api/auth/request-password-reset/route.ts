import { NextResponse } from 'next/server';
import { passwordResetRequestSchema } from '@/types/user';
import { generateResetToken, getResetTokenExpiry } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

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
      .select('id, email')
      .ilike('email', validatedData.email.toLowerCase())
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
