import { useCallback, useEffect, useRef, useState } from 'react';

const PAGE_SIZE = 50;

/**
 * Loads a list page by page (infinite scroll).
 *
 * - `reload()` starts again from the first page (pull to refresh, new search).
 * - `loadMore()` fetches the next page; call it from FlatList.onEndReached.
 * - Answers to an older request (e.g. a previous search) are dropped, so fast
 *   typing never shows the results of an old query.
 */
export function usePagedList<T>(
  fetchPage: (skip: number, limit: number) => Promise<T[]>,
  deps: unknown[] = []
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchRef = useCallback(fetchPage, deps);

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const page = await fetchRef(0, PAGE_SIZE);
      if (id !== requestId.current) return;
      setItems(page);
      setHasMore(page.length === PAGE_SIZE);
    } catch (e) {
      if (id === requestId.current) setError(e instanceof Error ? e.message : 'Hata oluştu');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [fetchRef]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const page = await fetchRef(items.length, PAGE_SIZE);
      if (id !== requestId.current) return;
      setItems((prev) => [...prev, ...page]);
      setHasMore(page.length === PAGE_SIZE);
    } catch (e) {
      if (id === requestId.current) setError(e instanceof Error ? e.message : 'Hata oluştu');
    } finally {
      setLoadingMore(false);
    }
  }, [fetchRef, hasMore, items.length, loading, loadingMore]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, loadingMore, hasMore, error, reload, loadMore };
}

/** Value that only updates after `delayMs` without changes (for search boxes). */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
