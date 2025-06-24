import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const today = new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(today.getFullYear() + 1);

    const dateConstraints = {
      format: {
        type: 'string',
        pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        description: 'ISO 8601 date format (YYYY-MM-DD)',
        example: '2024-04-01',
      },
      validation: {
        regex: '^\\d{4}-\\d{2}-\\d{2}$',
        dateFormat: 'YYYY-MM-DD',
        allowedSeparators: ['-'],
        requiredFields: ['year', 'month', 'day'],
      },
      constraints: {
        departureDate: {
          minDate: today.toISOString().split('T')[0],
          maxDate: oneYearFromNow.toISOString().split('T')[0],
          description: 'Must be between today and one year from now',
        },
        returnDate: {
          minDate: 'Same as departure date',
          maxDate: '365 days after departure date',
          description: 'Must be after departure date and within one year',
        },
        bookingWindow: {
          minDays: 0,
          maxDays: 365,
          description: 'Can book flights up to one year in advance',
        },
        blackoutDates: {
          description: 'Some airlines may have blackout dates during peak seasons',
          examples: [
            'Christmas (Dec 24-26)',
            'New Year (Dec 31-Jan 2)',
            'Thanksgiving (US)',
            'Easter',
          ],
        },
      },
      timeConstraints: {
        departureTime: {
          format: 'HH:mm',
          description: '24-hour format',
          example: '14:30',
        },
        arrivalTime: {
          format: 'HH:mm',
          description: '24-hour format',
          example: '16:45',
        },
        timezone: {
          format: 'UTC±HH:mm',
          description: 'Airport local time in UTC offset',
          example: 'UTC+00:00',
        },
      },
      commonRules: {
        sameDayBooking: {
          allowed: true,
          restrictions: 'Must be at least 2 hours before departure',
        },
        lastMinuteBooking: {
          allowed: true,
          restrictions: 'Must be at least 1 hour before departure',
        },
        dateChanges: {
          allowed: true,
          restrictions: 'Subject to airline policy and fees',
        },
      },
    };

    return NextResponse.json({
      success: true,
      message: 'Successfully retrieved date constraints',
      data: dateConstraints,
    });
  } catch (error: any) {
    console.error('Error retrieving date constraints:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to retrieve date constraints',
      },
      { status: 500 }
    );
  }
}
