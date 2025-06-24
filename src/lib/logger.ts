// src/lib/logger.ts
// Structured logging utility for GoJumpingJack

interface LogContext {
  userId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  [key: string]: any;
}

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logLevel = process.env.LOG_LEVEL || 'info';

  private shouldLog(level: string): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatLog(entry: LogEntry): string {
    if (this.isDevelopment) {
      // Pretty format for development
      const timestamp = new Date(entry.timestamp).toLocaleTimeString();
      const level = entry.level.toUpperCase().padEnd(5);
      const context = entry.context ? ` [${JSON.stringify(entry.context)}]` : '';
      const error = entry.error
        ? `\n  Error: ${entry.error.message}\n  Stack: ${entry.error.stack}`
        : '';
      return `${timestamp} ${level} ${entry.message}${context}${error}`;
    } else {
      // JSON format for production
      return JSON.stringify(entry);
    }
  }

  private log(
    level: LogEntry['level'],
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const formattedLog = this.formatLog(entry);

    // Output to appropriate console method
    switch (level) {
      case 'debug':
        console.debug(formattedLog);
        break;
      case 'info':
        console.info(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'error':
        console.error(formattedLog);
        break;
    }

    // In production, you might want to send logs to external service
    if (!this.isDevelopment) {
      this.sendToExternalService(entry);
    }
  }

  private sendToExternalService(entry: LogEntry): void {
    // TODO: Implement external logging service integration
    // Examples: Sentry, LogRocket, DataDog, etc.

    // For now, just ensure critical errors are visible
    if (entry.level === 'error') {
      // Could send to Sentry, email alerts, etc.
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  // Convenience methods for common use cases
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API ${method} ${path}`, { ...context, component: 'api' });
  }

  apiResponse(
    method: string,
    path: string,
    status: number,
    duration: number,
    context?: LogContext
  ): void {
    this.info(`API ${method} ${path} - ${status} (${duration}ms)`, {
      ...context,
      component: 'api',
      status,
      duration,
    });
  }

  apiError(method: string, path: string, error: Error, context?: LogContext): void {
    this.error(`API ${method} ${path} failed`, error, {
      ...context,
      component: 'api',
    });
  }

  duffelRequest(action: string, context?: LogContext): void {
    this.info(`Duffel API: ${action}`, { ...context, component: 'duffel' });
  }

  duffelError(action: string, error: Error, context?: LogContext): void {
    this.error(`Duffel API error: ${action}`, error, {
      ...context,
      component: 'duffel',
    });
  }

  userAction(action: string, userId: string, context?: LogContext): void {
    this.info(`User action: ${action}`, {
      ...context,
      userId,
      component: 'user',
    });
  }

  searchAction(action: string, searchParams: any, context?: LogContext): void {
    this.info(`Search: ${action}`, {
      ...context,
      searchParams,
      component: 'search',
    });
  }

  authAction(action: string, context?: LogContext): void {
    this.info(`Auth: ${action}`, {
      ...context,
      component: 'auth',
    });
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext): void {
    const level = duration > 5000 ? 'warn' : 'info'; // Warn if operation takes > 5s
    this.log(level, `Performance: ${operation} took ${duration}ms`, {
      ...context,
      component: 'performance',
      duration,
    });
  }

  // Security logging
  security(event: string, context?: LogContext): void {
    this.warn(`Security event: ${event}`, {
      ...context,
      component: 'security',
    });
  }
}

// Create singleton instance
export const logger = new Logger();

// Utility function to measure execution time
export async function measureTime<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.performance(operation, duration, context);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`${operation} failed after ${duration}ms`, error as Error, context);
    throw error;
  }
}

// Express/Next.js middleware helper
export function createRequestLogger() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(7);

    // Add request ID to request object for use in other parts of the app
    req.requestId = requestId;

    logger.apiRequest(req.method, req.url, { requestId });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (...args: any[]) {
      const duration = Date.now() - start;
      logger.apiResponse(req.method, req.url, res.statusCode, duration, { requestId });
      originalEnd.apply(this, args);
    };

    next();
  };
}

export default logger;
