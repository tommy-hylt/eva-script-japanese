import type { ScriptEntry } from '../types/ScriptEntry';
import './Row.css';

interface RowProps {
  entry: ScriptEntry;
}

export const Row = ({ entry }: RowProps) => {
  return (
    <div className="row">
      <div className="time">{entry.time} {entry.character && `- ${entry.character}`}</div>
      <div className="japanese">{entry.japanese}</div>
      <div className="hiragana">{entry.hiragana}</div>
      <div className="english">{entry.english}</div>
    </div>
  );
};
