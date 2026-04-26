import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { downloadPdf } from '../lib/downloadPdf'
import { toastApiError } from '../lib/toastApiError'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import { SkeletonBlock, SkeletonLine } from '../components/Skeleton'
import useProfil from '../lib/useProfil'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Pencil, Download, Copy, Send, FileCheck, Trash2,
  Bookmark, User, CalendarDays, StickyNote, Zap, Clock, AlertTriangle, RefreshCw,
} from 'lucide-react'

const formatEur  = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)
const formatDate = (s) => s ? new Date(s).toLocaleDateString('fr-FR') : '—'

const urgenceConfig = {
  urgent:    { label: 'Urgent',    icon: Zap,           className: 'bg-red-100 text-red-700' },
  important: { label: 'Important', icon: AlertTriangle, className: 'bg-amber-100 text-amber-700' },
}
const chargeConfig = {
  rapide: { label: 'Rapide', className: 'bg-emerald-50 text-emerald-600' },
  moyen:  { label: 'Moyen',  className: 'bg-sky-50 text-sky-600' },
  long:   { label: 'Long',   className: 'bg-purple-50 text-purple-600' },
}

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-800 text-right">{value}</span>
    </div>
  )
}

export default function DevisDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isComplete: profilComplet, missing: profilMissing, isFranchise } = useProfil()

  const [devis, setDevis]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const [confirmEnvoi, setConfirmEnvoi]     = useState(false)
  const [confirmRelance, setConfirmRelance] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/devis/${id}`)
        setDevis(data)
      } catch (err) {
        toastApiError(err, 'Devis introuvable')
        navigate('/devis')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const reload = async () => {
    const { data } = await api.get(`/devis/${id}`)
    setDevis(data)
  }

  const handleEnvoyer = async () => {
    if (!profilComplet) { toast.error(`Profil incomplet : ${profilMissing.join(', ')}`); return }
    if (!confirmEnvoi) {
      setConfirmEnvoi(true)
      setTimeout(() => setConfirmEnvoi(false), 4000)
      return
    }
    setConfirmEnvoi(false)
    try {
      await api.post(`/devis/${id}/envoyer`)
      toast.success('Devis envoyé par email !')
      reload()
    } catch (err) {
      toastApiError(err, "Erreur lors de l'envoi")
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
      await api.post(`/devis/${id}/relancer`)
      toast.success('Relance envoyée par email !')
      reload()
    } catch (err) {
      toastApiError(err, 'Erreur lors de la relance')
    }
  }

  const handleDupliquer = async () => {
    try {
      await api.post(`/devis/${id}/dupliquer`)
      toast.success('Devis dupliqué — brouillon créé')
      navigate('/devis')
    } catch (err) {
      toastApiError(err, 'Erreur lors de la duplication')
    }
  }

  const handleModele = async () => {
    if (!devis) return
    try {
      await api.post('/modeles', {
        titre: devis.titre, prestations: devis.prestations, tva: devis.tva,
        acompte_pct: devis.acompte_pct || 0, notes: devis.notes || null,
        urgence: devis.urgence || 'normal', charge: devis.charge || null,
      })
      toast.success('Modèle enregistré')
    } catch (err) {
      toastApiError(err, "Erreur lors de l'enregistrement du modèle")
    }
  }

  const handleConvertir = async () => {
    if (!profilComplet) { toast.error(`Profil incomplet : ${profilMissing.join(', ')}`); return }
    if (!window.confirm('Convertir ce devis en facture ?')) return
    try {
      await api.post(`/factures/depuis-devis/${id}`)
      toast.success('Facture créée avec succès')
      navigate('/factures')
    } catch (err) {
      toastApiError(err, 'Erreur lors de la conversion')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Supprimer ce devis ?')) return
    try {
      await api.delete(`/devis/${id}`)
      toast.success('Devis supprimé')
      navigate('/devis')
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

  if (!devis) return null

  const client     = devis.clients || {}
  const prestations = devis.prestations || []
  const ht          = devis.montant_ht   || 0
  const ttc         = devis.montant_ttc  || 0
  const tva         = devis.tva          || 0
  const acomptePct  = devis.acompte_pct  || 0
  const montantTVA  = ttc - ht
  const acompteTTC  = acomptePct > 0 ? ttc * acomptePct / 100 : 0
  const soldeTTC    = acomptePct > 0 ? ttc - acompteTTC : 0

  const urgCfg    = urgenceConfig[devis.urgence]
  const chargeCfg = chargeConfig[devis.charge]

  const canEnvoyer   = devis.statut === 'brouillon' && !!client.email
  const canRelancer  = ['envoyé', 'consulté', 'relancé'].includes(devis.statut) && !!client.email
  const canConvertir = ['envoyé', 'consulté', 'accepté', 'relancé'].includes(devis.statut)

  return (
    <Layout>
      <div className="max-w-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate('/devis')}
            className="p-2 rounded-xl hover:bg-white transition text-slate-500 shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm text-slate-400">{devis.numero}</span>
              <StatusBadge statut={devis.statut} />
              {urgCfg && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${urgCfg.className}`}>
                  <urgCfg.icon size={11} /> {urgCfg.label}
                </span>
              )}
              {chargeCfg && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${chargeCfg.className}`}>
                  <Clock size={11} /> {chargeCfg.label}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight truncate mt-0.5">
              {devis.titre || '—'}
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
              <InfoRow label={`Acompte à la commande (${acomptePct}%)`} value={formatEur(acompteTTC)} />
              <InfoRow label="Solde restant" value={formatEur(soldeTTC)} />
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
            <InfoRow label="Créé le"     value={formatDate(devis.date_creation)} />
            <InfoRow label="Envoyé le"   value={formatDate(devis.date_envoi)} />
            <InfoRow label="Relancé le"  value={formatDate(devis.date_relance)} />
            <InfoRow label="Valide jusqu'au" value={formatDate(devis.date_validite)} />
          </div>
        </div>

        {/* Notes */}
        {devis.notes && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <StickyNote size={14} className="text-amber-600" />
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Notes</span>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{devis.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Actions</p>

          {devis.statut === 'brouillon' && (
            <button
              onClick={() => navigate(`/devis/${id}/modifier`)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-50 text-primary-700 font-semibold text-sm hover:bg-primary-100 transition"
            >
              <Pencil size={16} /> Modifier le devis
            </button>
          )}

          {canEnvoyer && (
            <button
              onClick={handleEnvoyer}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition ${
                confirmEnvoi
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <Send size={16} /> {confirmEnvoi ? 'Confirmer l\'envoi ?' : 'Envoyer par email'}
            </button>
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
              {confirmRelance ? 'Confirmer la relance ?' : 'Relancer le client'}
            </button>
          )}

          {canConvertir && (
            <button
              onClick={handleConvertir}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 text-green-700 font-semibold text-sm hover:bg-green-100 transition"
            >
              <FileCheck size={16} /> Convertir en facture
            </button>
          )}

          <button
            onClick={() => downloadPdf(`/pdf/devis/${id}`, `${devis.numero || 'devis'}.pdf`)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition"
          >
            <Download size={16} /> Télécharger le PDF
          </button>

          <button
            onClick={handleDupliquer}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition"
          >
            <Copy size={16} /> Dupliquer
          </button>

          <button
            onClick={handleModele}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 text-amber-700 font-semibold text-sm hover:bg-amber-100 transition"
          >
            <Bookmark size={16} /> Sauvegarder comme modèle
          </button>

          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition"
          >
            <Trash2 size={16} /> Supprimer
          </button>
        </div>

      </div>
    </Layout>
  )
}
