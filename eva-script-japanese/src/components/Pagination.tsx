import './Pagination.css';

interface PaginationProps {
  currentPart: number;
  totalParts: number;
  onPartChange: (part: number) => void;
}

export const Pagination = ({ currentPart, totalParts, onPartChange }: PaginationProps) => {
  return (
    <div className="pagination">
      <button
        className="pagination-btn"
        onClick={() => onPartChange(currentPart - 1)}
        disabled={currentPart === 1}
      >
        ← Previous
      </button>

      <div className="pagination-info">
        <span className="current-part">Part {currentPart}</span>
        <span className="total-parts">of {totalParts}</span>
      </div>

      <button
        className="pagination-btn"
        onClick={() => onPartChange(currentPart + 1)}
        disabled={currentPart === totalParts}
      >
        Next →
      </button>
    </div>
  );
};
