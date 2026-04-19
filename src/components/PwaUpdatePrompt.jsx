import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw } from 'lucide-react'

/**
 * Détecte une nouvelle version du service worker et affiche
 * un bandeau fixe en bas d'écran pour inviter l'utilisateur à recharger.
 * N'interrompt pas le travail en cours — l'utilisateur choisit quand recharger.
 */
export default function PwaUpdatePrompt() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="bg-gray-900 text-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl">
        <RefreshCw size={18} className="shrink-0 text-primary-400" />
        <p className="text-sm flex-1">Mise à jour disponible</p>
        <button
          onClick={() => updateServiceWorker(true)}
          className="text-sm font-semibold text-primary-400 hover:text-primary-300 whitespace-nowrap transition"
        >
          Recharger
        </button>
      </div>
    </div>
  )
}
