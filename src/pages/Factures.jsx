import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import useAuth from '../lib/useAuth'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import api, { API_URL } from '../lib/api'
import toast from 'react-hot-toast'
import { Download, Trash2, CheckCircle, CreditCard, Copy, FileSpreadsheet } from 'lucide-react'

export default function Factures() {
  const { user } = useAuth()
  const [factures, setFactures] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('tous')

  useEffect(() => {
    if (user) loadFactures()
  }, [user])

  const loadFactures = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/factures')
      setFactures(data || [])
    } catch {
      toast.error('Erreur lors du chargement des factures')
    }
    setLoading(false)
  }

  const handleDownloadPDF = async (factureId, numero) => {
    try {
      const res = await api.get(`/pdf/facture/${factureId}`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const reader = new FileReader()
      reader.onload = () => {
        const a = document.createElement('a')
        a.href = reader.result
        a.download = `${numero || 'facture'}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
      reader.readAsDataURL(blob)
      toast.success('PDF téléchargé !')
    } catch (err) {
      let msg = 'Erreur lors du téléchargement du PDF'
      if (err.response?.data) {
        try {
          const text = await err.response.data.text?.() || ''
          const json = JSON.parse(text)
          if (json.detail) msg = json.detail
        } catch {}
      }
      toast.error(msg)
    }
  }

  const handleMarquerPayee = async (factureId) => {
    try {
      await api.put(`/factures/${factureId}`, {
        statut: 'payée',
        date_paiement: new Date().toISOString(),
      })
      toast.success('Facture marquée comme payée')
      loadFactures()
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleDelete = async (factureId) => {
    if (!window.confirm('Supprimer cette facture ?')) return
    try {
      await api.delete(`/factures/${factureId}`)
      toast.success('Facture supprimée')
      loadFactures()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleGenererLienPaiement = async (factureId) => {
    try {
      const { data } = await api.post(`/stripe/checkout/${factureId}`)
      await navigator.clipboard.writeText(data.checkout_url)
      toast.success('Lien de paiement copié dans le presse-papier')
      loadFactures()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la génération du lien')
    }
  }

  const handleCopierLien = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Lien copié dans le presse-papier')
    } catch {
      toast.error('Impossible de copier le lien')
    }
  }

  const filtered = filter === 'tous'
    ? factures
    : factures.filter((f) => f.statut === filter)

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('fr-FR')
  }

  const formatEur = (montant) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant || 0)

  const filters = [
    { value: 'tous', label: 'Toutes' },
    { value: 'émise', label: 'Émises' },
    { value: 'payée', label: 'Payées' },
  ]

  const totalImpaye = factures
    .filter((f) => f.statut === 'émise')
    .reduce((sum, f) => sum + (f.montant_ttc || 0), 0)

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
          <p className="text-gray-500 mt-1">{factures.length} facture{factures.length > 1 ? 's' : ''}</p>
        </div>
        {totalImpaye > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-400">En attente de paiement</p>
            <p className="text-lg font-bold text-orange-600">{formatEur(totalImpaye)}</p>
          </div>
        )}
      </div>

      {factures.length > 0 && (
        <div className="mb-4">
          <button
            onClick={async () => {
              try {
                const { data: { session } } = await supabase.auth.getSession()
                const token = session?.access_token
                window.open(`${API_URL}/factures/export/csv?token=${token}`, '_blank')
              } catch {
                toast.error('Erreur export CSV')
              }
            }}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 border border-gray-300 hover:border-primary-500 px-3 py-2 rounded-lg transition"
          >
            <FileSpreadsheet size={16} />
            Exporter CSV (comptable)
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              filter === f.value
                ? 'bg-primary-600 text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Chargement...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <p className="text-gray-400 mb-2">Aucune facture</p>
          <p className="text-sm text-gray-400">Convertissez un devis envoyé ou accepté en facture</p>
        </div>
      ) : (
        <>
          {/* Vue mobile */}
          <div className="space-y-3 md:hidden">
            {filtered.map((f) => (
              <div key={f.id} className="bg-white rounded-xl border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-mono text-sm text-gray-500">{f.numero}</p>
                    <p className="font-semibold text-gray-900">{f.titre}</p>
                    <p className="text-sm text-gray-500">
                      {f.clients ? `${f.clients.prenom || ''} ${f.clients.nom}`.trim() : '-'}
                    </p>
                  </div>
                  <StatusBadge statut={f.statut} />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="font-bold text-gray-900">{formatEur(f.montant_ttc)}</p>
                  <div className="flex gap-1">
                    <button onClick={() => handleDownloadPDF(f.id, f.numero)} className="p-2 text-gray-400 hover:text-primary-600 rounded-lg" title="PDF">
                      <Download size={18} />
                    </button>
                    {f.statut === 'émise' && !f.stripe_checkout_url && (
                      <button onClick={() => handleGenererLienPaiement(f.id)} className="p-2 text-gray-400 hover:text-violet-600 rounded-lg" title="Générer lien de paiement">
                        <CreditCard size={18} />
                      </button>
                    )}
                    {f.statut === 'émise' && f.stripe_checkout_url && (
                      <button onClick={() => handleCopierLien(f.stripe_checkout_url)} className="p-2 text-violet-500 hover:text-violet-700 rounded-lg" title="Copier le lien de paiement">
                        <Copy size={18} />
                      </button>
                    )}
                    {f.statut === 'émise' && (
                      <button onClick={() => handleMarquerPayee(f.id)} className="p-2 text-gray-400 hover:text-green-600 rounded-lg" title="Marquer payée">
                        <CheckCircle size={18} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(f.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg" title="Supprimer">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">{formatDate(f.date_creation)}</p>
              </div>
            ))}
          </div>

          {/* Vue desktop */}
          <div className="hidden md:block bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Numéro</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Client</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Titre</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Montant TTC</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr key={f.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm font-mono text-gray-900">{f.numero}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">
                      {f.clients ? `${f.clients.prenom || ''} ${f.clients.nom}`.trim() : '-'}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">{f.titre}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">{formatEur(f.montant_ttc)}</td>
                    <td className="px-5 py-4"><StatusBadge statut={f.statut} /></td>
                    <td className="px-5 py-4 text-sm text-gray-500">{formatDate(f.date_creation)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleDownloadPDF(f.id, f.numero)} title="PDF" className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition">
                          <Download size={16} />
                        </button>
                        {f.statut === 'émise' && !f.stripe_checkout_url && (
                          <button onClick={() => handleGenererLienPaiement(f.id)} title="Générer lien de paiement" className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition">
                            <CreditCard size={16} />
                          </button>
                        )}
                        {f.statut === 'émise' && f.stripe_checkout_url && (
                          <button onClick={() => handleCopierLien(f.stripe_checkout_url)} title="Copier le lien de paiement" className="p-1.5 text-violet-500 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition">
                            <Copy size={16} />
                          </button>
                        )}
                        {f.statut === 'émise' && (
                          <button onClick={() => handleMarquerPayee(f.id)} title="Marquer payée" className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(f.id)} title="Supprimer" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  )
}
