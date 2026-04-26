import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../lib/useAuth'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import api from '../lib/api'
import { downloadPdf } from '../lib/downloadPdf'
import { shareLink } from '../lib/shareLink'
import { toastApiError } from '../lib/toastApiError'
import { SkeletonCardList, SkeletonTableRow } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import {
  Download, Trash2, CheckCircle, CreditCard,
  FileSpreadsheet, Receipt, FileDown,
} from 'lucide-react'

const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const FILTERS = [
  { value: 'tous',   label: 'Toutes' },
  { value: 'émise',  label: 'Émises' },
  { value: 'payée',  label: 'Payées' },
]

const ANNEES = [new Date().getFullYear() - 1, new Date().getFullYear()]

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('fr-FR')
}

function formatEur(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)
}

function clientNom(f) {
  if (!f.clients) return '—'
  return `${f.clients.prenom || ''} ${f.clients.nom || ''}`.trim() || '—'
}

export default function Factures() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [factures, setFactures]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('tous')
  const [exportMois, setExportMois]   = useState(new Date().getMonth() + 1)
  const [exportAnnee, setExportAnnee] = useState(new Date().getFullYear())
  const [exporting, setExporting]     = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [markingPaidId, setMarkingPaidId] = useState(null)
  const [markingMode, setMarkingMode]     = useState('virement')

  useEffect(() => {
    if (user) loadFactures()
  }, [user, location.key])

  async function loadFactures() {
    setLoading(true)
    try {
      const { data } = await api.get('/factures')
      setFactures(data || [])
    } catch (err) {
      toastApiError(err, 'Erreur lors du chargement des factures')
    } finally {
      setLoading(false)
    }
  }

  async function handleExportCSV() {
    setExporting(true)
    try {
      const res = await api.get('/factures/export/csv', {
        params: { mois: exportMois, annee: exportAnnee },
        responseType: 'blob',
      })
      const mm = String(exportMois).padStart(2, '0')
      const filename = `bilan_${exportAnnee}-${mm}.csv`
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const file = new File([blob], filename, { type: 'text/csv' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: filename }).catch(() => triggerBlobDownload(blob, filename))
      } else {
        triggerBlobDownload(blob, filename)
      }
      toast.success('Bilan exporté')
    } catch {
      toast.error("Erreur lors de l'export")
    } finally {
      setExporting(false)
    }
  }

  async function handleDownloadPDF(factureId, numero) {
    await downloadPdf(`/pdf/facture/${factureId}`, `${numero || 'facture'}.pdf`)
  }

  async function handleMarquerPayee(factureId, mode) {
    try {
      await api.put(`/factures/${factureId}`, {
        statut: 'payée',
        date_paiement: new Date().toISOString(),
        mode_paiement: mode,
      })
      toast.success('Facture marquée comme payée')
      setMarkingPaidId(null)
      loadFactures()
    } catch (err) {
      toastApiError(err, 'Erreur lors de la mise à jour')
    }
  }

  async function handleExportPdf() {
    setExportingPdf(true)
    try {
      const res = await api.get('/factures/export/pdf', {
        params: { mois: exportMois, annee: exportAnnee },
        responseType: 'blob',
      })
      const mm = String(exportMois).padStart(2, '0')
      const filename = `livre_recettes_${exportAnnee}-${mm}.pdf`
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const file = new File([blob], filename, { type: 'application/pdf' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: filename }).catch(() => triggerBlobDownload(blob, filename))
      } else {
        triggerBlobDownload(blob, filename)
      }
      toast.success('Livre des recettes généré')
    } catch {
      toast.error('Erreur lors de la génération du PDF')
    } finally {
      setExportingPdf(false)
    }
  }

  function triggerBlobDownload(blob, filename) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  async function handleDelete(facture) {
    const message = facture.statut === 'brouillon'
      ? 'Supprimer définitivement cette facture ?'
      : 'Cette facture sera archivée (conservation légale 10 ans). Continuer ?'
    if (!window.confirm(message)) return
    try {
      const { data } = await api.delete(`/factures/${facture.id}`)
      toast.success(data?.message || (facture.statut === 'brouillon' ? 'Facture supprimée' : 'Facture archivée'))
      loadFactures()
    } catch (err) {
      toastApiError(err, 'Erreur lors de la suppression')
    }
  }

  async function handleGenererLienPaiement(factureId) {
    try {
      const { data } = await api.post(`/stripe/checkout/${factureId}`)
      await shareLink(data.checkout_url, {
        title: 'Lien de paiement',
        text: 'Voici le lien pour régler votre facture :',
        successMsg: 'Lien de paiement copié',
      })
      loadFactures()
    } catch (err) {
      toastApiError(err, 'Erreur lors de la génération du lien')
    }
  }

  const filtered = filter === 'tous' ? factures : factures.filter((f) => f.statut === filter)

  const totalImpaye = factures
    .filter((f) => f.statut === 'émise')
    .reduce((sum, f) => sum + (f.montant_ttc || 0), 0)

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Factures</h1>
          <p className="text-slate-500 mt-1 text-sm">{factures.length} facture{factures.length !== 1 ? 's' : ''}</p>
        </div>
        {totalImpaye > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate-400">En attente</p>
            <p className="text-lg font-bold text-orange-600">{formatEur(totalImpaye)}</p>
          </div>
        )}
      </div>

      {/* Export comptable */}
      {factures.length > 0 && (
        <div className="mb-5 bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-primary-600" />
            Bilan comptable mensuel
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={exportMois}
              onChange={(e) => setExportMois(Number(e.target.value))}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white"
            >
              {MOIS_LABELS.map((label, i) => (
                <option key={i + 1} value={i + 1}>{label}</option>
              ))}
            </select>
            <select
              value={exportAnnee}
              onChange={(e) => setExportAnnee(Number(e.target.value))}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white"
            >
              {ANNEES.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <button
              onClick={handleExportCSV}
              disabled={exporting}
              className="flex items-center gap-2 text-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 px-4 py-2 rounded-xl transition font-medium"
            >
              <FileSpreadsheet size={16} />
              {exporting ? 'Génération...' : 'Bilan CSV'}
            </button>
            <button
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="flex items-center gap-2 text-sm text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-2 rounded-xl transition font-medium"
            >
              <FileDown size={16} />
              {exportingPdf ? 'Génération...' : 'Livre des recettes PDF'}
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Bilan CSV : journal + synthèse CA/TVA + encaissements · compatible Excel / Numbers
          </p>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition whitespace-nowrap ${
              filter === f.value
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {loading ? (
        <>
          <div className="md:hidden"><SkeletonCardList count={4} /></div>
          <div className="hidden md:block bg-white rounded-2xl overflow-hidden">
            <table className="w-full">
              <tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} cols={7} />)}</tbody>
            </table>
          </div>
        </>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Aucune facture"
          description="Convertissez un devis envoyé ou accepté en facture depuis la page Devis"
        />
      ) : (
        <>
          {/* Vue mobile */}
          <div className="space-y-3 md:hidden">
            {filtered.map((f) => (
              <div
                key={f.id}
                onClick={() => navigate(`/factures/${f.id}`)}
                className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-mono text-xs text-slate-400">{f.numero}</p>
                    <p className="font-semibold text-slate-900">{f.titre}</p>
                    <p className="text-sm text-slate-500">{clientNom(f)}</p>
                  </div>
                  <StatusBadge statut={f.statut} />
                </div>
                <div
                  className="flex items-center justify-between mt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="font-bold text-slate-900">{formatEur(f.montant_ttc)}</p>
                  <ActionButtons
                    f={f}
                    onPdf={() => handleDownloadPDF(f.id, f.numero)}
                    onPay={() => handleGenererLienPaiement(f.id)}
                    onMarkPaid={() => { setMarkingPaidId(f.id); setMarkingMode('virement') }}
                    onDelete={() => handleDelete(f)}
                    size={18}
                  />
                </div>
                {markingPaidId === f.id && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <ModePaiementPicker
                      mode={markingMode}
                      onMode={setMarkingMode}
                      onConfirm={() => handleMarquerPayee(f.id, markingMode)}
                      onCancel={() => setMarkingPaidId(null)}
                    />
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-2">{formatDate(f.date_creation)}</p>
              </div>
            ))}
          </div>

          {/* Vue desktop */}
          <div className="hidden md:block bg-white rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  {['Numéro', 'Client', 'Titre', 'Montant TTC', 'Statut', 'Date', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide last:text-right">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => (
                  <tr
                    key={f.id}
                    onClick={() => navigate(`/factures/${f.id}`)}
                    className="border-b last:border-0 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="px-5 py-4 text-sm font-mono text-slate-700">{f.numero}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">{clientNom(f)}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">{f.titre}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">{formatEur(f.montant_ttc)}</td>
                    <td className="px-5 py-4"><StatusBadge statut={f.statut} /></td>
                    <td className="px-5 py-4 text-sm text-slate-500">{formatDate(f.date_creation)}</td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end">
                        <ActionButtons
                          f={f}
                          onPdf={() => handleDownloadPDF(f.id, f.numero)}
                          onPay={() => handleGenererLienPaiement(f.id)}
                          onMarkPaid={() => { setMarkingPaidId(f.id); setMarkingMode('virement') }}
                          onDelete={() => handleDelete(f)}
                          size={16}
                        />
                      </div>
                      {markingPaidId === f.id && (
                        <ModePaiementPicker
                          mode={markingMode}
                          onMode={setMarkingMode}
                          onConfirm={() => handleMarquerPayee(f.id, markingMode)}
                          onCancel={() => setMarkingPaidId(null)}
                        />
                      )}
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

function ActionButtons({ f, onPdf, onPay, onMarkPaid, onDelete, size }) {
  return (
    <div className="flex items-center gap-1">
      <IconBtn onClick={onPdf} title="Télécharger PDF" hoverClass="hover:text-primary-600 hover:bg-primary-50">
        <Download size={size} />
      </IconBtn>
      {f.statut === 'émise' && (
        <IconBtn onClick={onPay} title="Générer lien de paiement" hoverClass="hover:text-violet-600 hover:bg-violet-50">
          <CreditCard size={size} />
        </IconBtn>
      )}
      {f.statut === 'émise' && (
        <IconBtn onClick={onMarkPaid} title="Marquer payée" hoverClass="hover:text-green-600 hover:bg-green-50">
          <CheckCircle size={size} />
        </IconBtn>
      )}
      <IconBtn onClick={onDelete} title="Supprimer / Archiver" hoverClass="hover:text-red-600 hover:bg-red-50">
        <Trash2 size={size} />
      </IconBtn>
    </div>
  )
}

function IconBtn({ onClick, title, hoverClass, activeClass = 'text-slate-400', children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition ${activeClass} ${hoverClass}`}
    >
      {children}
    </button>
  )
}

const MODES = [
  { value: 'virement',  label: 'Virement' },
  { value: 'cheque',    label: 'Chèque' },
  { value: 'especes',   label: 'Espèces' },
  { value: 'carte',     label: 'Carte' },
]

function ModePaiementPicker({ mode, onMode, onConfirm, onCancel }) {
  return (
    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
      <p className="text-xs font-medium text-slate-500">Mode de règlement</p>
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => onMode(m.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              mode === m.value
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-green-400'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onConfirm}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 rounded-xl transition"
        >
          Confirmer
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
