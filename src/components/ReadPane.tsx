import { Eye } from 'lucide-react';
import type React from 'react';
import { editorLayout } from '../../styled-system/recipes';
import type { AppMode } from '../types/document';
import { Article } from './Article';

export interface ReadPaneProps {
  body: string;
  mode: AppMode | null;
  onModeChange: (mode: AppMode | null) => void;
  style?: React.CSSProperties;
}

export function ReadPane({ body, mode, onModeChange, style }: ReadPaneProps) {
  const el = editorLayout();

  const handleReadOnly = () => {
    onModeChange(mode === 'read' ? null : 'read');
  };

  return (
    <section className={el.read} style={style}>
      <div className={el.readButtons}>
        <button
          type="button"
          title="Preview Mode"
          aria-label="Preview Mode"
          className={`${el.readOnlyButton}${mode === 'read' ? ' pressed' : ''}`}
          aria-pressed={mode === 'read'}
          onClick={handleReadOnly}
        >
          <Eye size={16} strokeWidth={2} />
        </button>
      </div>
      <Article body={body} />
    </section>
  );
}
