import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { downloadPdf } from '../lib/downloadPdf'
import { shareLink } from '../lib/shareLink'
import { toastApiError } from '../lib/toastApiError'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import { SkeletonBlock, SkeletonLine } from '../components/Skeleton'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Download, Trash2, CheckCircle, CreditCard,
  User, CalendarDays, StickyNote, RefreshCw,
} from 'lucide-react'

const formatEur  = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)
const formatDate = (s) => s ? new Date(s).toLocaleDateString('fr-FR') : '—'

const MODES = [
  { value: 'virement', label: 'Virement' },
  { value: 'cheque',   label: 'Chèque' },
  { value: 'especes',  label: 'Espèces' },
  { value: 'carte',    label: 'Carte' },
]

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-800 text-right">{value}</span>
    </div>
  )
}

export default function FactureDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [facture, setFacture]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [markingPaid, setMarkingPaid]       = useState(false)
  const [modeReglement, setModeReglement]   = useState('virement')
  const [confirmRelance, setConfirmRelance] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/factures/${id}`)
        setFacture(data)
      } catch (err) {
        toastApiError(err, 'Facture introuvable')
        navigate('/factures')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const reload = async () => {
    const { data } = await api.get(`/factures/${id}`)
    setFacture(data)
  }

  const handleMarquerPayee = async () => {
    try {
      await api.put(`/factures/${id}`, {
        statut: 'payée',
        date_paiement: new Date().toISOString(),
        mode_paiement: modeReglement,
      })
      toast.success('Facture marquée comme payée')
      setMarkingPaid(false)
      reload()
    } catch (err) {
      toastApiError(err, 'Erreur lors de la mise à jour')
    }
  }

  const handleLienPaiement = async () => {
    try {
      const { data } = await api.post(`/stripe/checkout/${id}`)
      await shareLink(data.checkout_url, {
        title: 'Lien de paiement',
        text: 'Voici le lien pour régler votre facture :',
        successMsg: 'Lien de paiement copié',
      })
      reload()
    } catch (err) {
      toastApiError(err, 'Erreur lors de la génération du lien')
    }
  }

  const handleRelancer = async () => {
    if (!confirmRelance) {
      setConfirmRelance(true)
      setTimeout(() => setConfirmRelance(false), 4000)
      return
    }
    setConfirmRelance(false)
    try {
      const { data } = await api.post(`/factures/${id}/relancer`)
      toast.success(`Relance envoyée (palier ${data.palier}/3)`)
      reload()
    } catch (err) {
      toastApiError(err, 'Erreur lors de la relance')
    }
  }

  const handleDelete = async () => {
    const message = facture.statut === 'brouillon'
      ? 'Supprimer définitivement cette facture ?'
      : 'Cette facture sera archivée (conservation légale 10 ans). Continuer ?'
    if (!window.confirm(message)) return
    try {
      const { data } = await api.delete(`/factures/${id}`)
      toast.success(data?.message || (facture.statut === 'brouillon' ? 'Facture supprimée' : 'Facture archivée'))
      navigate('/factures')
    } catch (err) {
      toastApiError(err, 'Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="space-y-4 max-w-2xl">
          <SkeletonLine className="w-32 h-5" />
          <SkeletonBlock className="w-full h-28 rounded-2xl" />
          <SkeletonBlock className="w-full h-48 rounded-2xl" />
          <SkeletonBlock className="w-full h-32 rounded-2xl" />
        </div>
      </Layout>
    )
  }

  if (!facture) return null

  const client        = facture.clients || {}
  const prestations   = facture.prestations || []
  const ht            = facture.montant_ht  || 0
  const ttc           = facture.montant_ttc || 0
  const tva           = facture.tva         || 0
  const isFranchise   = tva === 0
  const montantTVA    = ttc - ht
  const acomptePct    = facture.acompte_pct || 0
  const acompteTTC    = acomptePct > 0 ? ttc * acomptePct / 100 : 0
  const netAPayer     = acomptePct > 0 ? ttc - acompteTTC : ttc
  const relancesCount = facture.relances_count || 0

  const PALIER_LABELS = { 0: '1er rappel', 1: '2e rappel', 2: 'Mise en demeure' }
  const palierLabel  = PALIER_LABELS[relancesCount] ?? null
  const canRelancer  = facture.statut === 'émise' && !!client.email && palierLabel !== null

  return (
    <Layout>
      <div className="max-w-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate('/factures')}
            className="p-2 rounded-xl hover:bg-white transition text-slate-500 shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm text-slate-400">{facture.numero}</span>
              <StatusBadge statut={facture.statut} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight truncate mt-0.5">
              {facture.titre || '—'}
            </h1>
          </div>
        </div>

        {/* Client */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <User size={14} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Client</span>
          </div>
          {client.nom || client.prenom ? (
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">
                {`${client.prenom || ''} ${client.nom || ''}`.trim()}
              </p>
              {client.email     && <p className="text-sm text-slate-500">{client.email}</p>}
              {client.telephone && <p className="text-sm text-slate-500">{client.telephone}</p>}
              {client.adresse   && <p className="text-sm text-slate-500">{client.adresse}</p>}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Client non renseigné</p>
          )}
        </div>

        {/* Prestations */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="px-4 py-3 bg-primary-600 text-white grid grid-cols-12 text-xs font-semibold">
            <span className="col-span-6">Prestation</span>
            <span className="col-span-2 text-center">Qté</span>
            <span className="col-span-2 text-right">PU HT</span>
            <span className="col-span-2 text-right">Total HT</span>
          </div>
          {prestations.map((p, i) => (
            <div
              key={i}
              className={`px-4 py-3 grid grid-cols-12 text-sm border-t border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/50' : ''}`}
            >
              <span className="col-span-6 text-slate-800 pr-2">{p.description}</span>
              <span className="col-span-2 text-center text-slate-500">{p.quantite}</span>
              <span className="col-span-2 text-right text-slate-500">{formatEur(p.prix_unitaire)}</span>
              <span className="col-span-2 text-right font-medium text-slate-900">
                {formatEur((p.quantite || 0) * (p.prix_unitaire || 0))}
              </span>
            </div>
          ))}
        </div>

        {/* Totaux */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 space-y-2">
          <InfoRow label="Total HT" value={formatEur(ht)} />
          {isFranchise
            ? <p className="text-xs text-amber-700 italic py-1">TVA non applicable — franchise en base (art. 293 B CGI)</p>
            : <InfoRow label={`TVA (${tva}%)`} value={formatEur(montantTVA)} />
          }
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="text-base font-bold text-slate-900">Total {isFranchise ? 'HT' : 'TTC'}</span>
            <span className="text-xl font-extrabold text-primary-600">{formatEur(ttc)}</span>
          </div>
          {acomptePct > 0 && (
            <>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-sm text-slate-500">Acompte versé ({acomptePct}%)</span>
                <span className="text-sm font-medium text-orange-600">−{formatEur(acompteTTC)}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-base font-bold text-slate-900">Net à payer</span>
                <span className="text-xl font-extrabold text-emerald-600">{formatEur(netAPayer)}</span>
              </div>
            </>
          )}
        </div>

        {/* Dates */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={14} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Dates</span>
          </div>
          <div className="space-y-0">
            <InfoRow label="Émise le"      value={formatDate(facture.date_creation)} />
            <InfoRow label="Échéance"       value={formatDate(facture.date_echeance)} />
            <InfoRow label="Payée le"       value={formatDate(facture.date_paiement)} />
            {facture.mode_paiement && (
              <InfoRow
                label="Mode de règlement"
                value={{ virement: 'Virement bancaire', cheque: 'Chèque', especes: 'Espèces', carte: 'Carte', stripe: 'Paiement en ligne' }[facture.mode_paiement] || facture.mode_paiement}
              />
            )}
          </div>
        </div>

        {/* Notes */}
        {facture.notes && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <StickyNote size={14} className="text-amber-600" />
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Notes</span>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{facture.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Actions</p>

          {facture.statut === 'émise' && !markingPaid && (
            <button
              onClick={() => setMarkingPaid(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 text-green-700 font-semibold text-sm hover:bg-green-100 transition"
            >
              <CheckCircle size={16} /> Marquer comme payée
            </button>
          )}

          {/* Sélecteur de mode de règlement */}
          {markingPaid && (
            <div className="border border-slate-200 rounded-xl p-3 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mode de règlement</p>
              <div className="flex flex-wrap gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setModeReglement(m.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      modeReglement === m.value
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-green-400'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleMarquerPayee}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl transition"
                >
                  Confirmer le paiement
                </button>
                <button
                  onClick={() => setMarkingPaid(false)}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {canRelancer && (
            <button
              onClick={handleRelancer}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition ${
                confirmRelance
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <RefreshCw size={16} />
              {confirmRelance
                ? 'Confirmer la relance ?'
                : `Relancer le client — ${palierLabel}`}
            </button>
          )}

          {facture.statut === 'émise' && (
            <button
              onClick={handleLienPaiement}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-50 text-violet-700 font-semibold text-sm hover:bg-violet-100 transition"
            >
              <CreditCard size={16} /> Générer un lien de paiement
            </button>
          )}

          <button
            onClick={() => downloadPdf(`/pdf/facture/${id}`, `${facture.numero || 'facture'}.pdf`)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition"
          >
            <Download size={16} /> Télécharger le PDF
          </button>

          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition"
          >
            <Trash2 size={16} />
            {facture.statut === 'brouillon' ? 'Supprimer' : 'Archiver'}
          </button>
        </div>

      </div>
    </Layout>
  )
}
