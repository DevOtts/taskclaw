import { Logger } from '@nestjs/common';

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds for exponential backoff (default: 1000) */
  baseDelayMs?: number;
  /** Multiplier for exponential backoff (default: 3) → delays: 1s, 3s, 9s */
  backoffMultiplier?: number;
  /** Predicate to decide if an error is retryable (default: network + 5xx errors) */
  isRetryable?: (error: any) => boolean;
  /** Logger instance for retry attempt logging */
  logger?: Logger;
  /** Label for log messages */
  operationName?: string;
}

/**
 * Determines whether an error is retryable.
 * Retries on network errors and 5xx status codes.
 * Does NOT retry on 4xx client errors.
 */
export function isRetryableError(error: any): boolean {
  // Network errors (fetch failures, timeouts, connection refused, etc.)
  if (
    error.name === 'TypeError' || // fetch network failure
    error.code === 'ECONNREFUSED' ||
    error.code === 'ECONNRESET' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'UND_ERR_CONNECT_TIMEOUT' ||
    error.name === 'AbortError'
  ) {
    return true;
  }

  // Check for HTTP status code in error message (e.g., "API error (503): ...")
  const statusMatch = error.message?.match(/\((\d{3})\)/);
  if (statusMatch) {
    const statusCode = parseInt(statusMatch[1], 10);
    // Retry on 5xx server errors, do NOT retry on 4xx client errors
    return statusCode >= 500 && statusCode < 600;
  }

  // Check for status property directly (some HTTP libraries set this)
  if (typeof error.status === 'number') {
    return error.status >= 500 && error.status < 600;
  }

  if (typeof error.statusCode === 'number') {
    return error.statusCode >= 500 && error.statusCode < 600;
  }

  // Unknown errors — don't retry by default
  return false;
}

/**
 * Execute an async function with retry logic and exponential backoff.
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration
 * @returns The result of the function
 * @throws The last error if all retries are exhausted
 *
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => fetch('https://api.example.com/data'),
 *   { maxRetries: 3, baseDelayMs: 1000, backoffMultiplier: 3 },
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    backoffMultiplier = 3,
    isRetryable = isRetryableError,
    logger,
    operationName = 'operation',
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // If this was the last attempt, don't retry
      if (attempt >= maxRetries) {
        break;
      }

      // Check if the error is retryable
      if (!isRetryable(error)) {
        if (logger) {
          logger.warn(
            `[${operationName}] Non-retryable error on attempt ${attempt + 1}/${maxRetries + 1}: ${(error as Error).message}`,
          );
        }
        break;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelayMs * Math.pow(backoffMultiplier, attempt);

      if (logger) {
        logger.warn(
          `[${operationName}] Attempt ${attempt + 1}/${maxRetries + 1} failed: ${(error as Error).message}. ` +
            `Retrying in ${delay}ms...`,
        );
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
