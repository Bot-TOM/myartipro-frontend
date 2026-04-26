import { useEffect, useState, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import api from '../lib/api'
import { toastApiError } from '../lib/toastApiError'
import useAuth from '../lib/useAuth'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import { SkeletonCardList } from '../components/Skeleton'
import toast from 'react-hot-toast'
import {
  CheckCircle, Zap, AlertTriangle, Clock,
  FileText, Receipt, ChevronRight, RefreshCw, Loader2,
} from 'lucide-react'

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatEur = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)

function daysAgo(dateStr) {
  if (!dateStr) return 0
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}

function getUrgency(days, type) {
  if (type === 'devis') {
    if (days >= 7) return 'rouge'
    if (days >= 3) return 'orange'
    return 'vert'
  }
  if (days >= 60) return 'rouge'
  if (days >= 30) return 'orange'
  return 'vert'
}

const URGENCY_ORDER = { rouge: 0, orange: 1, vert: 2 }

const URGENCY_CFG = {
  rouge:  { dot: 'bg-red-500',    badgeBg: 'bg-red-100 text-red-700',       icon: Zap,           sectionColor: 'text-red-500' },
  orange: { dot: 'bg-orange-400', badgeBg: 'bg-orange-100 text-orange-700', icon: AlertTriangle, sectionColor: 'text-orange-500' },
  vert:   { dot: 'bg-sky-400',    badgeBg: 'bg-sky-50 text-sky-600',        icon: Clock,         sectionColor: 'text-sky-500' },
}

const PALIER_LABELS = { 0: '1er rappel', 1: '2e rappel', 2: 'Mise en demeure' }

function clientName(c) {
  return c ? `${c.prenom || ''} ${c.nom || ''}`.trim() || '—' : '—'
}

function delayLabel(days, type) {
  if (type === 'devis') return `${days}j sans réponse`
  return `${days}j impayée`
}

// ─── Carte item ─────────────────────────────────────────────────────────────

