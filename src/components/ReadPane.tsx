import type { AppMode } from '../types/document';
import { editorLayout } from '../../styled-system/recipes';
import { Article } from './Article';

export interface ReadPaneProps {
  body: string;
  mode: AppMode | null;
  onModeChange: (mode: AppMode | null) => void;
}

export function ReadPane({ body, mode, onModeChange }: ReadPaneProps) {
  const el = editorLayout();

  const handleReadOnly = () => {
    onModeChange(mode === 'read' ? null : 'read');
  };

  return (
    <section className={el.read}>
      <div className={el.readButtons}>
        <button
          type="button"
          title="Read Mode"
          aria-label="Read Mode"
          className={`${el.readOnlyButton} ss-view${mode === 'read' ? ' pressed' : ''}`}
          aria-pressed={mode === 'read'}
          onClick={handleReadOnly}
        />
      </div>
      <Article body={body} />
    </section>
  );
}
