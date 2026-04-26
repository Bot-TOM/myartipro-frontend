import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAuth from '../lib/useAuth'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import { SkeletonCardList } from '../components/Skeleton'
import { CheckCircle, Zap, AlertTriangle, Clock, FileText, Receipt, ChevronRight } from 'lucide-react'

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatEur = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)

function daysAgo(dateStr) {
  if (!dateStr) return 0
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}

/**
 * Niveau d'urgence selon le type de document et le nombre de jours écoulés.
 * Devis  : rouge ≥ 7j · orange ≥ 3j · vert < 3j
 * Facture: rouge ≥ 60j · orange ≥ 30j · vert < 30j
 */
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
  rouge:  { dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700',       icon: Zap,           label: 'Urgent' },
  orange: { dot: 'bg-orange-400', badge: 'bg-orange-100 text-orange-700', icon: AlertTriangle, label: 'À relancer' },
  vert:   { dot: 'bg-sky-400',    badge: 'bg-sky-50 text-sky-600',        icon: Clock,         label: 'En attente' },
}

const PALIER_LABELS = { 0: '1er rappel', 1: '2e rappel', 2: 'Mise en demeure' }

function clientName(c) {
  return c ? `${c.prenom || ''} ${c.nom || ''}`.trim() || '—' : '—'
}

// ─── Composant carte ────────────────────────────────────────────────────────

function SuiviCard({ item }) {
  const cfg = URGENCY_CFG[item.urgency]
  const Icon = cfg.icon

  return (
    <Link
      to={item.href}
      className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition active:scale-[0.99]"
    >
      {/* Pastille urgence */}
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />

      {/* Icône type */}
      <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${
        item.type === 'devis' ? 'bg-blue-50' : 'bg-emerald-50'
      }`}>
        {item.type === 'devis'
          ? <FileText size={16} className="text-blue-600" />
          : <Receipt   size={16} className="text-emerald-600" />
        }
      </div>

      {/* Texte */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[11px] text-slate-400">{item.numero}</span>
          <StatusBadge statut={item.statut} />
        </div>
        <p className="text-sm font-semibold text-slate-900 truncate mt-0.5">{item.titre || '—'}</p>
        <p className="text-xs text-slate-500 mt-0.5">{clientName(item.client)}</p>
        {item.type === 'facture' && item.relancesCount > 0 && (
          <p className="text-[11px] text-slate-400 mt-0.5">
            {item.relancesCount} relance{item.relancesCount > 1 ? 's' : ''} envoyée{item.relancesCount > 1 ? 's' : ''}
          </p>
        )}
        {item.type === 'facture' && PALIER_LABELS[item.relancesCount] && (
          <p className="text-[11px] text-indigo-600 font-medium mt-0.5">
            Prochain : {PALIER_LABELS[item.relancesCount]}
          </p>
        )}
      </div>

      {/* Droite */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-bold text-slate-900">{formatEur(item.montant)}</p>
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${cfg.badge}`}>
          <Icon size={10} /> J+{item.days}
        </span>
      </div>

      <ChevronRight size={15} className="text-slate-300 flex-shrink-0" />
    </Link>
  )
}

// ─── Page principale ─────────────────────────────────────────────────────────

export default function Suivi() {
  const { user }   = useAuth()
  const location   = useLocation()
  const [loading, setLoading] = useState(true)
  const [items, setItems]     = useState([])

  useEffect(() => {
    if (user) load()
  }, [user, location.key])

  const load = async () => {
    setLoading(true)
    const [devisRes, facturesRes] = await Promise.all([
      supabase
        .from('devis')
        .select('id, numero, titre, statut, montant_ttc, date_envoi, date_creation, clients(nom, prenom)')
        .eq('user_id', user.id)
        .in('statut', ['envoyé', 'consulté', 'relancé'])
        .order('date_envoi', { ascending: true }),
      supabase
        .from('factures')
        .select('id, numero, titre, statut, montant_ttc, date_creation, relances_count, clients(nom, prenom)')
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
        montant: d.montant_ttc, client: d.clients, days,
        urgency: getUrgency(days, 'devis'),
        href: `/devis/${d.id}`,
      }
    })

    const factureItems = (facturesRes.data || []).map((f) => {
      const days = daysAgo(f.date_creation)
      return {
        id: f.id, type: 'facture',
        numero: f.numero, titre: f.titre, statut: f.statut,
        montant: f.montant_ttc, client: f.clients, days,
        relancesCount: f.relances_count || 0,
        urgency: getUrgency(days, 'facture'),
        href: `/factures/${f.id}`,
      }
    })

    const sorted = [...devisItems, ...factureItems].sort((a, b) => {
      const diff = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]
      return diff !== 0 ? diff : b.days - a.days
    })

    setItems(sorted)
    setLoading(false)
  }

  const rougeCount  = items.filter((i) => i.urgency === 'rouge').length
  const orangeCount = items.filter((i) => i.urgency === 'orange').length
  const vertCount   = items.filter((i) => i.urgency === 'vert').length

  // Grouper par tier pour afficher des séparateurs
  const grouped = [
    { key: 'rouge',  label: 'Urgent',     list: items.filter((i) => i.urgency === 'rouge') },
    { key: 'orange', label: 'À relancer', list: items.filter((i) => i.urgency === 'orange') },
    { key: 'vert',   label: 'En attente', list: items.filter((i) => i.urgency === 'vert') },
  ].filter((g) => g.list.length > 0)

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Suivi clients</h1>
        {items.length > 0 ? (
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
        ) : (
          !loading && (
            <p className="text-sm text-slate-500 mt-0.5">Aucun suivi en cours</p>
          )
        )}
      </div>

      {loading ? (
        <SkeletonCardList count={5} />
      ) : items.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-10 flex flex-col items-center gap-3 text-center">
          <CheckCircle size={36} className="text-green-500" />
          <p className="font-semibold text-green-800 text-lg">Tout est à jour ✓</p>
          <p className="text-sm text-green-600 max-w-xs">
            Aucun devis ni facture ne nécessite de relance pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.key}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.8px] mb-2.5 ${
                group.key === 'rouge'  ? 'text-red-500' :
                group.key === 'orange' ? 'text-orange-500' :
                'text-sky-500'
              }`}>
                {group.label} · {group.list.length}
              </p>
              <div className="space-y-2.5">
                {group.list.map((item) => (
                  <SuiviCard key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
