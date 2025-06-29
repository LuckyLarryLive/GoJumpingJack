import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchSection from '@/components/SearchSection';
import { CurrencyProvider } from '@/contexts/CurrencyContext';

// Mock the AirportSearchInput component
jest.mock('@/components/AirportSearchInput', () => {
  return function MockAirportSearchInput({
    id,
    label,
    placeholder,
    onAirportSelect,
    initialDisplayValue,
  }: {
    id: string;
    label: string;
    placeholder: string;
    onAirportSelect: (airport: { airport_code: string; display_name: string }) => void;
    initialDisplayValue?: string;
  }) {
    return (
      <div data-testid={`airport-input-${id}`}>
        <label>{label}</label>
        <input
          placeholder={placeholder}
          defaultValue={initialDisplayValue}
          onChange={() => {
            // Simulate airport selection
            onAirportSelect({
              airport_code: 'LAX',
              airport_name: 'Los Angeles International Airport',
              city_name: 'Los Angeles',
              city_code: 'LAX',
            });
          }}
        />
      </div>
    );
  };
});

// Mock fetch for background image API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        imageUrl: 'https://example.com/image.jpg',
        photographerName: 'Test Photographer',
        photographerProfileUrl: 'https://example.com/photographer',
        unsplashUrl: 'https://example.com/unsplash',
      }),
  })
) as jest.Mock;

describe('SearchSection', () => {
  const mockOnSearchSubmit = jest.fn();

  const renderWithProvider = (component: React.ReactElement) => {
    return render(<CurrencyProvider>{component}</CurrencyProvider>);
  };

  beforeEach(() => {
    mockOnSearchSubmit.mockClear();
    (global.fetch as jest.Mock).mockClear();
  });

  test('renders search form elements', () => {
    renderWithProvider(<SearchSection onSearchSubmit={mockOnSearchSubmit} />);

    // Check for trip type radio buttons by value
    expect(screen.getByDisplayValue('round-trip')).toBeInTheDocument();
    expect(screen.getByDisplayValue('one-way')).toBeInTheDocument();

    // Check for airport inputs
    expect(screen.getByTestId('airport-input-from')).toBeInTheDocument();
    expect(screen.getByTestId('airport-input-to')).toBeInTheDocument();

    // Check for date inputs by ID
    expect(screen.getByRole('textbox', { name: /depart/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /return/i })).toBeInTheDocument();

    // Check for passenger controls
    expect(screen.getByText(/adults/i)).toBeInTheDocument();

    // Check for search button
    expect(screen.getByRole('button', { name: /search flights/i })).toBeInTheDocument();
  });

  test('handles trip type selection', async () => {
    const user = userEvent.setup();
    renderWithProvider(<SearchSection onSearchSubmit={mockOnSearchSubmit} />);

    const oneWayRadio = screen.getByDisplayValue('one-way');
    await user.click(oneWayRadio);

    expect(oneWayRadio).toBeChecked();

    // Return date input should be disabled for one-way trips
    const returnDateInput = screen.getByRole('textbox', { name: /return/i });
    expect(returnDateInput).toBeDisabled();
  });

  test('handles passenger count changes', async () => {
    const user = userEvent.setup();
    renderWithProvider(<SearchSection onSearchSubmit={mockOnSearchSubmit} />);

    // Find adult passenger increment button (the + button)
    const buttons = screen.getAllByRole('button');
    const adultIncrement = buttons.find(button => button.textContent === '+');

    if (adultIncrement) {
      await user.click(adultIncrement);
    }

    // Should show 2 adults now (look for the span with count)
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('validates required fields before submission', async () => {
    const user = userEvent.setup();
    renderWithProvider(<SearchSection onSearchSubmit={mockOnSearchSubmit} />);

    const searchButton = screen.getByRole('button', { name: /search flights/i });
    await user.click(searchButton);

    // Should not call onSearchSubmit if required fields are missing
    expect(mockOnSearchSubmit).not.toHaveBeenCalled();
  });

  test('submits form with valid data', async () => {
    const user = userEvent.setup();
    renderWithProvider(<SearchSection onSearchSubmit={mockOnSearchSubmit} />);

    // Fill in required fields
    const fromInput = screen.getByTestId('airport-input-from').querySelector('input');
    const toInput = screen.getByTestId('airport-input-to').querySelector('input');
    const departureDate = screen.getByRole('textbox', { name: /depart/i });

    if (fromInput && toInput) {
      await user.type(fromInput, 'LAX');
      await user.type(toInput, 'JFK');
    }

    // Set departure date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];

    await user.type(departureDate, tomorrowString);

    // Submit form
    const searchButton = screen.getByRole('button', { name: /search flights/i });
    await user.click(searchButton);

    // Should call onSearchSubmit with form data
    await waitFor(() => {
      expect(mockOnSearchSubmit).toHaveBeenCalled();
    });
  });

  test('displays background image when loaded', async () => {
    renderWithProvider(<SearchSection onSearchSubmit={mockOnSearchSubmit} />);

    // Wait for background image to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Check if attribution is displayed
    await waitFor(() => {
      expect(screen.getByText(/photo by/i)).toBeInTheDocument();
    });
  });

  test('handles minimized state', () => {
    renderWithProvider(<SearchSection onSearchSubmit={mockOnSearchSubmit} />);

    // Initially should be in expanded state
    expect(screen.getByRole('button', { name: /search flights/i })).toBeInTheDocument();

    // Test minimized state by checking if the form can be minimized
    // This would require triggering the minimize functionality
    // The exact implementation depends on how minimization is triggered
  });

  test('displays basic form structure', () => {
    renderWithProvider(<SearchSection onSearchSubmit={mockOnSearchSubmit} />);

    // Check that the form renders without errors
    expect(screen.getByRole('button', { name: /search flights/i })).toBeInTheDocument();
    expect(screen.getByText(/adults/i)).toBeInTheDocument();
    expect(screen.getByText(/children/i)).toBeInTheDocument();
    expect(screen.getByText(/infants/i)).toBeInTheDocument();
  });
});
