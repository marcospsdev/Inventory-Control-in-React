import { useEffect, useState } from "react";

export const usePagination = (initialLimit: number) => {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(initialLimit);

  const changeLimit = (value: number) => {
    setLimit(value);
    setPage(0);
  };

  return { page, limit, setPage, changeLimit };
};

export const useDebouncedValue = <T,>(value: T, delay = 300) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};
