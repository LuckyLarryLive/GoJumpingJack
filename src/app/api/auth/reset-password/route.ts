import { NextResponse } from 'next/server';
import { passwordResetSchema } from '@/types/user';
import { hashPassword } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = passwordResetSchema.parse(body);

    // Get user by reset token
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('reset_password_token', validatedData.token)
      .gt('reset_password_expires', new Date().toISOString())
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    // Hash new password
    const passwordHash = await hashPassword(validatedData.password);

    // Update user's password and clear reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        reset_password_token: null,
        reset_password_expires: null,
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
