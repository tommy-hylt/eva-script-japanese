import { useState } from 'react';
import { useScriptData } from './hooks/useScriptData';
import { List } from './components/List';
import { Pagination } from './components/Pagination';
import './App.css';

function App() {
  const [currentPart, setCurrentPart] = useState(1);
  const { data, loading, error, totalParts } = useScriptData(currentPart);

  const handlePartChange = (newPart: number) => {
    setCurrentPart(newPart);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
          <>
            <List entries={data} />
            <div className="pagination-bottom">
              <Pagination
                currentPart={currentPart}
                totalParts={totalParts}
                onPartChange={handlePartChange}
              />
            </div>
          </>
        )}
      </main>

      <footer className="footer">
        <p>Evangelion 3.33 Script Collection • Fan-made transcription</p>
      </footer>
    </div>
  );
}

export default App;
