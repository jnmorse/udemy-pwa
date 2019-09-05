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

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/gu, '+')
    .replace(/_/gu, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
