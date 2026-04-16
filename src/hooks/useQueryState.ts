import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

// type QueryValue = string | number | boolean | null;

interface UseQueryStateOptions<T> {
  defaultValue: T;
  parse?: (value: string | null) => T;
  serialize?: (value: T) => string | null;
  debounce?: number;
}

export function useQueryState<T = string>(
  key: string,
  options: UseQueryStateOptions<T>
) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const {
    defaultValue,
    parse = (v) => (v ?? defaultValue) as unknown as T,
    serialize = (v) => String(v),
    debounce = 0,
  } = options;

  // Initialize state from URL or default
  const [state, setState] = useState<T>(() => {
    const param = searchParams.get(key);
    return parse(param);
  });

  // Update URL when state changes
  const setQueryState = useCallback(
    (newValue: T) => {
      setState(newValue);

      const updateUrl = () => {
        const params = new URLSearchParams(searchParams.toString());
        const serialized = serialize(newValue);

        if (
          serialized === null ||
          serialized === "" ||
          serialized === String(defaultValue)
        ) {
          params.delete(key);
        } else {
          params.set(key, serialized);
        }

        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      };

      if (debounce > 0) {
        const timeoutId = setTimeout(updateUrl, debounce);
        return () => clearTimeout(timeoutId);
      } else {
        updateUrl();
      }
    },
    [key, searchParams, router, pathname, serialize, defaultValue, debounce]
  );

  // Sync with URL changes (e.g. back button)
  useEffect(() => {
    const param = searchParams.get(key);
    const parsed = parse(param);
    // Only update if different to avoid loops, but careful with object equality
    if (JSON.stringify(parsed) !== JSON.stringify(state)) {
      setState(parsed);
    }
  }, [searchParams, key, parse, state]);

  return [state, setQueryState] as const;
}
