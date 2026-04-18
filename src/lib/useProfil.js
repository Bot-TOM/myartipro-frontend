import { useEffect, useState } from 'react'
import api from './api'
import useAuth from './useAuth'

/**
 * Hook qui charge le profil et indique si les champs légaux
 * obligatoires pour émettre un devis/facture sont remplis.
 *
 * Champs requis pour conformité facturation France :
 *  - SIRET (14 chiffres)
 *  - Adresse
 *  - Identité (entreprise OU nom + prénom)
 */
const LABELS = {
  siret: 'SIRET',
  adresse: 'Adresse',
  identite: 'Nom / entreprise',
}

export default function useProfil() {
  const { user } = useAuth()
  const [profil, setProfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancel = false
    ;(async () => {
      try {
        const { data } = await api.get('/auth/me')
        if (!cancel) setProfil(data)
      } catch {
        if (!cancel) setProfil(null)
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => { cancel = true }
  }, [user])

  const missing = []
  if (profil) {
    if (!profil.siret || !/^\d{14}$/.test(profil.siret)) missing.push(LABELS.siret)
    if (!profil.adresse?.trim()) missing.push(LABELS.adresse)
    const aIdentite = profil.entreprise?.trim() || (profil.nom?.trim() && profil.prenom?.trim())
    if (!aIdentite) missing.push(LABELS.identite)
  }

  return {
    profil,
    loading,
    isComplete: !!profil && missing.length === 0,
    missing,
  }
}
