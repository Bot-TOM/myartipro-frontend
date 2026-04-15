import api from './api'
import { getPendingRequests, removeRequest } from './offlineQueue'
import toast from 'react-hot-toast'

let syncing = false

/**
 * Rejoue toutes les requêtes en attente.
 * Appelé automatiquement quand le réseau revient.
 */
export async function syncPendingRequests() {
  if (syncing) return
  syncing = true

  try {
    const requests = await getPendingRequests()
    if (requests.length === 0) {
      syncing = false
      return
    }

    toast(`Synchronisation de ${requests.length} élément${requests.length > 1 ? 's' : ''}...`, { icon: '🔄' })

    let success = 0
    let errors = 0

    for (const req of requests) {
      try {
        if (req.method === 'POST') {
          await api.post(req.url, req.data)
        } else if (req.method === 'PUT') {
          await api.put(req.url, req.data)
        } else if (req.method === 'DELETE') {
          await api.delete(req.url)
        }
        await removeRequest(req.id)
        success++
      } catch {
        errors++
      }
    }

    if (success > 0) {
      toast.success(`${success} élément${success > 1 ? 's' : ''} synchronisé${success > 1 ? 's' : ''}`)
    }
    if (errors > 0) {
      toast.error(`${errors} élément${errors > 1 ? 's' : ''} en erreur — réessai au prochain retour réseau`)
    }
  } finally {
    syncing = false
  }
}
