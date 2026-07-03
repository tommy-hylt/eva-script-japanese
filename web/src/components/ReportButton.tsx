import { useContext } from 'react';
import { ReportContext } from '../contexts/ReportContext';
import type { ScriptEntry } from '../types/ScriptEntry';
import './ReportButton.css';

interface ReportButtonProps {
  entry: ScriptEntry;
}

export const ReportButton = ({ entry }: ReportButtonProps) => {
  const { reportedRows, setReportedRows } = useContext(ReportContext);

  const isReported = reportedRows.some(
    row => row.id === entry.id
  );

  const handleClick = () => {
    setReportedRows(prev => {
      const exists = prev.some(
        row => row.id === entry.id
      );

      if (exists) {
        return prev.filter(
          row => row.id !== entry.id
        );
      } else {
        return [...prev, entry];
      }
    });
  };

  return (
    <button
      className={`report-button ${isReported ? 'reported' : ''}`}
      onClick={handleClick}
      title={isReported ? 'Unreport this row' : 'Report this row'}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
      </svg>
    </button>
  );
};
