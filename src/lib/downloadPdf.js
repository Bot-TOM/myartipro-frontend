import api from './api'
import toast from 'react-hot-toast'

/**
 * Télécharge (desktop/Android) ou ouvre (iOS) un PDF authentifié.
 *
 * Stratégie cross-platform :
 *  - On récupère le blob via axios (headers d'auth inclus).
 *  - On crée un blob URL (pas de data URL : évite la limite de taille des
 *    base64 et le blocage iOS sur FileReader + .click() async).
 *  - On déclenche un <a target="_blank" download> :
 *      · desktop / Android → téléchargement direct dans Téléchargements
 *      · iOS Safari → ignore `download` mais ouvre le PDF dans un nouvel
 *        onglet ; l'utilisateur fait Partager → Enregistrer dans Fichiers.
 *  - On révoque le blob URL au bout de 60s pour libérer la mémoire.
 *
 * @param {string} path - ex: `/pdf/devis/${id}`
 * @param {string} filename - ex: `DEV-2026-001.pdf`
 */
export async function downloadPdf(path, filename) {
  try {
    const res = await api.get(path, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'document.pdf'
    a.target = '_blank'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    setTimeout(() => URL.revokeObjectURL(url), 60000)
    toast.success('PDF prêt')
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
