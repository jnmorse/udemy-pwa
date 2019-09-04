/* eslint-disable no-unused-vars */
/* globals idb */
const dbPromise = idb.open('post-store', 1, db => {
  if (!db.objectStoreNames.contains('posts')) {
    db.createObjectStore('posts', { keyPath: 'id' });
  }

  if (!db.objectStoreNames.contains('sync-posts')) {
    db.createObjectStore('sync-posts', { keyPath: 'id' });
  }
});

function writeData(store = '', data) {
  return dbPromise.then(db => {
    const tx = db.transaction(store, 'readwrite');
    const dbStore = tx.objectStore(store);

    dbStore.put(data);

    return tx.complete;
  });
}

function readAllData(store) {
  return dbPromise.then(db => {
    const tx = db.transaction(store, 'readonly');
    const dbStore = tx.objectStore(store);

    return dbStore.getAll();
  });
}

function clearAllData(store) {
  return dbPromise.then(db => {
    const tx = db.transaction(store, 'readwrite');
    const dbStore = tx.objectStore(store);

    dbStore.clear();
    return tx.complete;
  });
}

function deleteItemFromData(store, id) {
  return dbPromise.then(db => {
    const tx = db.transaction(store, 'readwrite');
    const dbStore = tx.objectStore(store);

    dbStore.delete(id);

    return tx.complete;
  });
}
