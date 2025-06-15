import { NextResponse } from 'next/server';
import { hashPassword, generateToken, setAuthToken } from '@/lib/auth';
import { signupStep1Schema, signupStep2Schema } from '@/types/user';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { step, data } = body;

    if (step === 1) {
      // Validate step 1 data
      const validatedData = signupStep1Schema.parse(data);

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', validatedData.email)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }

      // Hash password
      const passwordHash = await hashPassword(validatedData.password);

      // Create user with basic info
      const { data: user, error } = await supabase
        .from('users')
        .insert([
          {
            email: validatedData.email,
            password_hash: passwordHash,
            site_rewards_tokens: 0,
            email_verified: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Generate token and set cookie
      const token = generateToken(user);
      setAuthToken(token);

      return NextResponse.json({ success: true, userId: user.id });
    } else if (step === 2) {
      // Convert dateOfBirth to Date if it's a string
      if (typeof data.dateOfBirth === 'string') {
        data.dateOfBirth = new Date(data.dateOfBirth);
      }
      // Validate step 2 data
      const validatedData = signupStep2Schema.parse(data);

      // Update user with profile information
      let homeAirportValue = validatedData.homeAirportIataCode;
      if (homeAirportValue && typeof homeAirportValue === 'string' && homeAirportValue.length !== 3) {
        // Save city name as is if not a 3-letter IATA code
        homeAirportValue = validatedData.homeAirportIataCode;
      }
      const { error } = await supabase
        .from('users')
        .update({
          first_name: validatedData.firstName,
          last_name: validatedData.lastName,
          date_of_birth: validatedData.dateOfBirth,
          phone_number: validatedData.phoneNumber,
          home_airport_iata_code: homeAirportValue,
          avoided_airline_iata_codes: validatedData.avoidedAirlineIataCodes,
          default_cabin_class: validatedData.defaultCabinClass,
          default_adult_passengers: validatedData.defaultAdultPassengers,
          default_child_passengers: validatedData.defaultChildPassengers,
          default_infant_passengers: validatedData.defaultInfantPassengers,
          loyalty_programs: validatedData.loyaltyPrograms,
        })
        .eq('id', body.userId);

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid signup step' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    let errorMessage = 'Failed to create account';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object') {
      errorMessage = JSON.stringify(error);
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 