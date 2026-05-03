const ID_CHARACTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
const ID_LENGTH = 7;
const KEY_LENGTH = 32;

export function generateDocumentId(): string {
  const buf = new Uint8Array(ID_LENGTH);
  crypto.getRandomValues(buf);
  let id = '';
  for (const n of buf) {
    id += ID_CHARACTERS.charAt(n % ID_CHARACTERS.length);
  }
  return id;
}

export function generateWorkspaceKey(): string {
  const buf = new Uint8Array(KEY_LENGTH);
  crypto.getRandomValues(buf);
  let key = '';
  for (const n of buf) {
    key += ID_CHARACTERS.charAt(n % ID_CHARACTERS.length);
  }
  return key;
}