function SuiviCard({ item, onRelanced }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading]       = useState(false)
  const cfg = URGENCY_CFG[item.urgency]
  const canRelancer = item.urgency !== 'vert' && item.hasEmail

  const handleRelancer = async (e) => {
    e.preventDefault()
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 4000)
      return
    }
    setConfirming(false)
    setLoading(true)
    try {
      if (item.type === 'devis') {
        await api.post(`/devis/${item.id}/relancer`)
        toast.success('Relance envoyée')
      } else {
        const { data } = await api.post(`/factures/${item.id}/relancer`)
        toast.success(`Relance envoyée (palier ${data.palier}/3)`)
      }
      onRelanced()
    } catch (err) {
      toastApiError(err, 'Erreur lors de la relance')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 ${
      item.urgency === 'rouge' ? 'border-l-red-400' :
      item.urgency === 'orange' ? 'border-l-orange-400' :
      'border-l-sky-300'
    }`}>
      <Link to={item.href} className="flex items-center gap-3 p-4">
        {/* Icône type */}
        <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${
          item.type === 'devis' ? 'bg-blue-50' : 'bg-emerald-50'
        }`}>
          {item.type === 'devis'
            ? <FileText size={16} className="text-blue-600" />
            : <Receipt   size={16} className="text-emerald-600" />
          }
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[11px] text-slate-400">{item.numero}</span>
            <StatusBadge statut={item.statut} />
          </div>
          <p className="text-sm font-semibold text-slate-900 truncate mt-0.5">{item.titre || '—'}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-xs text-slate-500">{clientName(item.client)}</p>
            {item.type === 'facture' && PALIER_LABELS[item.relancesCount] && (
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                {PALIER_LABELS[item.relancesCount]}
              </span>
            )}
          </div>
        </div>

        {/* Droite */}
        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-bold text-slate-900">{formatEur(item.montant)}</p>
          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${cfg.badgeBg}`}>
            {delayLabel(item.days, item.type)}
          </span>
        </div>

        <ChevronRight size={15} className="text-slate-300 flex-shrink-0" />
      </Link>

      {/* Bouton relance inline — visible seulement sur rouge/orange avec email */}
      {canRelancer && (
        <div className="px-4 pb-3">
          <button
            onClick={handleRelancer}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition ${
              loading
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : confirming
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
            }`}
          >
            {loading
              ? <><Loader2 size={12} className="animate-spin" /> Envoi…</>
              : confirming
              ? <><RefreshCw size={12} /> Confirmer la relance ?</>
              : <><RefreshCw size={12} /> Relancer</>
            }
          </button>
        </div>
      )}

      {/* Message si pas d'email */}
      {item.urgency !== 'vert' && !item.hasEmail && (
        <p className="px-4 pb-3 text-[11px] text-slate-400 italic">
          Aucun email client — relance manuelle requise
        </p>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Suivi() {
  const { user }   = useAuth()
  const location   = useLocation()
  const [loading, setLoading] = useState(true)
  const [items, setItems]     = useState([])

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const [devisRes, facturesRes] = await Promise.all([
      supabase
        .from('devis')
        .select('id, numero, titre, statut, montant_ttc, date_envoi, date_creation, clients(nom, prenom, email)')
        .eq('user_id', user.id)
        .in('statut', ['envoyé', 'consulté', 'relancé'])
        .order('date_envoi', { ascending: true }),
      supabase
        .from('factures')
        .select('id, numero, titre, statut, montant_ttc, date_creation, relances_count, clients(nom, prenom, email)')
        .eq('user_id', user.id)
        .eq('statut', 'émise')
        .is('deleted_at', null)
        .order('date_creation', { ascending: true }),
    ])

    const devisItems = (devisRes.data || []).map((d) => {
      const days = daysAgo(d.date_envoi || d.date_creation)
      return {
        id: d.id, type: 'devis',
        numero: d.numero, titre: d.titre, statut: d.statut,
        montant: d.montant_ttc, client: d.clients,
        hasEmail: !!d.clients?.email,
        days, urgency: getUrgency(days, 'devis'),
        href: `/devis/${d.id}`,
      }
    })

    const factureItems = (facturesRes.data || []).map((f) => {
      const days = daysAgo(f.date_creation)
      return {
        id: f.id, type: 'facture',
        numero: f.numero, titre: f.titre, statut: f.statut,
        montant: f.montant_ttc, client: f.clients,
        hasEmail: !!f.clients?.email,
        relancesCount: f.relances_count || 0,
        days, urgency: getUrgency(days, 'facture'),
        href: `/factures/${f.id}`,
      }
    })

    const sorted = [...devisItems, ...factureItems].sort((a, b) => {
      const diff = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]
      return diff !== 0 ? diff : b.days - a.days
    })

    setItems(sorted)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load, location.key])

  const rougeCount  = items.filter((i) => i.urgency === 'rouge').length
  const orangeCount = items.filter((i) => i.urgency === 'orange').length
  const vertCount   = items.filter((i) => i.urgency === 'vert').length

  const grouped = [
    { key: 'rouge',  label: 'Urgent',     list: items.filter((i) => i.urgency === 'rouge') },
    { key: 'orange', label: 'À relancer', list: items.filter((i) => i.urgency === 'orange') },
    { key: 'vert',   label: 'En attente', list: items.filter((i) => i.urgency === 'vert') },
  ].filter((g) => g.list.length > 0)

  return (
    <Layout>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">Suivi clients</h1>
        {!loading && items.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {rougeCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                <Zap size={11} /> {rougeCount} urgent{rougeCount > 1 ? 's' : ''}
              </span>
            )}
            {orangeCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full">
                <AlertTriangle size={11} /> {orangeCount} à relancer
              </span>
            )}
            {vertCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-sky-50 text-sky-600 px-2.5 py-1 rounded-full">
                <Clock size={11} /> {vertCount} en attente
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <SkeletonCardList count={5} />
      ) : items.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-12 flex flex-col items-center gap-3 text-center">
          <CheckCircle size={40} className="text-green-500" />
          <p className="font-bold text-green-800 text-lg">Tout est à jour ✓</p>
          <p className="text-sm text-green-600 max-w-xs">
            Aucun devis ni facture ne nécessite de relance pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => {
            const cfg = URGENCY_CFG[group.key]
            return (
              <div key={group.key}>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.8px] mb-2.5 ${cfg.sectionColor}`}>
                  {group.label} · {group.list.length}
                </p>
                <div className="space-y-3">
                  {group.list.map((item) => (
                    <SuiviCard
                      key={`${item.type}-${item.id}`}
                      item={item}
                      onRelanced={load}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
