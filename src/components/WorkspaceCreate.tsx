import { useState } from 'react';
import { workspaceCreate } from '../../styled-system/recipes';

export interface WorkspaceCreateProps {
  onCreate: (name: string) => Promise<void>;
}

export function WorkspaceCreate({ onCreate }: WorkspaceCreateProps) {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const wsc = workspaceCreate();

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
    <div className={wsc.root}>
      <span className={wsc.icon}>📁</span>
      <p className={wsc.title}>Create a workspace</p>
      <p className={wsc.desc}>
        A private space for your docs. Share the key with anyone — or an AI agent.
      </p>
      <form onSubmit={handleSubmit} className={wsc.form}>
        <input
          type="text"
          className={wsc.input}
          placeholder="Workspace name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={creating}
        />
        <button
          type="submit"
          className={wsc.btn}
          disabled={creating || !name.trim()}
          aria-label="Create workspace"
        >
          {creating ? 'Creating…' : 'Create workspace →'}
        </button>
      </form>
    </div>
  );
}
