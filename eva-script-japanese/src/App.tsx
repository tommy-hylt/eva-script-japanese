import { useState, useEffect } from 'react';
import { useScriptData } from './hooks/useScriptData';
import { List } from './components/List';
import { Pagination } from './components/Pagination';
import './App.css';

const STORAGE_KEYS = {
  PAGE: 'eva-script-japanese-page',
  SCROLL: 'eva-script-japanese-scroll'
};

function App() {
  const [currentPart, setCurrentPart] = useState(() => {
    const savedPage = localStorage.getItem(STORAGE_KEYS.PAGE);
    return savedPage ? parseInt(savedPage, 10) : 1;
  });
  const { data, loading, error, totalParts } = useScriptData(currentPart);

  // Save scroll position before changing page
  const handlePartChange = (newPart: number) => {
    localStorage.setItem(STORAGE_KEYS.SCROLL, '0');
    setCurrentPart(newPart);
    localStorage.setItem(STORAGE_KEYS.PAGE, newPart.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Restore scroll position when data loads
  useEffect(() => {
    if (!loading && data.length > 0) {
      const savedScroll = localStorage.getItem(STORAGE_KEYS.SCROLL);
      if (savedScroll) {
        const scrollY = parseInt(savedScroll, 10);
        window.scrollTo({ top: scrollY, behavior: 'auto' });
      }
    }
  }, [loading, data]);

  // Save scroll position on scroll
  useEffect(() => {
    const handleScroll = () => {
      localStorage.setItem(STORAGE_KEYS.SCROLL, window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">ヱヴァンゲリヲン新劇場版：Q</h1>
        <p className="subtitle">Evangelion: 3.33 You Can (Not) Redo</p>
      </header>

      <main className="main">
        <Pagination
          currentPart={currentPart}
          totalParts={totalParts}
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

        {!loading && !error && data.length > 0 && (
          <List entries={data} />
        )}
      </main>

      <footer className="footer">
        <p>Evangelion 3.33 Script Collection • Fan-made transcription</p>
      </footer>
    </div>
  );
}

export default App;
