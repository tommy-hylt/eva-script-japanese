import { useState, useEffect } from 'react';
import type { ScriptEntry } from '../types/ScriptEntry';

const REPORT_KEY = 'eva-script-japanese-report';

export const useReportedRows = () => {
  const [reportedRows, setReportedRows] = useState<ScriptEntry[]>(() => {
    const stored = localStorage.getItem(REPORT_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // Save to localStorage whenever reportedRows changes
  useEffect(() => {
    localStorage.setItem(REPORT_KEY, JSON.stringify(reportedRows));
  }, [reportedRows]);

  return {
    reportedRows,
    setReportedRows
  };
};
