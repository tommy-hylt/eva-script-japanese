import { useEffect, useState } from 'react';

interface HomeRoute {
  page: 'home';
}

interface MovieRoute {
  page: 'movie';
  movieId: string;
  part: number | null;
}

export type AppRoute = HomeRoute | MovieRoute;

const parseLocation = (): AppRoute => {
  const params = new URLSearchParams(window.location.search);
  const movieId = params.get('movie');

  if (!movieId) {
    return { page: 'home' };
  }

  const partValue = params.get('part');
  const part = partValue ? Number(partValue) : null;

  return {
    page: 'movie',
    movieId,
    part: Number.isFinite(part) ? part : null,
  };
};

export const useQueryRoute = () => {
  const [route, setRoute] = useState<AppRoute>(() => parseLocation());

  useEffect(() => {
    const handlePopState = () => setRoute(parseLocation());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const updateRoute = (params: URLSearchParams) => {
    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.pushState({}, '', nextUrl);
    setRoute(parseLocation());
  };

  const goHome = () => {
    updateRoute(new URLSearchParams());
  };

  const goToMovie = (movieId: string, part?: number) => {
    const params = new URLSearchParams();
    params.set('movie', movieId);
    if (part) {
      params.set('part', String(part));
    }
    updateRoute(params);
  };

  return {
    route,
    goHome,
    goToMovie,
  };
};
