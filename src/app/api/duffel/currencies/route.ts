import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const currencies = [
      {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        isDefault: true,
      },
      {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        isDefault: false,
      },
      {
        code: 'GBP',
        name: 'British Pound',
        symbol: '£',
        isDefault: false,
      },
      {
        code: 'CAD',
        name: 'Canadian Dollar',
        symbol: 'C$',
        isDefault: false,
      },
      {
        code: 'AUD',
        name: 'Australian Dollar',
        symbol: 'A$',
        isDefault: false,
      },
      {
        code: 'JPY',
        name: 'Japanese Yen',
        symbol: '¥',
        isDefault: false,
      },
      {
        code: 'CNY',
        name: 'Chinese Yuan',
        symbol: '¥',
        isDefault: false,
      },
      {
        code: 'INR',
        name: 'Indian Rupee',
        symbol: '₹',
        isDefault: false,
      },
      {
        code: 'BRL',
        name: 'Brazilian Real',
        symbol: 'R$',
        isDefault: false,
      },
      {
        code: 'MXN',
        name: 'Mexican Peso',
        symbol: 'Mex$',
        isDefault: false,
      },
    ];

    return NextResponse.json({
      success: true,
      message: 'Successfully retrieved currencies',
      data: currencies,
    });
  } catch (error: any) {
    console.error('Error retrieving currencies:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to retrieve currencies',
      },
      { status: 500 }
    );
  }
} 