import { logger, measureTime } from '@/lib/logger';

// Mock console methods
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Replace console methods
Object.assign(console, mockConsole);

describe('Logger', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    Object.values(mockConsole).forEach(mock => mock.mockClear());
    // Reset log level
    process.env.LOG_LEVEL = 'debug';
  });

  describe('Basic logging methods', () => {
    test('should log debug messages', () => {
      // Create a new logger instance to pick up the LOG_LEVEL change
      const { logger: testLogger } = require('@/lib/logger');
      testLogger.debug('Test debug message');
      expect(mockConsole.debug).toHaveBeenCalledWith(expect.stringContaining('Test debug message'));
    });

    test('should log info messages', () => {
      logger.info('Test info message');
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('Test info message'));
    });

    test('should log warning messages', () => {
      logger.warn('Test warning message');
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Test warning message')
      );
    });

    test('should log error messages', () => {
      const error = new Error('Test error');
      logger.error('Test error message', error);
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('Test error message'));
    });
  });

  describe('Contextual logging', () => {
    test('should include context in log messages', () => {
      const context = { userId: '123', component: 'test' };
      logger.info('Test with context', context);
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('Test with context'));
    });

    test('should log API requests', () => {
      logger.apiRequest('GET', '/api/test');
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('API GET /api/test'));
    });

    test('should log API responses', () => {
      logger.apiResponse('GET', '/api/test', 200, 150);
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('API GET /api/test - 200 (150ms)')
      );
    });

    test('should log user actions', () => {
      logger.userAction('login', 'user123');
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('User action: login'));
    });

    test('should log authentication actions', () => {
      logger.authAction('login_attempt');
      expect(mockConsole.info).toHaveBeenCalledWith(expect.stringContaining('Auth: login_attempt'));
    });
  });

  describe('Performance logging', () => {
    test('should log performance metrics', () => {
      logger.performance('database_query', 250);
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Performance: database_query took 250ms')
      );
    });

    test('should warn for slow operations', () => {
      logger.performance('slow_operation', 6000);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Performance: slow_operation took 6000ms')
      );
    });
  });

  describe('Security logging', () => {
    test('should log security events', () => {
      logger.security('failed_login_attempt');
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Security event: failed_login_attempt')
      );
    });
  });
});

describe('measureTime utility', () => {
  beforeEach(() => {
    Object.values(mockConsole).forEach(mock => mock.mockClear());
  });

  test('should measure execution time for successful operations', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');

    const result = await measureTime('test_operation', mockFn);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalled();
    expect(mockConsole.info).toHaveBeenCalledWith(
      expect.stringContaining('Performance: test_operation took')
    );
  });

  test('should measure execution time for failed operations', async () => {
    const error = new Error('Test error');
    const mockFn = jest.fn().mockRejectedValue(error);

    await expect(measureTime('test_operation', mockFn)).rejects.toThrow('Test error');

    expect(mockFn).toHaveBeenCalled();
    expect(mockConsole.error).toHaveBeenCalledWith(
      expect.stringContaining('test_operation failed after')
    );
  });

  test('should include context in performance measurements', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const context = { userId: '123' };

    await measureTime('test_operation', mockFn, context);

    expect(mockConsole.info).toHaveBeenCalledWith(
      expect.stringContaining('Performance: test_operation took')
    );
  });
});
