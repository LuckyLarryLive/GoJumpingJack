import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { signupStep2Schema } from '@/types/user';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Middleware to verify authentication
async function verifyAuth(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    // Remove sensitive fields
    const { password_hash, reset_password_token, reset_password_expires, ...profile } = data;
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = signupStep2Schema.parse(body);

    // Update user profile
    const { error } = await supabase
      .from('users')
      .update({
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        date_of_birth: validatedData.dateOfBirth,
        phone_number: validatedData.phoneNumber,
        home_airport_iata_code: validatedData.homeAirportIataCode,
        avoided_airline_iata_codes: validatedData.avoidedAirlineIataCodes,
        default_cabin_class: validatedData.defaultCabinClass,
        default_adult_passengers: validatedData.defaultAdultPassengers,
        default_child_passengers: validatedData.defaultChildPassengers,
        default_infant_passengers: validatedData.defaultInfantPassengers,
        loyalty_programs: validatedData.loyaltyPrograms,
      })
      .eq('id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
} 