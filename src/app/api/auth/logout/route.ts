import { NextResponse } from 'next/server';
import { removeAuthToken } from '@/lib/auth';

export async function POST() {
  try {
    removeAuthToken();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
