import { useState, useEffect } from "react";
import { loadStore, saveStore } from "../utils/storage";

export function useShared(key, fallback) {
  const [value, setValue] = useState(fallback);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let mounted = true;
    loadStore(key, true, fallback).then((v) => { if (mounted) { setValue(v); setReady(true); } });
    return () => { mounted = false; };
  }, []);
  const persist = async (next) => {
    setValue(next);
    await saveStore(key, true, next);
  };
  return [value, persist, ready];
}
