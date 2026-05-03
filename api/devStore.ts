// Local JSON-backed mock for the Supabase client.
// Used automatically in dev when SUPABASE_URL / SUPABASE_SERVICE_KEY are absent.
import * as fs from 'node:fs';
import * as path from 'node:path';

const STORE_PATH = path.resolve(process.cwd(), '.dev-store.json');

interface Store {
  workspaces: Row[];
  folders: Row[];
  documents: Row[];
}

type Row = Record<string, unknown>;

function readStore(): Store {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')) as Store;
  } catch {
    return { workspaces: [], folders: [], documents: [] };
  }
}

function writeStore(store: Store): void {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

class QueryBuilder {
  private _table: string;
  private _op: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private _filters: Array<[string, unknown]> = [];
  private _isSingle = false;
  private _selectAfterWrite = false;
  private _payload: Row | null = null;
  private _columns = '*';

  constructor(table: string) {
    this._table = table;
  }

  select(cols = '*'): this {
    if (this._op === 'insert' || this._op === 'update') {
      this._selectAfterWrite = true;
    } else {
      this._op = 'select';
      this._columns = cols;
    }
    return this;
  }

  insert(payload: Row): this {
    this._op = 'insert';
    this._payload = payload;
    return this;
  }

  update(payload: Row): this {
    this._op = 'update';
    this._payload = payload;
    return this;
  }

  delete(): this {
    this._op = 'delete';
    return this;
  }

  eq(col: string, val: unknown): this {
    this._filters.push([col, val]);
    return this;
  }

  single(): this {
    this._isSingle = true;
    return this;
  }

  // biome-ignore lint/suspicious/noThenProperty: intentional — makes this class awaitable like a Supabase query builder
  then(
    resolve: (val: { data: unknown; error: unknown }) => void,
    reject: (err: unknown) => void
  ): void {
    try {
      resolve(this._execute());
    } catch (err) {
      reject(err);
    }
  }

  private _matches(row: Row): boolean {
    return this._filters.every(([col, val]) => row[col] === val);
  }

  private _project(row: Row): Row {
    if (this._columns === '*') return row;
    const cols = this._columns.split(',').map((c) => c.trim());
    const out: Row = {};
    for (const col of cols) {
      if (col in row) out[col] = row[col];
    }
    return out;
  }

  private _executeSelect(rows: Row[]): { data: unknown; error: unknown } {
    const found = rows.filter((r) => this._matches(r)).map((r) => this._project(r));
    if (this._isSingle) {
      if (found.length === 0)
        return { data: null, error: { code: 'PGRST116', message: 'not found' } };
      return { data: found[0], error: null };
    }
    return { data: found, error: null };
  }

  private _executeInsert(store: Store, rows: Row[]): { data: unknown; error: unknown } {
    // biome-ignore lint/style/noNonNullAssertion: payload is always set before insert is called
    const row = { ...this._payload! };
    rows.push(row);
    writeStore(store);
    if (this._selectAfterWrite) return { data: this._isSingle ? row : [row], error: null };
    return { data: null, error: null };
  }

  private _executeUpdate(store: Store, rows: Row[], table: keyof Store): { data: unknown; error: unknown } {
    let updated: Row | null = null;
    store[table] = rows.map((row) => {
      if (!this._matches(row)) return row;
      // biome-ignore lint/style/noNonNullAssertion: payload is always set before update is called
      updated = { ...row, ...this._payload! };
      return updated;
    });
    writeStore(store);
    if (this._selectAfterWrite) {
      if (!updated) return { data: null, error: { code: 'PGRST116', message: 'not found' } };
      return { data: this._isSingle ? updated : [updated], error: null };
    }
    return { data: null, error: null };
  }

  private _collectFolderIds(store: Store, rootIds: string[]): Set<string> {
    const toDelete = new Set<string>();
    const collect = (parentId: string) => {
      toDelete.add(parentId);
      for (const f of store.folders) {
        if (f.parent_id === parentId) collect(f.id as string);
      }
    };
    for (const id of rootIds) collect(id);
    return toDelete;
  }

  private _executeDelete(store: Store, rows: Row[], table: keyof Store): { data: unknown; error: unknown } {
    if (table === 'folders') {
      const rootIds = rows.filter((r) => this._matches(r)).map((r) => r.id as string);
      const toDelete = this._collectFolderIds(store, rootIds);
      store.folders = store.folders.filter((f) => !toDelete.has(f.id as string));
      store.documents = store.documents.filter((d) => !toDelete.has(d.folder_id as string));
    } else {
      store[table] = rows.filter((r) => !this._matches(r));
    }
    writeStore(store);
    return { data: null, error: null };
  }

  private _execute(): { data: unknown; error: unknown } {
    const store = readStore();
    const table = this._table as keyof Store;
    const rows = store[table];

    if (this._op === 'select') return this._executeSelect(rows);
    if (this._op === 'insert') return this._executeInsert(store, rows);
    if (this._op === 'update') return this._executeUpdate(store, rows, table);
    if (this._op === 'delete') return this._executeDelete(store, rows, table);
    return { data: null, error: null };
  }
}

export function createDevClient() {
  return {
    from(table: string): QueryBuilder {
      return new QueryBuilder(table);
    },
  };
}
