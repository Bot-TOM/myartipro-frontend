import { openDB } from 'idb'

const DB_NAME = 'plombierpro-offline'
const STORE_NAME = 'pending-requests'

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    },
  })
}

/**
 * Sauvegarde une requête en attente dans IndexedDB.
 */
export async function enqueueRequest({ method, url, data }) {
  const db = await getDB()
  await db.add(STORE_NAME, {
    method,
    url,
    data,
    createdAt: new Date().toISOString(),
  })
}

/**
 * Retourne toutes les requêtes en attente.
 */
export async function getPendingRequests() {
  const db = await getDB()
  return db.getAll(STORE_NAME)
}

/**
 * Supprime une requête traitée.
 */
export async function removeRequest(id) {
  const db = await getDB()
  await db.delete(STORE_NAME, id)
}

/**
 * Nombre de requêtes en attente.
 */
export async function getPendingCount() {
  const db = await getDB()
  return db.count(STORE_NAME)
}
