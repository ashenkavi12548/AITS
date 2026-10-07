import { useState, useEffect, useRef, useCallback } from 'react';
import { animalsService } from '@/services/animals.service';
import type { AnimalItem } from '@/types/animals';

interface UseAnimalTagSearchReturn {
  query: string;
  setQuery: (value: string) => void;
  results: AnimalItem[];
  isLoading: boolean;
  error: string | null;
  clearResults: () => void;
}

/**
 * Debounced animal tag search hook for mobile.
 * Calls GET /api/v1/animals?search=<query>&limit=10 with debounce.
 */
export function useAnimalTagSearch(debounceMs = 300): UseAnimalTagSearchReturn {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnimalItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clearResults = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setTimeout(() => {
        setResults([]);
        setError(null);
        setIsLoading(false);
      }, 0);
      return;
    }

    requestAnimationFrame(() => {
      setIsLoading(true);
      setError(null);
    });

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }

    timerRef.current = setTimeout(async () => {
      // Create an AbortController just to handle race conditions
      // Axios in mobile might not perfectly support aborting depending on version, 
      // but this handles component unmount and out-of-order responses gracefully.
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await animalsService.getAnimals({
          search: trimmed,
          limit: 10,
        });

        if (!controller.signal.aborted) {
          setResults(response.data || []);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          const message =
            err instanceof Error ? err.message : 'Failed to search animals';
          setError(message);
          setResults([]);
          setIsLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query, debounceMs]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { query, setQuery, results, isLoading, error, clearResults };
}
