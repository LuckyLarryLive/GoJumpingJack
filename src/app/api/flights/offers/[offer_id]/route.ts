import { NextRequest, NextResponse } from 'next/server';
import { getOfferDetails } from '@/lib/duffel';
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

    console.log('API: Fetching offer details for:', validatedOfferId);

    // Handle test offer ID
    if (validatedOfferId === 'off_test_123456789') {
      const testResponse = await fetch('http://localhost:3000/api/flights/offers/test');
      const testData = await testResponse.json();
      return NextResponse.json({
        success: true,
        data: testData.data,
      });
    }

    // Fetch offer details from Duffel API
    const offerData = await getOfferDetails(validatedOfferId);

    if (!offerData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Offer not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: offerData,
    });
  } catch (error: unknown) {
    console.error('Error fetching offer details:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid offer ID format',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle Duffel API errors
    if (
      error instanceof Error &&
      (error.message?.includes('offer_not_found') || (error as { status?: number }).status === 404)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'This flight offer has expired or is no longer available. Please search again.',
        },
        { status: 404 }
      );
    }

    // Handle other errors
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch offer details';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
