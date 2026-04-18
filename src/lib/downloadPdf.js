import api from './api'
import toast from 'react-hot-toast'

/**
 * Exporte un PDF authentifié vers l'utilisateur (download ou partage natif).
 *
 * Stratégie cross-platform :
 *  1. Mobile (iOS PWA, iOS Safari, Android) → Web Share API avec fichiers :
 *     déclenche la feuille de partage native de l'OS, l'utilisateur choisit
 *     "Enregistrer dans Fichiers", "AirDrop", mail, etc. C'est la SEULE voie
 *     qui fonctionne en PWA iOS standalone.
 *  2. Desktop ou navigateur sans Web Share → <a download> classique.
 *  3. Libération du blob URL au bout de 60s pour éviter les fuites mémoire.
 *
 * @param {string} path - ex: `/pdf/devis/${id}`
 * @param {string} filename - ex: `DEV-2026-001.pdf`
 */
export async function downloadPdf(path, filename) {
  const safeName = filename || 'document.pdf'

  try {
    const res = await api.get(path, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const file = new File([blob], safeName, { type: 'application/pdf' })

    // 1. Web Share API avec fichiers (iOS 15+, Android, PWA compatible)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: safeName })
        return // l'utilisateur a choisi son action (enregistrer, annuler, partager)
      } catch (err) {
        if (err.name === 'AbortError') return // annulation utilisateur, silencieux
        // Autre erreur (ex: permission refusée) → on tente le fallback
      }
    }

    // 2. Fallback desktop : download link classique
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = safeName
    a.target = '_blank'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    setTimeout(() => URL.revokeObjectURL(url), 60000)
    toast.success('PDF téléchargé')
  } catch (err) {
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
