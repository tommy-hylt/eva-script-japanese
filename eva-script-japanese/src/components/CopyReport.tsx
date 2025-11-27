import { useContext } from 'react';
import { ReportContext } from '../contexts/ReportContext';
import './CopyReport.css';

export const CopyReport = () => {
  const { reportedRows } = useContext(ReportContext);

  const handleCopy = () => {
    if (reportedRows.length === 0) {
      alert('No reported rows to copy');
      return;
    }

    const json = JSON.stringify(reportedRows, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      alert('Reported rows copied to clipboard!');
    }).catch((err) => {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    });
  };

  return (
    <button className="copy-reported" onClick={handleCopy}>
      Copy reported rows
    </button>
  );
};
