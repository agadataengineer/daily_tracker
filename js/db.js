// Thin promise wrapper around IndexedDB.
// IndexedDB is the browser's built-in, persistent, structured database.
// Data survives reloads, browser restarts and app updates.
//
// If IndexedDB is unavailable (e.g. a sandboxed preview frame or a strict private
// window), the app falls back to an in-memory store so it can still be tried out;
// `isMemoryMode()` tells the UI to warn that nothing will be kept.

const DB_NAME = 'daily-habits';
const DB_VERSION = 1;
export const STORES = ['groups', 'habits', 'completions', 'meta'];
const KEYS = { groups: 'id', habits: 'id', completions: 'key', meta: 'key' };

let dbPromise = null;
let memory = null; // { store: Map } when IndexedDB can't be used

export const isMemoryMode = () => !!memory;

function openIDB() {
  return new Promise((resolve, reject) => {
    let req;
    try { req = indexedDB.open(DB_NAME, DB_VERSION); } catch (e) { reject(e); return; }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('groups')) db.createObjectStore('groups', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('habits')) db.createObjectStore('habits', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('completions')) {
        const s = db.createObjectStore('completions', { keyPath: 'key' });
        s.createIndex('date', 'date');
        s.createIndex('habitId', 'habitId');
      }
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('Database is blocked by another open tab.'));
  });
}

export function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    try {
      if (typeof indexedDB === 'undefined') throw new Error('IndexedDB unavailable');
      return await openIDB();
    } catch (e) {
      memory = Object.fromEntries(STORES.map(s => [s, new Map()]));
      console.warn('Storage unavailable — running in memory-only preview mode.', e);
      return null;
    }
  })();
  return dbPromise;
}

const clone = v => structuredClone(v);

function done(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
  });
}

export async function getAll(store) {
  const db = await openDB();
  if (!db) return [...memory[store].values()].map(clone);
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function get(store, key) {
  const db = await openDB();
  if (!db) { const v = memory[store].get(key); return v ? clone(v) : undefined; }
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function put(store, value) { return putMany(store, [value]); }

export async function putMany(store, values) {
  const db = await openDB();
  if (!db) { values.forEach(v => memory[store].set(v[KEYS[store]], clone(v))); return; }
  const tx = db.transaction(store, 'readwrite');
  const os = tx.objectStore(store);
  values.forEach(v => os.put(v));
  return done(tx);
}

export async function remove(store, key) { return removeMany(store, [key]); }

export async function removeMany(store, keys) {
  const db = await openDB();
  if (!db) { keys.forEach(k => memory[store].delete(k)); return; }
  const tx = db.transaction(store, 'readwrite');
  const os = tx.objectStore(store);
  keys.forEach(k => os.delete(k));
  return done(tx);
}

// Replace all app data in ONE transaction: if anything fails, nothing changes.
export async function replaceAll({ groups = [], habits = [], completions = [], meta = [] }) {
  const db = await openDB();
  if (!db) {
    const next = {
      groups: new Map(groups.map(g => [g.id, clone(g)])),
      habits: new Map(habits.map(h => [h.id, clone(h)])),
      completions: new Map(completions.map(c => [c.key, clone(c)])),
      meta: new Map(memory.meta),
    };
    meta.forEach(m => next.meta.set(m.key, clone(m)));
    memory = next;
    return;
  }
  const tx = db.transaction(['groups', 'habits', 'completions', 'meta'], 'readwrite');
  for (const s of ['groups', 'habits', 'completions']) tx.objectStore(s).clear();
  groups.forEach(g => tx.objectStore('groups').put(g));
  habits.forEach(h => tx.objectStore('habits').put(h));
  completions.forEach(c => tx.objectStore('completions').put(c));
  meta.forEach(m => tx.objectStore('meta').put(m));
  return done(tx);
}

export async function clearStores(stores = STORES) {
  const db = await openDB();
  if (!db) { stores.forEach(s => memory[s].clear()); return; }
  const tx = db.transaction(stores, 'readwrite');
  stores.forEach(s => tx.objectStore(s).clear());
  return done(tx);
}
