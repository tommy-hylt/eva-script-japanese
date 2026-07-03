import { useState, useEffect } from 'react';
import type { ScriptEntry } from '../types/ScriptEntry';
import type { MovieMetadata } from '../types/Movie';
import manifest from '../data/manifest.json';

const dataModules = import.meta.glob('../data/*/part-*.json');

const movies = manifest.movies as MovieMetadata[];

export const getMovieById = (movieId: string) =>
  movies.find((movie) => movie.id === movieId);

export const getMovies = () => movies;

export const useScriptData = (movieId: string, currentPart: number) => {
  const [data, setData] = useState<ScriptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movieId) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const key = `../data/${movieId}/part-${currentPart}.json`;
        const loader = dataModules[key];
        if (!loader) {
          throw new Error(`No dataset found for ${movieId} part ${currentPart}`);
        }
        const module = await loader() as { default: ScriptEntry[] };
        setData(module.default);
      } catch (err) {
        setError(`Failed to load ${movieId} part ${currentPart}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [movieId, currentPart]);

  return { data, loading, error };
};
