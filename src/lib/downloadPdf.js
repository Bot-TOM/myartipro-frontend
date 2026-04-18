import api from './api'
import toast from 'react-hot-toast'

/**
 * Télécharge (desktop/Android) ou ouvre (iOS) un PDF authentifié.
 *
 * Stratégie cross-platform :
 *  1. On pré-ouvre un nouvel onglet SYNCHRONE au moment du tap (avant tout
 *     await). iOS Safari exige que window.open soit appelé dans le même
 *     tick que le user gesture, sinon l'anti-popup bloque silencieusement.
 *  2. On fetch le blob PDF via axios (headers d'auth inclus).
 *  3. On charge le blob URL dans l'onglet pré-ouvert :
 *       · iOS / desktop → PDF affiché, l'utilisateur peut Partager / Enregistrer
 *       · Android Chrome → PDF affiché ou proposé au téléchargement
 *  4. Si le pré-open a été bloqué malgré tout (mode privé strict,
 *     extensions…) on tombe en fallback sur un <a download>.
 *  5. On révoque le blob URL au bout de 60s (évite les fuites mémoire).
 *
 * IMPORTANT : cette fonction DOIT être appelée synchroniquement depuis un
 * onClick (pas dans un setTimeout ni après un await), sinon iOS bloquera.
 *
 * @param {string} path - ex: `/pdf/devis/${id}`
 * @param {string} filename - ex: `DEV-2026-001.pdf`
 */
export async function downloadPdf(path, filename) {
  // 1. Pré-ouverture synchrone (AVANT tout await)
  const win = window.open('', '_blank')

  try {
    // 2. Fetch authentifié
    const res = await api.get(path, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)

    if (win && !win.closed) {
      // 3a. Onglet pré-ouvert OK : on y redirige
      win.location.replace(url)
    } else {
      // 3b. Popup bloqué : fallback <a download>
      const a = document.createElement('a')
      a.href = url
      a.download = filename || 'document.pdf'
      a.target = '_blank'
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }

    // 5. Libération mémoire différée
    setTimeout(() => URL.revokeObjectURL(url), 60000)
    toast.success('PDF prêt')
  } catch (err) {
    if (win && !win.closed) win.close()

    let msg = 'Erreur lors du téléchargement du PDF'
    if (err.response?.data?.text) {
      try {
        const text = await err.response.data.text()
        const json = JSON.parse(text)
        if (json.detail) msg = json.detail
      } catch {
        // body non-JSON (HTML Cloudflare, etc.) — on garde le message générique
      }
    }
    toast.error(msg)
    throw err
  }
}
