import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useDocuments } from '../hooks/useDocuments';
import { generateDocumentId } from '../lib/generateId';
import type { AppMode } from '../types/document';
import { DocumentMenu } from './DocumentMenu';
import { Textarea } from './Textarea';

export interface WritePaneProps {
  docId: string;
  body: string;
  mode: AppMode | null;
  onBodyChange: (body: string) => void;
  onModeChange: (mode: AppMode | null) => void;
}

export function WritePane({ docId, body, mode, onBodyChange, onModeChange }: WritePaneProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { add } = useDocuments();
  const navigate = useNavigate();

  const handleAddDoc = () => {
    const newId = generateDocumentId();
    add(newId);
    void navigate({ to: '/$docId', params: { docId: newId } });
  };

  const handleWriteOnly = () => {
    onModeChange(mode === 'write' ? null : 'write');
  };

  const handleReadOnly = () => {
    onModeChange(mode === 'read' ? null : 'read');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <section className="write">
      {/* Backdrop — click outside to close the sidebar */}
      {menuOpen && (
        <button
          type="button"
          className="document-menu-backdrop"
          aria-label="Close menu"
          onClick={closeMenu}
        />
      )}

      {/* Left-side slide-in drawer */}
      <div className={`document-menu-drawer${menuOpen ? ' open' : ''}`}>
        <DocumentMenu currentDocId={docId} />
      </div>

      <form className="write-form">
        <div className="write-buttons">
          <button
            type="button"
            title="Your Documents"
            aria-label="Your Documents"
            className={`menu-button ss-rows${menuOpen ? ' pressed' : ''}`}
            aria-pressed={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          />
          <button
            type="button"
            title="New Document"
            aria-label="New Document"
            className="add-button ss-plus"
            onClick={handleAddDoc}
          />
          <button
            type="button"
            title="Preview Mode"
            aria-label="Preview Mode"
            className={`read-only-button ss-view${mode === 'read' ? ' pressed' : ''}`}
            aria-pressed={mode === 'read'}
            onClick={handleReadOnly}
          />
          <button
            type="button"
            title="Write Mode"
            aria-label="Write Mode"
            className={`write-only-button ss-write${mode === 'write' ? ' pressed' : ''}`}
            aria-pressed={mode === 'write'}
            onClick={handleWriteOnly}
          />
        </div>
        <div className="write-textarea-wrap">
          <Textarea body={body} onChange={onBodyChange} />
        </div>
      </form>
    </section>
  );
}
