import type { AppMode } from '../types/document';
import { Article } from './Article';

interface ReadPaneProps {
  body: string;
  mode: AppMode | null;
  onModeChange: (mode: AppMode | null) => void;
}

export function ReadPane({ body, mode, onModeChange }: ReadPaneProps) {
  const handleReadOnly = () => {
    onModeChange(mode === 'read' ? null : 'read');
  };

  return (
    <section className="read">
      <div className="read-buttons">
        <button
          type="button"
          title="Read Mode"
          aria-label="Read Mode"
          className={`read-only-button ss-view${mode === 'read' ? ' pressed' : ''}`}
          aria-pressed={mode === 'read'}
          onClick={handleReadOnly}
        />
      </div>
      <Article body={body} />
    </section>
  );
}
