import { useEffect } from 'react';
import { useScriptData, getMovieById, getMovies } from './hooks/useScriptData';
import { useQueryRoute } from './hooks/useQueryRoute';
import { useScrollPosition } from './hooks/useScrollPosition';
import { useReportedRows } from './hooks/useReportedRows';
import { List } from './components/List';
import { Pagination } from './components/Pagination';
import { CopyReport } from './components/CopyReport';
import { HomePage } from './components/HomePage';
import { ReportContext } from './contexts/ReportContext';
import './App.css';

const getPageKey = (movieId: string) => `eva-script-japanese-page:${movieId}`;

function App() {
  const { route, goHome, goToMovie } = useQueryRoute();
  const { reportedRows, setReportedRows } = useReportedRows();
  const movies = getMovies();
  const selectedMovie = route.page === 'movie' ? getMovieById(route.movieId) : undefined;
  const routePart = route.page === 'movie' ? route.part : null;
  const fallbackPart = selectedMovie
    ? Number(localStorage.getItem(getPageKey(selectedMovie.id)) ?? '1')
    : 1;
  const currentPart = selectedMovie
    ? Math.min(Math.max(routePart ?? fallbackPart, 1), selectedMovie.totalParts)
    : 1;
  const { data, loading, error } = useScriptData(selectedMovie?.id ?? '', currentPart);
  const { resetScrollPosition } = useScrollPosition(loading, data.length);

  useEffect(() => {
    if (!selectedMovie) {
      return;
    }
    if (route.page !== 'movie' || routePart !== currentPart) {
      goToMovie(selectedMovie.id, currentPart);
    }
  }, [currentPart, goToMovie, route.page, routePart, selectedMovie]);

  const handlePartChange = (newPart: number) => {
    if (!selectedMovie) {
      return;
    }
    resetScrollPosition();
    localStorage.setItem(getPageKey(selectedMovie.id), String(newPart));
    goToMovie(selectedMovie.id, newPart);
  };

  return (
    <ReportContext.Provider value={{ reportedRows, setReportedRows }}>
      <div className="app">
        <header className="header">
          {selectedMovie ? (
            <div className="movie-header">
              <button
                className="back-link"
                onClick={goHome}
                aria-label="Back to movie list"
                title="Back to movie list"
              >
                {'\u25C0'}
              </button>
              <div className="movie-title-group">
                <h1 className="title">{selectedMovie.titleJa}</h1>
                <p className="subtitle">{selectedMovie.titleEn}</p>
              </div>
            </div>
          ) : (
            <>
              <h1 className="title">{'\u30F1\u30F4\u30A1\u30F3\u30B2\u30EA\u30F2\u30F3\u65B0\u5287\u5834\u7248 \u53F0\u672C'}</h1>
              <p className="subtitle">Japanese text with furigana and English translation</p>
            </>
          )}
        </header>

        {route.page === 'home' || !selectedMovie ? (
          <HomePage movies={movies} onSelectMovie={(movieId) => goToMovie(movieId, 1)} />
        ) : (
          <main className="main">
            <Pagination
              currentPart={currentPart}
              totalParts={selectedMovie.totalParts}
              onPartChange={handlePartChange}
            />

            {loading && (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading script...</p>
              </div>
            )}

            {error && (
              <div className="error">
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && data.length > 0 && <List entries={data} />}
          </main>
        )}

        <footer className="footer">
          <p>Evangelion script collection for Japanese study</p>
          <CopyReport />
        </footer>
      </div>
    </ReportContext.Provider>
  );
}

export default App;
