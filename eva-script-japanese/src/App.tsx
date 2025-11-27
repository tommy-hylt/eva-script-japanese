import { useState } from 'react';
import { useScriptData } from './hooks/useScriptData';
import { useScrollPosition } from './hooks/useScrollPosition';
import { useReportedRows } from './hooks/useReportedRows';
import { List } from './components/List';
import { Pagination } from './components/Pagination';
import { CopyReport } from './components/CopyReport';
import { ReportContext } from './contexts/ReportContext';
import './App.css';

const PAGE_KEY = 'eva-script-japanese-page';

function App() {
  const [currentPart, setCurrentPart] = useState(() => {
    const savedPage = localStorage.getItem(PAGE_KEY);
    return savedPage ? parseInt(savedPage, 10) : 1;
  });

  const { data, loading, error, totalParts } = useScriptData(currentPart);
  const { resetScrollPosition } = useScrollPosition(loading, data.length);
  const { reportedRows, setReportedRows } = useReportedRows();

  const handlePartChange = (newPart: number) => {
    resetScrollPosition();
    setCurrentPart(newPart);
    localStorage.setItem(PAGE_KEY, newPart.toString());
  };

  return (
    <ReportContext.Provider value={{ reportedRows, setReportedRows }}>
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
          <CopyReport />
        </footer>
      </div>
    </ReportContext.Provider>
  );
}

export default App;
