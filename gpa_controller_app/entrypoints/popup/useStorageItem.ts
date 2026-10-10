import { useEffect, useState } from 'react';
import type { WxtStorageItem } from '#imports';

/** Reads a storage item and re-renders whenever it changes. Undefined until loaded. */
export function useStorageItem<T>(item: WxtStorageItem<T, Record<string, unknown>>): T | undefined {
  const [value, setValue] = useState<T>();

  useEffect(() => {
    item.getValue().then(setValue);
    return item.watch(setValue);
  }, [item]);

  return value;
}
