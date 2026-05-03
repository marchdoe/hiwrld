import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useDocuments } from '../hooks/useDocuments';
import { generateDocumentId } from '../lib/generateId';
import type { AppMode } from '../types/document';
import { Textarea } from './Textarea';
import { WorkspaceDrawer } from './WorkspaceDrawer';
import { documentMenu, editorLayout } from '../../styled-system/recipes';

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
  const el = editorLayout();
  const dm = documentMenu();

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
    <section className={el.write}>
      {/* Backdrop — click outside to close the sidebar */}
      {menuOpen && (
        <button
          type="button"
          className={dm.backdrop}
          aria-label="Close menu"
          onClick={closeMenu}
        />
      )}

      {/* Left-side slide-in drawer */}
      <div className={`${dm.drawer}${menuOpen ? ' open' : ''}`}>
        <WorkspaceDrawer currentDocId={docId} onClose={closeMenu} />
      </div>

      <form className={el.writeForm}>
        <div className={el.writeButtons}>
          <button
            type="button"
            title="Your Documents"
            aria-label="Your Documents"
            className={`${el.menuButton} ss-rows${menuOpen ? ' pressed' : ''}`}
            aria-pressed={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          />
          <button
            type="button"
            title="New Document"
            aria-label="New Document"
            className={`${el.addButton} ss-plus`}
            onClick={handleAddDoc}
          />
          <button
            type="button"
            title="Preview Mode"
            aria-label="Preview Mode"
            className={`${el.readOnlyButton} ss-view${mode === 'read' ? ' pressed' : ''}`}
            aria-pressed={mode === 'read'}
            onClick={handleReadOnly}
          />
          <button
            type="button"
            title="Write Mode"
            aria-label="Write Mode"
            className={`${el.writeOnlyButton} ss-write${mode === 'write' ? ' pressed' : ''}`}
            aria-pressed={mode === 'write'}
            onClick={handleWriteOnly}
          />
        </div>
        <div className={el.textareaWrap}>
          <Textarea body={body} onChange={onBodyChange} />
        </div>
      </form>
    </section>
  );
}
