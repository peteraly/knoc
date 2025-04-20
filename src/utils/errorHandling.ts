import { toast } from 'react-hot-toast';
import { z } from 'zod';

// Custom error types
export class ValidationError extends Error {
  constructor(message: string, public details?: z.ZodError) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Error handler configuration
interface ErrorHandlerConfig {
  showToast?: boolean;
  logToConsole?: boolean;
  throwError?: boolean;
}

const defaultConfig: ErrorHandlerConfig = {
  showToast: true,
  logToConsole: true,
  throwError: false
};

// Main error handler
export function handleError(
  error: unknown, 
  customMessage?: string,
  config: ErrorHandlerConfig = defaultConfig
): void {
  const { showToast, logToConsole, throwError } = { ...defaultConfig, ...config };
  
  let message = customMessage || 'An unexpected error occurred';
  let details: Record<string, unknown> = {};
  
  // Parse different error types
  if (error instanceof ValidationError) {
    message = customMessage || 'Invalid data format';
    details = {
      validationErrors: error.details?.errors || []
    };
  } else if (error instanceof DatabaseError) {
    message = customMessage || 'Database operation failed';
    details = {
      code: error.code
    };
  } else if (error instanceof NetworkError) {
    message = customMessage || 'Network request failed';
  } else if (error instanceof Error) {
    message = customMessage || error.message;
    details = {
      name: error.name,
      stack: error.stack
    };
  }
  
  // Show toast notification
  if (showToast) {
    toast.error(message);
  }
  
  // Log to console
  if (logToConsole) {
    console.error('Error:', {
      message,
      type: error instanceof Error ? error.constructor.name : typeof error,
      details,
      originalError: error
    });
  }
  
  // Throw error if configured
  if (throwError) {
    throw error;
  }
}

// Validation wrapper
export async function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage?: string
): Promise<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        errorMessage || 'Data validation failed',
        error
      );
    }
    throw error;
  }
}

// Database operation wrapper
export async function handleDatabaseOperation<T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Error) {
      throw new DatabaseError(
        errorMessage || 'Database operation failed',
        'unknown'
      );
    }
    throw error;
  }
}

// Network request wrapper
export async function handleNetworkRequest<T>(
  request: () => Promise<T>,
  errorMessage?: string
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    throw new NetworkError(
      errorMessage || 'Network request failed'
    );
  }
} 