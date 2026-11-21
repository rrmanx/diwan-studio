import { useCallback, useEffect, useState, type DependencyList } from 'react';

const FALLBACK = 'تعذّر الوصول إلى الديوان. تحقّق من الاتصال ثم أعد المحاولة.';

export function errorMessage(error: unknown): string {
  if (error !== null && typeof error === 'object') {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim() !== '') return message;
  }
  return FALLBACK;
}

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/** Runs `load` on `deps`, discarding results from abandoned requests. */
export function useAsync<T>(load: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    setState((previous) => ({ ...previous, loading: true, error: null }));
    load().then(
      (data) => {
        if (active) setState({ data, error: null, loading: false });
      },
      (error: unknown) => {
        if (active) setState({ data: null, error: errorMessage(error), loading: false });
      },
    );
    return () => {
      active = false;
    };
    // `load` is deliberately excluded; `deps` lists every value it reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, reload };
}
