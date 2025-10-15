type FetchWithRetryConfig = {
  retries?: number; // max retry attempts
  retryDelayBaseMs?: number; // base delay for exponential backoff
  maxRetryDelayMs?: number; // max delay
  circuitBreakerThreshold?: number; // fail count before circuit breaker opens
  circuitBreakerCooldownMs?: number; // cooldown time before circuit breaker resets
};

type CircuitBreakerState = {
  failureCount: number;
  lastFailureTime: number | null;
  open: boolean;
};

const circuitBreakerState: CircuitBreakerState = {
  failureCount: 0,
  lastFailureTime: null,
  open: false
};

const DEFAULT_RETRIES = 5;
const DEFAULT_RETRY_DELAY_BASE_MS = 300;
const DEFAULT_MAX_RETRY_DELAY_MS = 5000;
const DEFAULT_CIRCUIT_BREAKER_THRESHOLD = 10;
const DEFAULT_CIRCUIT_BREAKER_COOLDOWN_MS = 60000;

function isRetryableError(status: number): boolean {
  // Retry on network failures, 5xx errors, 429 Too Many Requests
  return status === 429 || (status >= 500 && status < 600);
}

/**
 * Sleep for ms milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exponential backoff with jitter delay calculation
 */
function getExponentialBackoffDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  const expDelay = Math.min(maxDelay, baseDelay * 2 ** attempt);
  // jitter: random between 50% and 100% of expDelay
  return expDelay / 2 + Math.random() * (expDelay / 2);
}

/**
 * fetchWithRetry implements retries with exponential backoff, jitter and circuit breaker
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  config?: FetchWithRetryConfig
): Promise<Response> {
  const retries = config?.retries ?? DEFAULT_RETRIES;
  const retryDelayBaseMs =
    config?.retryDelayBaseMs ?? DEFAULT_RETRY_DELAY_BASE_MS;
  const maxRetryDelayMs = config?.maxRetryDelayMs ?? DEFAULT_MAX_RETRY_DELAY_MS;
  const circuitBreakerThreshold =
    config?.circuitBreakerThreshold ?? DEFAULT_CIRCUIT_BREAKER_THRESHOLD;
  const circuitBreakerCooldownMs =
    config?.circuitBreakerCooldownMs ?? DEFAULT_CIRCUIT_BREAKER_COOLDOWN_MS;

  // Circuit breaker logic: if open and cooldown period passed, reset breaker
  if (circuitBreakerState.open) {
    const now = Date.now();
    if (
      circuitBreakerState.lastFailureTime &&
      now - circuitBreakerState.lastFailureTime > circuitBreakerCooldownMs
    ) {
      // Reset circuit breaker
      circuitBreakerState.open = false;
      circuitBreakerState.failureCount = 0;
      circuitBreakerState.lastFailureTime = null;
      // eslint-disable-next-line no-console
      console.info('[Circuit Breaker] Reset after cooldown');
    } else {
      // Circuit breaker open - reject immediately
      return Promise.reject(
        new Error('Circuit breaker open: temporarily rejecting requests')
      );
    }
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        if (isRetryableError(response.status)) {
          // Retryable error
          if (attempt < retries) {
            const delay = getExponentialBackoffDelay(
              attempt,
              retryDelayBaseMs,
              maxRetryDelayMs
            );
            // eslint-disable-next-line no-console
            console.warn(
              `[fetchWithRetry] Attempt ${attempt + 1} failed with status ${response.status}. Retrying in ${delay.toFixed(0)}ms...`
            );
            await sleep(delay);
            continue;
          } else {
            // Max retries reached, count failure for circuit breaker and throw
            circuitBreakerState.failureCount++;
            circuitBreakerState.lastFailureTime = Date.now();
            if (circuitBreakerState.failureCount >= circuitBreakerThreshold) {
              circuitBreakerState.open = true;
              // eslint-disable-next-line no-console
              console.error(
                '[Circuit Breaker] Opened due to repeated failures'
              );
            }
            throw new Error(
              `Max retries reached. Last status: ${response.status}`
            );
          }
        } else {
          // Non-retryable HTTP error, throw immediately
          return response;
        }
      }

      // Success! Reset failure count
      circuitBreakerState.failureCount = 0;
      circuitBreakerState.lastFailureTime = null;
      return response;
    } catch (error) {
      // Network or other fetch failure
      if (attempt < retries) {
        const delay = getExponentialBackoffDelay(
          attempt,
          retryDelayBaseMs,
          maxRetryDelayMs
        );
        // eslint-disable-next-line no-console
        console.warn(
          `[fetchWithRetry] Attempt ${attempt + 1} failed with error: ${error instanceof Error ? error.message : error}. Retrying in ${delay.toFixed(0)}ms...`
        );
        await sleep(delay);
        continue;
      } else {
        // Max retries reached - circuit breaker increment and throw
        circuitBreakerState.failureCount++;
        circuitBreakerState.lastFailureTime = Date.now();
        if (circuitBreakerState.failureCount >= circuitBreakerThreshold) {
          circuitBreakerState.open = true;
          // eslint-disable-next-line no-console
          console.error('[Circuit Breaker] Opened due to repeated failures');
        }
        throw error;
      }
    }
  }

  // Should never reach here, but throw as fallback
  throw new Error('fetchWithRetry failed unexpectedly');
}
