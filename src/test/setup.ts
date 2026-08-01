/**
 * The one browser API the tests cannot do without.
 *
 * The window store persists to `sessionStorage`, and zustand reads it as the
 * module is imported — so a Node run would either warn on every import or need
 * a whole DOM implementation installed to satisfy it. An in-memory Storage is
 * the smaller answer, and it is per-file: vitest isolates test files, so no
 * spec can leave state behind for another.
 */

class MemoryStorage implements Storage {
  #entries = new Map<string, string>();

  get length() {
    return this.#entries.size;
  }

  key(index: number) {
    return [...this.#entries.keys()][index] ?? null;
  }

  getItem(key: string) {
    return this.#entries.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.#entries.set(key, String(value));
  }

  removeItem(key: string) {
    this.#entries.delete(key);
  }

  clear() {
    this.#entries.clear();
  }
}

globalThis.sessionStorage = new MemoryStorage();
globalThis.localStorage = new MemoryStorage();
