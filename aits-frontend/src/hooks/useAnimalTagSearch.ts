import { useState, useEffect, useRef, useCallback } from "react";
import {
  animalsService,
  AnimalQueryParams as AnimalQuery,
} from "@/services/animals.service";
import type { AnimalItem } from "@/types/animals";

interface UseAnimalTagSearchReturn {
  query: string;
  setQuery: (value: string) => void;
  results: AnimalItem[];
  isLoading: boolean;
  error: string | null;
  clearResults: () => void;
}

/**
 * Debounced animal tag search hook.
 * Calls GET /api/v1/animals?search=<query>&limit=10 with 300ms debounce.
 * Results are scoped to the authenticated user's authorized farms by the backend.
 */
export function useAnimalTagSearch(
  debounceMs = 300,
  filters?: Partial<AnimalQuery>,
): UseAnimalTagSearchReturn {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AnimalItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await animalsService.getAnimals({
          search: trimmed,
          limit: 10,
          excludeStatus: "SOLD",
          ...filters,
        });

        if (!controller.signal.aborted) {
          setResults(response.data);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          const message =
            err instanceof Error ? err.message : "Failed to search animals";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, debounceMs]);

  // Cleanup on unmount
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
