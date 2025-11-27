import { createContext } from 'react';
import type { ScriptEntry } from '../types/ScriptEntry';

interface ReportContextType {
  reportedRows: ScriptEntry[];
  setReportedRows: React.Dispatch<React.SetStateAction<ScriptEntry[]>>;
}

export const ReportContext = createContext<ReportContextType>({
  reportedRows: [],
  setReportedRows: () => {}
});
