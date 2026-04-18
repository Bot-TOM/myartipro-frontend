import toast from 'react-hot-toast'

/**
 * Affiche un toast d'erreur à partir d'une exception Axios / fetch.
 * - Extrait `response.data.detail` (Pydantic renvoie un tableau d'objets {msg, loc, type})
 * - Sinon retombe sur `err.message`
 * - Sinon affiche le fallback fourni
 *
 * @param {unknown} err     Exception levée (Axios error ou autre)
 * @param {string}  fallback Message affiché si aucune info exploitable
 * @returns {string}         Le message finalement affiché
 */
export function toastApiError(err, fallback = 'Une erreur est survenue') {
  const detail = err?.response?.data?.detail
  let msg = fallback

  if (Array.isArray(detail)) {
    msg = detail.map((d) => d?.msg).filter(Boolean).join(', ') || fallback
  } else if (typeof detail === 'string' && detail.trim()) {
    msg = detail
  } else if (err?.message) {
    msg = err.message
  }

  toast.error(msg)
  return msg
}
