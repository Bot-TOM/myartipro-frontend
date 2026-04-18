import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

/**
 * Bannière affichée lorsque le profil ne contient pas les mentions légales
 * obligatoires pour émettre un devis / une facture en France.
 */
export default function ProfilIncompletBanner({ missing }) {
  if (!missing?.length) return null
  return (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 mb-4">
      <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-600" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Profil incomplet — mentions légales obligatoires</p>
        <p className="text-sm mt-1">
          Renseignez : <span className="font-semibold">{missing.join(', ')}</span>
        </p>
        <Link
          to="/profil"
          className="inline-block mt-2 text-sm font-medium text-amber-700 hover:text-amber-900 underline"
        >
          Compléter mon profil →
        </Link>
      </div>
    </div>
  )
}
