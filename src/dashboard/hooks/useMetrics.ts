import { useCallback, useEffect, useState } from 'react';

interface UseMetricsResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMetrics<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  enabled = true,
): UseMetricsResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);
    fetcher()
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!enabled) return;
    fetch();
  }, [fetch, enabled]);

  return { data, loading, error, refetch: fetch };
}
