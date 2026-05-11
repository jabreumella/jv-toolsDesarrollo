/* ════════════════════════════════════════════════════════════════
   J&V Tools — IndexedDB Wrapper
   Almacenamiento local de cotizaciones, unidades y clientes
   ════════════════════════════════════════════════════════════════ */

const DB_NAME = 'jv-tools-db';
const DB_VERSION = 1;
const STORES = ['cotizaciones', 'unidades', 'clientes'];

const DB = (() => {
  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = e => {
        const db = e.target.result;
        STORES.forEach(name => {
          if (!db.objectStoreNames.contains(name)) {
            const store = db.createObjectStore(name, { keyPath: 'id', autoIncrement: true });
            if (name === 'cotizaciones') {
              store.createIndex('cliente', 'cliente', { unique: false });
              store.createIndex('proyecto', 'proyecto', { unique: false });
              store.createIndex('createdAt', 'createdAt', { unique: false });
            }
            if (name === 'unidades') {
              store.createIndex('proyecto', 'proyecto', { unique: false });
            }
          }
        });
      };

      req.onsuccess = e => resolve(e.target.result);
      req.onerror = e => reject(e.target.error);
    });

    return dbPromise;
  }

  async function tx(storeName, mode = 'readonly') {
    const db = await open();
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  async function getAll(storeName) {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await tx(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      } catch (e) { reject(e); }
    });
  }

  async function get(storeName, id) {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await tx(storeName);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (e) { reject(e); }
    });
  }

  async function put(storeName, item) {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await tx(storeName, 'readwrite');
        if (!item.createdAt) item.createdAt = new Date().toISOString();
        item.updatedAt = new Date().toISOString();
        const req = store.put(item);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (e) { reject(e); }
    });
  }

  async function add(storeName, item) {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await tx(storeName, 'readwrite');
        item.createdAt = new Date().toISOString();
        item.updatedAt = item.createdAt;
        const req = store.add(item);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (e) { reject(e); }
    });
  }

  async function remove(storeName, id) {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await tx(storeName, 'readwrite');
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      } catch (e) { reject(e); }
    });
  }

  async function clear(storeName) {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await tx(storeName, 'readwrite');
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      } catch (e) { reject(e); }
    });
  }

  return { open, getAll, get, put, add, remove, clear };
})();

// Inicializar al cargar
DB.open().catch(err => console.warn('[DB] init error:', err));
