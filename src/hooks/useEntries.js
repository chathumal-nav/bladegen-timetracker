import { useState, useEffect, useRef } from "react";
import { sameEntry } from "../utils/entries";

export function useEntries() {
  const [entries, setLocal] = useState([]);
  const [ready, setReady] = useState(false);
  const ref = useRef([]);

  useEffect(() => {
    let mounted = true;
    window.timeEntries.list()
      .then((list) => {
        if (!mounted) return;
        ref.current = list; setLocal(list); setReady(true);
      })
      .catch((err) => {
        console.error("[load] time_entries failed", err);
        if (mounted) setReady(true);
      });
    return () => { mounted = false; };
  }, []);

  // Same call style as before: setEntries(nextArray). It saves only the differences.
  const persist = async (next) => {
    const prev = ref.current;
    const prevMap = new Map(prev.map((e) => [e.id, e]));
    const nextIds = new Set(next.map((e) => e.id));
    const upserts = next.filter((e) => { const p = prevMap.get(e.id); return !p || !sameEntry(p, e); });
    const removedIds = prev.filter((e) => !nextIds.has(e.id)).map((e) => e.id);

    ref.current = next; setLocal(next);
    try {
      await window.timeEntries.upsert(upserts);
      await window.timeEntries.remove(removedIds);
    } catch (err) {
      console.error("[save] time_entries failed", err);
      ref.current = prev; setLocal(prev);
      alert("Could not save to the database. Your change was not stored. Please try again.");
    }
  };

  return [entries, persist, ready];
}
