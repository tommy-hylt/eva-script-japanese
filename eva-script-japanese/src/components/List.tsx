import type { ScriptEntry } from '../types/ScriptEntry';
import { Row } from './Row';
import './List.css';

interface ListProps {
  entries: ScriptEntry[];
}

export const List = ({ entries }: ListProps) => {
  return (
    <div className="list">
      {entries.map((entry, index) => (
        <Row key={`${entry.time}-${index}`} entry={entry} />
      ))}
    </div>
  );
};
