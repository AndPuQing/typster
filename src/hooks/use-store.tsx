import { useEffect, useState, useCallback } from "react";
import { Store } from "@tauri-apps/plugin-store";

const store = await Store.load("store.json");

export function useStore<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);

  const loadValue = useCallback(async () => {
    const storedValue = await store.get<T>(key);
    if (storedValue !== null && storedValue !== undefined) {
      setValue(storedValue);
    }
  }, [key]);

  const updateValue = useCallback(
    async (newValue: T) => {
      setValue(newValue);
      await store.set(key, newValue);
      await store.save();
    },
    [key]
  );

  useEffect(() => {
    loadValue();
  }, [loadValue]);

  return [value, updateValue] as const;
}
