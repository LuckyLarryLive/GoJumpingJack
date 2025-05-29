// Mock environment variables
process.env.DUFFEL_TEST_TOKEN = 'test_token';
process.env.DUFFEL_LIVE_TOKEN = 'live_token';
process.env.DUFFEL_MODE = 'test';

// Increase timeout for tests
jest.setTimeout(10000);

// Mock console.error to keep test output clean
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (args[0]?.includes?.('Error processing queued request:')) {
    return;
  }
  originalConsoleError(...args);
}; 