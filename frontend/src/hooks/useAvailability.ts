import { useState, useEffect } from 'react';
import client from '../api/client';

export type AvailabilityStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

/**
 * Debounced availability check against a backend endpoint.
 * Cancels in-flight requests via AbortController when value changes.
 *
 * @param value    Current field value
 * @param endpoint e.g. '/auth/check-username'
 * @param param    Query param name, e.g. 'username' or 'email'
 * @param minLen   Skip the check below this length
 * @param delay    Debounce delay in ms (default 400)
 */
export function useAvailability(
  value: string,
  endpoint: string,
  param: string,
  minLen = 3,
  delay = 400
): AvailabilityStatus {
  const [status, setStatus] = useState<AvailabilityStatus>('idle');

  useEffect(() => {
    if (value.length < minLen) {
      setStatus('idle');
      return;
    }

    setStatus('checking');

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const { data } = await client.get<{ available: boolean }>(endpoint, {
          params: { [param]: value },
          signal: controller.signal,
        });
        setStatus(data.available ? 'available' : 'taken');
      } catch (err: unknown) {
        // Ignore aborted requests — a new one is already in flight
        if (err instanceof Error && err.name === 'CanceledError') return;
        setStatus('error');
      }
    }, delay);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, endpoint, param, minLen, delay]);

  return status;
}
