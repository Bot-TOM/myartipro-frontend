import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function DevisPublic() {
  const { token } = useParams()
  const [devis, setDevis] = useState(null)
  const [statut, setStatut] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [action, setAction] = useState(null) // 'accepter' | 'refuser'
  const [done, setDone] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_URL}/devis/public/${token}`)
        setDevis(res.data)
        setStatut(res.data.statut)
      } catch {
        setError('Ce lien est invalide ou a expiré.')
      }
      setLoading(false)
    }
    load()
  }, [token])

  const handleAction = async (type) => {
    setAction(type)
    try {
      await axios.post(`${API_URL}/devis/public/${token}/${type}`)
      setStatut(type === 'accepter' ? 'accepté' : 'refusé')
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Une erreur est survenue.')
      setAction(null)
    }
  }

  const formatEur = (v) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v || 0)

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '-')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">Chargement...</p>
      </div>
    )
  }

  if (error && !devis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Lien invalide</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  const client = devis?.clients || {}
  const prestations = devis?.prestations || []
  const deja_traite = statut === 'accepté' || statut === 'refusé' || statut === 'facturé'
  const paiement = devis?.artisan_paiement || {}

  const MOYENS_LABELS = {
    especes: { label: 'Espèces', icon: '💵' },
    cheque: { label: 'Chèque', icon: '📄' },
    virement: { label: 'Virement bancaire', icon: '🏦' },
    sur_place: { label: 'Paiement sur place', icon: '📍' },
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto space-y-5">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-600">MyArtipro</h1>
          <p className="text-gray-500 text-sm mt-1">Votre devis en ligne</p>
        </div>

        {/* Statut après action */}
        {done && (
          <div className={`rounded-xl p-4 text-center font-semibold text-lg ${
            statut === 'accepté' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {statut === 'accepté' ? '✅ Vous avez accepté ce devis.' : '❌ Vous avez refusé ce devis.'}
          </div>
        )}

        {/* Infos devis */}
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide">Devis</p>
              <p className="text-xl font-bold text-gray-900">{devis?.numero}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Date</p>
              <p className="text-sm text-gray-700">{formatDate(devis?.date_creation)}</p>
              {devis?.date_validite && (
                <>
                  <p className="text-xs text-gray-400 mt-1">Valide jusqu'au</p>
                  <p className="text-sm text-gray-700">{formatDate(devis?.date_validite)}</p>
                </>
              )}
            </div>
          </div>

          <div className="border-t pt-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Objet</p>
            <p className="text-gray-800 font-medium">{devis?.titre}</p>
          </div>

          {(client.nom || client.prenom) && (
            <div className="border-t pt-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Client</p>
              <p className="text-gray-800">{`${client.prenom || ''} ${client.nom || ''}`.trim()}</p>
              {client.adresse && <p className="text-sm text-gray-500">{client.adresse}</p>}
            </div>
          )}
        </div>

        {/* Prestations */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-3 bg-primary-600 text-white grid grid-cols-12 text-xs font-semibold">
            <span className="col-span-6">Description</span>
            <span className="col-span-2 text-right">Qté</span>
            <span className="col-span-4 text-right">Total HT</span>
          </div>
          {prestations.map((p, i) => (
            <div key={i} className={`px-4 py-3 grid grid-cols-12 text-sm ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
              <span className="col-span-6 text-gray-800">{p.description}</span>
              <span className="col-span-2 text-right text-gray-500">{p.quantite}</span>
              <span className="col-span-4 text-right text-gray-800">{formatEur(p.quantite * p.prix_unitaire)}</span>
            </div>
          ))}
        </div>

        {/* Totaux */}
        <div className="bg-white rounded-xl border p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total HT</span>
            <span>{formatEur(devis?.montant_ht)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>TVA ({devis?.tva}%)</span>
            <span>{formatEur((devis?.montant_ttc || 0) - (devis?.montant_ht || 0))}</span>
          </div>
          <div className="flex justify-between font-bold text-lg text-primary-600 border-t pt-2">
            <span>Total TTC</span>
            <span>{formatEur(devis?.montant_ttc)}</span>
          </div>
        </div>

        {/* Notes */}
        {devis?.notes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-gray-700">
            <p className="font-semibold text-xs text-yellow-700 mb-1 uppercase">Notes</p>
            {devis.notes}
          </div>
        )}

        {/* Boutons d'action */}
        {!done && !deja_traite && (
          <div className="space-y-3 pt-2">
            <p className="text-center text-sm text-gray-500">Donnez votre réponse :</p>
            <button
              onClick={() => handleAction('accepter')}
              disabled={action !== null}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl text-lg transition disabled:opacity-50"
            >
              {action === 'accepter' ? 'Envoi...' : '✅ Accepter le devis'}
            </button>
            <button
              onClick={() => handleAction('refuser')}
              disabled={action !== null}
              className="w-full bg-white border-2 border-red-300 hover:bg-red-50 text-red-600 font-semibold py-4 rounded-xl text-lg transition disabled:opacity-50"
            >
              {action === 'refuser' ? 'Envoi...' : '❌ Refuser le devis'}
            </button>
          </div>
        )}

        {deja_traite && !done && (
          <div className={`rounded-xl p-4 text-center font-medium ${
            statut === 'accepté' || statut === 'facturé'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {statut === 'accepté' || statut === 'facturé'
              ? '✅ Ce devis a été accepté.'
              : '❌ Ce devis a été refusé.'}
          </div>
        )}

        {/* Paiement */}
        {(paiement.stripe_enabled || (paiement.moyens_paiement && paiement.moyens_paiement.length > 0) || paiement.instructions_paiement) && (
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Modalités de paiement</p>
            {paiement.stripe_enabled && (
              <button
                disabled
                className="flex items-center gap-2 bg-violet-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg opacity-60 cursor-not-allowed"
                title="Le paiement en ligne sera disponible sur la facture"
              >
                💳 Payer en ligne (disponible sur facture)
              </button>
            )}
            {paiement.moyens_paiement && paiement.moyens_paiement.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {paiement.moyens_paiement.map((m) => (
                  MOYENS_LABELS[m] && (
                    <span key={m} className="bg-gray-50 border border-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-full">
                      {MOYENS_LABELS[m].icon} {MOYENS_LABELS[m].label}
                    </span>
                  )
                ))}
              </div>
            )}
            {paiement.instructions_paiement && (
              <p className="text-sm text-gray-600 italic">{paiement.instructions_paiement}</p>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-4">
          Envoyé via MyArtipro
        </p>
      </div>
    </div>
  )
}
