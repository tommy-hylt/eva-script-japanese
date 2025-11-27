import type { ScriptEntry, TextSegment } from '../types/ScriptEntry';
import { ReportButton } from './ReportButton';
import './Row.css';

interface RowProps {
  entry: ScriptEntry;
}

export const Row = ({ entry }: RowProps) => {
  const renderSegment = (segment: TextSegment, index: number) => {
    if (typeof segment === 'string') {
      return <span key={index}>{segment}</span>;
    }
    return (
      <ruby key={index}>
        {segment.kanji}
        <rt>{segment.reading}</rt>
      </ruby>
    );
  };

  return (
    <div className="row">
      <div className="row-header">
        <div className="time">{entry.time} {entry.character && `- ${entry.character}`}</div>
        <ReportButton entry={entry} />
      </div>
      <div className="japanese">
        {entry.segments.map((segment, index) => renderSegment(segment, index))}
      </div>
      <div className="english">{entry.english}</div>
    </div>
  );
};
