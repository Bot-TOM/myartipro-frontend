import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, ArrowRight, Rocket, X } from 'lucide-react'
import api from '../lib/api'

/**
 * Checklist d'onboarding affichée en tête du Dashboard.
 *
 * Règles :
 *  - Apparait uniquement si `profil.onboarding_done === false`
 *    ET au moins une étape est incomplète.
 *  - Les 4 étapes s'auto-cochent à partir des données déjà chargées
 *    par le Dashboard (aucune requête supplémentaire).
 *  - À 4/4 ou sur "Ignorer" → PUT /auth/me {onboarding_done: true}
 *    puis `onDismiss()` (optimistic : l'encart disparait localement
 *    avant même le retour backend).
 *
 * Props :
 *  @param {object} profil           profil chargé (null possible)
 *  @param {boolean} isProfilComplete flag calculé par useProfil()
 *  @param {number} clientsCount     nombre de clients
 *  @param {Array} devis             devis bruts (au moins {statut})
 *  @param {Function} onDismiss      callback quand la checklist se ferme
 */

const STATUTS_DEVIS_ENVOYE = new Set([
  'envoyé', 'relancé', 'accepté', 'refusé', 'facturé',
])

export default function OnboardingChecklist({
  profil,
  isProfilComplete,
  clientsCount,
  devis,
  onDismiss,
}) {
  const [dismissed, setDismissed] = useState(false)
  const persistedRef = useRef(false)

  const steps = useMemo(() => {
    const devisEnvoye = (devis || []).some((d) => STATUTS_DEVIS_ENVOYE.has(d?.statut))
    return [
      {
        key: 'profil',
        label: 'Compléter ton profil (SIRET, adresse)',
        done: !!isProfilComplete,
        to: '/profil',
      },
      {
        key: 'client',
        label: 'Ajouter ton premier client',
        done: (clientsCount || 0) > 0,
        to: '/clients',
      },
      {
        key: 'devis',
        label: 'Créer ton premier devis',
        done: (devis || []).length > 0,
        to: '/devis/nouveau',
      },
      {
        key: 'envoi',
        label: 'Envoyer ton premier devis au client',
        done: devisEnvoye,
        to: '/devis',
      },
    ]
  }, [isProfilComplete, clientsCount, devis])

  const completedCount = steps.filter((s) => s.done).length
  const total = steps.length
  const progress = Math.round((completedCount / total) * 100)
  const allDone = completedCount === total

  // Persistance en DB (une seule fois) dès que fini ou ignoré.
  const persist = async () => {
    if (persistedRef.current) return
    persistedRef.current = true
    try {
      await api.put('/auth/me', { onboarding_done: true })
    } catch {
      // silencieux : si l'appel échoue, la checklist réapparaitra
      // au prochain chargement — pas bloquant.
      persistedRef.current = false
    }
  }

  // Auto-dismiss dès que 4/4 atteint.
  useEffect(() => {
    if (allDone && !dismissed) {
      setDismissed(true)
      persist()
      onDismiss?.()
    }
  }, [allDone, dismissed, onDismiss])

  const handleIgnore = () => {
    setDismissed(true)
    persist()
    onDismiss?.()
  }

  // Ne rien afficher si déjà terminé côté DB, ou dismissé localement.
  if (!profil || profil.onboarding_done || dismissed) return null

  const prenom = (profil.prenom || '').trim()
  const titre = prenom ? `Bienvenue ${prenom} !` : 'Bienvenue sur MyArtipro !'

  return (
    <div className="bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-200 rounded-xl p-4 sm:p-5 mb-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-2 rounded-lg bg-primary-600 text-white shrink-0">
            <Rocket size={16} />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900 truncate">{titre}</h2>
            <p className="text-xs text-gray-500">
              {completedCount}/{total} étape{total > 1 ? 's' : ''} complétée{completedCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={handleIgnore}
          className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 shrink-0"
          aria-label="Ignorer la checklist"
          type="button"
        >
          <X size={14} />
          <span className="hidden sm:inline">Ignorer</span>
        </button>
      </div>

      {/* Barre de progression */}
      <div className="h-1.5 bg-white/70 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-primary-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Étapes */}
      <ul className="space-y-1.5">
        {steps.map((step) => (
          <li key={step.key}>
            {step.done ? (
              <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
                <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                <span className="text-sm text-gray-500 line-through truncate">
                  {step.label}
                </span>
              </div>
            ) : (
              <Link
                to={step.to}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/70 active:bg-white transition"
              >
                <Circle size={18} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-900 flex-1 truncate">
                  {step.label}
                </span>
                <ArrowRight size={14} className="text-primary-600 shrink-0" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
