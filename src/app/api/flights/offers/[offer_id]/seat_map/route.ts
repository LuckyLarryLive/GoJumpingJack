import { NextRequest, NextResponse } from 'next/server';
import { getSeatMaps } from '@/lib/duffel';
import { OfferIdSchema } from '@/types/duffel';
import { z } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ offer_id: string }> }
) {
  try {
    // Await the params promise and validate the offer_id parameter
    const resolvedParams = await params;
    const validatedOfferId = OfferIdSchema.parse(resolvedParams.offer_id);

    console.log('API: Fetching seat maps for offer:', validatedOfferId);

    // Handle test offer ID - simulate no seat maps available
    if (validatedOfferId === 'off_test_123456789') {
      return NextResponse.json({
        success: true,
        available: false,
        data: [],
        message:
          'Online seat selection is not available for this airline. Seats will be assigned during check-in.',
      });
    }

    // Fetch seat maps from Duffel API
    const seatMapsData = await getSeatMaps(validatedOfferId);

    // Check if seat maps are available
    const available = seatMapsData && seatMapsData.length > 0;

    return NextResponse.json({
      success: true,
      available,
      data: available ? seatMapsData : [],
      message: available
        ? 'Seat maps retrieved successfully'
        : 'Online seat selection is not available for this airline. Seats will be assigned during check-in.',
    });
  } catch (error: unknown) {
    console.error('Error fetching seat maps:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          available: false,
          error: 'Invalid offer ID format',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle Duffel API errors - seat maps not available is not an error
    if (
      error instanceof Error &&
      (error.message?.includes('seat_maps_not_available') ||
        error.message?.includes('not_supported') ||
        (error as { status?: number }).status === 404)
    ) {
      return NextResponse.json({
        success: true,
        available: false,
        data: [],
        message:
          'Online seat selection is not available for this airline. Seats will be assigned during check-in.',
      });
    }

    // Handle offer not found
    if (error instanceof Error && error.message?.includes('offer_not_found')) {
      return NextResponse.json(
        {
          success: false,
          available: false,
          error: 'This flight offer has expired or is no longer available.',
        },
        { status: 404 }
      );
    }

    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch seat maps';
    return NextResponse.json(
      {
        success: false,
        available: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
