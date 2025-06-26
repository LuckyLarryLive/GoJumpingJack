import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { signupStep2Schema, profileUpdateSchema } from '@/types/user';
import { createClient } from '@supabase/supabase-js';

// Force Node.js runtime for JWT and crypto operations
export const runtime = 'nodejs';

function getSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

  return createClient(supabaseUrl, serviceKey);
}

// Middleware to verify authentication using cookies
async function verifyAuth(request: Request) {
  try {
    const { getAuthToken, verifyToken } = await import('@/lib/auth');
    const token = await getAuthToken();

    if (!token) {
      return null;
    }

    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServiceClient();

    // Get user profile
    const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();

    if (error) throw error;

    // Remove sensitive fields and transform to camelCase
    const {
      password_hash,
      reset_password_token,
      reset_password_expires,
      email_verification_token,
      email_verification_token_expires_at,
      first_name,
      middle_name,
      last_name,
      preferred_name,
      date_of_birth,
      phone_number,
      site_rewards_tokens,
      home_airport_iata_code,
      avoided_airline_iata_codes,
      default_cabin_class,
      default_adult_passengers,
      default_child_passengers,
      default_infant_passengers,
      loyalty_programs,
      created_at,
      updated_at,
      email_verified,
      ...otherFields
    } = data;

    // Transform to camelCase for frontend
    const profile = {
      ...otherFields,
      firstName: first_name,
      middleName: middle_name,
      lastName: last_name,
      preferredName: preferred_name,
      dateOfBirth: date_of_birth ? new Date(date_of_birth) : null,
      phoneNumber: phone_number,
      siteRewardsTokens: site_rewards_tokens || 0,
      homeAirportIataCode: home_airport_iata_code,
      avoidedAirlineIataCodes: avoided_airline_iata_codes,
      defaultCabinClass: default_cabin_class,
      defaultAdultPassengers: default_adult_passengers,
      defaultChildPassengers: default_child_passengers,
      defaultInfantPassengers: default_infant_passengers,
      loyaltyPrograms: loyalty_programs,
      createdAt: created_at ? new Date(created_at) : null,
      updatedAt: updated_at ? new Date(updated_at) : null,
      emailVerified: email_verified,
      emailVerificationToken: null, // Never expose this to frontend
      emailVerificationTokenExpiresAt: null, // Never expose this to frontend
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServiceClient();

    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    // Update user profile
    const { error } = await supabase
      .from('users')
      .update({
        first_name: validatedData.firstName,
        middle_name: validatedData.middleName || null,
        last_name: validatedData.lastName,
        preferred_name: validatedData.preferredName || null,
        date_of_birth: validatedData.dateOfBirth,
        phone_number: validatedData.phoneNumber,
        home_airport_iata_code: validatedData.homeAirportIataCode,
        avoided_airline_iata_codes: validatedData.avoidedAirlineIataCodes || null,
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
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
