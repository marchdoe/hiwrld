import { useRef } from 'react';

export interface TextareaProps {
  body: string;
  onChange: (body: string) => void;
}

export function Textarea({ body, onChange }: TextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const el = e.currentTarget;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const tab = '    ';
    const next = el.value.substring(0, start) + tab + el.value.substring(end);
    onChange(next);
    requestAnimationFrame(() => {
      if (ref.current) {
        ref.current.selectionStart = ref.current.selectionEnd = start + tab.length;
      }
    });
  };

  return (
    <textarea
      ref={ref}
      className="document-textarea"
      value={body}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
    />
  );
}
