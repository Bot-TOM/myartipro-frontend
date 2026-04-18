import toast from 'react-hot-toast'

/**
 * Partage un lien URL avec la meilleure UX possible selon la plateforme.
 *
 * Stratégie cross-platform :
 *  1. Mobile (iOS PWA, Android) → Web Share API : feuille de partage native
 *     (SMS, WhatsApp, email, copier...). C'est le chemin nominal artisan → client.
 *  2. Desktop → navigator.clipboard si disponible.
 *  3. Dernier recours → window.open dans un nouvel onglet, l'utilisateur copie
 *     depuis la barre d'adresse.
 *
 * Pas d'exception propagée : toujours une issue utilisable + toast adapté.
 *
 * @param {string} url - URL à partager
 * @param {object} [opts]
 * @param {string} [opts.title] - titre de la feuille de partage natif
 * @param {string} [opts.text] - message accompagnant le lien
 * @param {string} [opts.successMsg] - toast de succès par défaut si clipboard
 */
export async function shareLink(url, opts = {}) {
  const { title = 'Lien de paiement', text, successMsg = 'Lien copié' } = opts

  // 1. Web Share API (mobile natif)
  if (navigator.share) {
    try {
      await navigator.share({ url, title, text })
      return
    } catch (err) {
      if (err.name === 'AbortError') return // annulation utilisateur
      // autre erreur → fallback
    }
  }

  // 2. Clipboard API (desktop)
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url)
      toast.success(successMsg)
      return
    } catch {
      // fallback window.open
    }
  }

  // 3. Dernier recours : ouvrir le lien
  window.open(url, '_blank', 'noopener,noreferrer')
  toast('Lien ouvert dans un nouvel onglet', { icon: 'ℹ️' })
}
