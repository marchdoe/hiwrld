import { useState } from 'react';

export interface WorkspaceCreateProps {
  onCreate: (name: string) => Promise<void>;
}

export function WorkspaceCreate({ onCreate }: WorkspaceCreateProps) {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await onCreate(name.trim());
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="workspace-create">
      <span className="workspace-create-icon">📁</span>
      <p className="workspace-create-title">Create a workspace</p>
      <p className="workspace-create-desc">
        A private space for your docs. Share the key with anyone — or an AI agent.
      </p>
      <form onSubmit={handleSubmit} className="workspace-create-form">
        <input
          type="text"
          className="workspace-create-input"
          placeholder="Workspace name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={creating}
        />
        <button
          type="submit"
          className="workspace-create-btn"
          disabled={creating || !name.trim()}
          aria-label="Create workspace"
        >
          {creating ? 'Creating…' : 'Create workspace →'}
        </button>
      </form>
    </div>
  );
}
