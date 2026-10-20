/** IndexedDB metadata for cached audio clips (size, last access, favorite flag). */
let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('quran_radio_cache_db', 2);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('audio_cache')) {
        const store = db.createObjectStore('audio_cache', { keyPath: 'url' });
        store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        store.createIndex('isFavorite', 'isFavorite', { unique: false });
        store.createIndex('stationId', 'stationId', { unique: false });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onclose = () => { dbPromise = null; };
      db.onversionchange = () => { db.close(); dbPromise = null; };
      resolve(db);
    };
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });
  return dbPromise;
}

function runRequest(mode, work) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction('audio_cache', mode);
    const store = tx.objectStore('audio_cache');
    let result;
    work(store, (value) => { result = value; });
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  }));
}

function dbGetAll() {
  return runRequest('readonly', (store, done) => {
    const req = store.getAll();
    req.onsuccess = () => done(req.result || []);
  }).catch(() => []);
}

function dbPutClip(record) {
  return runRequest('readwrite', (store) => { store.put(record); });
}

function dbDelete(url) {
  return runRequest('readwrite', (store) => { store.delete(url); }).catch(() => {});
}

function dbClear() {
  return runRequest('readwrite', (store) => { store.clear(); }).catch(() => {});
}
