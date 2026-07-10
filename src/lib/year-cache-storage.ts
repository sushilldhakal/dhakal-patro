import type { YearCalendar } from "@/lib/api";
import { isBrowser } from "@/lib/browser";

/** Bump to invalidate all persisted year wheels after payload shape changes. */
const STORAGE_VERSION = 2;
/** Keep cached years for 30 days — panchanga rules rarely change mid-month. */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const DB_NAME = "vedicpatro-year-cache";
const STORE = "years";
const MAX_ENTRIES = 12;

type StoredYear = {
  version: number;
  savedAt: number;
  payload: YearCalendar;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

function idbGet(db: IDBDatabase, key: string): Promise<StoredYear | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB get failed"));
    req.onsuccess = () => resolve(req.result as StoredYear | undefined);
  });
}

function idbPut(db: IDBDatabase, key: string, value: StoredYear): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).put(value, key);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB put failed"));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
  });
}

function idbKeys(db: IDBDatabase): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAllKeys();
    req.onerror = () => reject(req.error ?? new Error("IndexedDB keys failed"));
    req.onsuccess = () => resolve((req.result as string[]) ?? []);
  });
}

function idbDelete(db: IDBDatabase, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).delete(key);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB delete failed"));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
  });
}

async function trimOldEntries(db: IDBDatabase, keepKey: string): Promise<void> {
  const keys = await idbKeys(db);
  if (keys.length <= MAX_ENTRIES) return;
  const toRemove = keys.filter((k) => k !== keepKey).slice(0, keys.length - MAX_ENTRIES);
  await Promise.all(toRemove.map((k) => idbDelete(db, k)));
}

export function yearCacheStorageKey(year: number, locationKey: string): string {
  return `y${year}:${locationKey}`;
}

/** Read a persisted BS year wheel payload (browser only). */
export async function readPersistedYear(
  storageKey: string,
): Promise<YearCalendar | null> {
  if (!isBrowser || !("indexedDB" in window)) return null;
  try {
    const db = await openDb();
    const row = await idbGet(db, storageKey);
    db.close();
    if (!row || row.version !== STORAGE_VERSION) return null;
    if (Date.now() - row.savedAt > MAX_AGE_MS) return null;
    return row.payload;
  } catch {
    return null;
  }
}

/** Persist a BS year wheel payload for offline / repeat visits. */
export async function writePersistedYear(
  storageKey: string,
  payload: YearCalendar,
): Promise<void> {
  if (!isBrowser || !("indexedDB" in window)) return;
  try {
    const db = await openDb();
    await idbPut(db, storageKey, {
      version: STORAGE_VERSION,
      savedAt: Date.now(),
      payload,
    });
    await trimOldEntries(db, storageKey);
    db.close();
  } catch {
    // Best-effort — network cache still works.
  }
}
