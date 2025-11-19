import { useState, useEffect } from 'react';
import type { ScriptEntry } from '../types/ScriptEntry';

const PARTS = [1, 2, 3, 4, 5, 6];

export const useScriptData = (currentPart: number) => {
  const [data, setData] = useState<ScriptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const module = await import(`../data/Eva_3.33_Combined_Part${currentPart}.json`);
        setData(module.default);
      } catch (err) {
        setError(`Failed to load Part ${currentPart}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentPart]);

  return { data, loading, error, totalParts: PARTS.length };
};
