import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAuth from '../lib/useAuth'
import useProfil from '../lib/useProfil'
import Layout from '../components/Layout'
import OnboardingChecklist from '../components/OnboardingChecklist'
import PushNotificationBanner from '../components/PushNotificationBanner'
import StatusBadge from '../components/StatusBadge'
import { SkeletonStat, SkeletonLine, SkeletonBlock } from '../components/Skeleton'
import {
  FileText, Bell, Receipt, Zap, TrendingUp, AlertCircle, CheckCircle,
} from 'lucide-react'

const AVATAR_COLORS = ['#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6']

const getInitials = (client) =>
  client ? `${client.prenom?.[0] || ''}${client.nom?.[0] || ''}`.toUpperCase() : '?'

const getClientName = (client) =>
  client ? `${client.prenom || ''} ${client.nom}`.trim() : '-'

const formatEur = (n) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)

export default function Dashboard() {
  const { user } = useAuth()
  const { profil, isComplete: isProfilComplete } = useProfil()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [actions, setActions] = useState([])
  const [devisList, setDevisList] = useState([])
  const [devisRecents, setDevisRecents] = useState([])
  const [stats, setStats] = useState({
    caMois: 0,
    montantImpaye: 0,
    facturesImpayees: 0,
    clients: 0,
    devisTotal: 0,
    facturesTotal: 0,
  })

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10)
        const now = new Date()
        const mm = String(now.getMonth() + 1).padStart(2, '0')
        const debutMois = `${now.getFullYear()}-${mm}-01`

        const [devisRes, clientsRes, facturesRes, rappelsRes, devisUrgentsRes] = await Promise.all([
          supabase
            .from('devis')
            .select('id, statut, montant_ttc, titre, numero, clients(nom, prenom)')
            .eq('user_id', user.id)
            .order('id', { ascending: false }),
          supabase
            .from('clients')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          supabase
            .from('factures')
            .select('statut, montant_ttc, date_paiement')
            .eq('user_id', user.id),
          supabase
            .from('rappels')
            .select('*, clients(nom, prenom)')
            .eq('user_id', user.id)
            .eq('fait', false)
            .lte('date_rappel', today)
            .order('date_rappel'),
          supabase
            .from('devis')
            .select('numero, titre, statut, date_envoi, urgence, clients(nom, prenom)')
            .eq('user_id', user.id)
            .in('statut', ['envoyé', 'relancé']),
        ])

        // Actions urgentes
        const actionsList = []
        ;(rappelsRes.data || []).forEach((r) => {
          const isRetard = r.date_rappel < today
          actionsList.push({
            type: 'rappel',
            label: r.commentaire,
            sub: r.clients ? `${r.clients.prenom || ''} ${r.clients.nom}`.trim() : null,
            urgent: isRetard,
            badge: isRetard ? 'Retard' : "Aujourd'hui",
            link: '/rappels',
          })
        })
        ;(devisUrgentsRes.data || [])
          .filter((d) => {
            if (d.urgence === 'urgent') return true
            if (d.date_envoi) {
              return Math.floor((Date.now() - new Date(d.date_envoi).getTime()) / 86400000) >= 3
            }
            return false
          })
          .forEach((d) => {
            actionsList.push({
              type: 'devis',
              label: `${d.numero} — ${d.titre}`,
              sub: d.clients ? `${d.clients.prenom || ''} ${d.clients.nom}`.trim() : null,
              urgent: true,
              badge: 'À relancer',
              link: '/devis',
            })
          })
        actionsList.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0))
        setActions(actionsList)

        // Devis récents
        const allDevis = devisRes.data || []
        setDevisList(allDevis)
        setDevisRecents(allDevis.slice(0, 3))

        // Stats
        const facturesList = facturesRes.data || []
        const facturesPayees = facturesList.filter((f) => f.statut === 'payée')
        const facturesImpayees = facturesList.filter((f) => f.statut !== 'payée')

        setStats({
          caMois: facturesPayees
            .filter((f) => f.date_paiement && f.date_paiement >= debutMois)
            .reduce((sum, f) => sum + (f.montant_ttc || 0), 0),
          montantImpaye: facturesImpayees.reduce((sum, f) => sum + (f.montant_ttc || 0), 0),
          facturesImpayees: facturesImpayees.length,
          clients: clientsRes.count || 0,
          devisTotal: allDevis.length,
          facturesTotal: facturesList.length,
        })

        setLoading(false)
      } catch {
        setLoading(false)
      }
    }
    load()
  }, [user, location.key])

  const moisLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const jourLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const urgentCount = actions.filter((a) => a.urgent).length

  if (loading) {
    return (
      <Layout>
        <div className="space-y-4 pt-2">
          <SkeletonLine className="w-48 h-6" />
          <SkeletonBlock className="w-full h-32 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <SkeletonStat />
            <SkeletonStat />
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {/* Header mobile */}
      <div className="flex items-center justify-between px-1 pt-2 pb-5 md:hidden">
        <div>
          <p className="text-xs text-slate-500 capitalize">{jourLabel}</p>
          <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight leading-tight">
            Bonjour{profil?.prenom ? `, ${profil.prenom}` : ''} 👋
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/rappels')}
            className="relative w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500"
          >
            <Bell size={18} />
            {urgentCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>
          <button
            onClick={() => navigate('/profil')}
            className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center hover:bg-primary-700 transition"
            title="Mon profil"
          >
            <span className="text-white text-sm font-bold select-none">
              {profil?.prenom?.[0] || profil?.nom?.[0]
                ? `${(profil.prenom?.[0] ?? '').toUpperCase()}${(profil.nom?.[0] ?? '').toUpperCase()}`
                : (user?.email?.[0] ?? '?').toUpperCase()}
            </span>
          </button>
        </div>
      </div>

      {/* Header desktop */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-slate-500 mt-0.5 capitalize text-sm">{moisLabel}</p>
        </div>
        <Link
          to="/devis/nouveau"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
        >
          <FileText size={16} />
          Nouveau devis
        </Link>
      </div>

      {/* Push notifications opt-in */}
      <PushNotificationBanner />

      {/* Onboarding */}
      <OnboardingChecklist
        profil={profil}
        isProfilComplete={isProfilComplete}
        clientsCount={stats.clients}
        devis={devisList}
      />

      {/* Carte urgences */}
      {actions.length > 0 ? (
        <div
          className="mx-0 mb-5 rounded-[20px] p-5"
          style={{ background: 'linear-gradient(135deg, #1B4ED8 0%, #2563EB 100%)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <span className="text-[13px] font-semibold text-white/90">À faire maintenant</span>
            </div>
            <Link
              to="/suivi"
              className="bg-white/20 rounded-xl px-2.5 py-0.5 text-xs font-bold text-white hover:bg-white/30 transition"
            >
              {actions.length} · Voir tout →
            </Link>
          </div>

          {actions.slice(0, 4).map((action, i) => (
            <Link
              key={i}
              to={action.link}
              className="flex items-center gap-2.5 py-2.5 border-t border-white/15"
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${action.urgent ? 'bg-red-300' : 'bg-white/55'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white truncate">{action.label}</p>
                {action.sub && <p className="text-[11px] text-white/70 mt-0.5">{action.sub}</p>}
              </div>
              {action.urgent && (
                <span className="text-[10px] font-bold bg-red-500/35 text-red-200 px-2 py-0.5 rounded flex-shrink-0">
                  {action.badge}
                </span>
              )}
            </Link>
          ))}

          <Link
            to="/suivi"
            className="flex items-center justify-center gap-1.5 pt-3 border-t border-white/15 text-[12px] font-semibold text-white/80 hover:text-white transition"
          >
            Voir le suivi complet →
          </Link>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-5 flex items-center gap-3">
          <CheckCircle size={18} className="text-green-600 shrink-0" />
          <p className="text-sm text-green-700 font-medium">Tout est à jour — rien à faire pour le moment ✓</p>
        </div>
      )}

      {/* Actions rapides — mobile */}
      <div className="mb-5 md:hidden">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.8px] mb-2.5">Action rapide</p>
        <div className="flex gap-2.5">
          {[
            { label: 'Nouveau devis', icon: FileText,  bg: 'bg-blue-50',   color: 'text-primary-600', to: '/devis/nouveau' },
            { label: 'Rappel',        icon: Bell,      bg: 'bg-orange-50', color: 'text-orange-600',  to: '/rappels' },
            { label: 'Facture',       icon: Receipt,   bg: 'bg-green-50',  color: 'text-green-600',   to: '/factures' },
          ].map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="flex-1 bg-white border border-slate-200 rounded-2xl py-3.5 px-2 flex flex-col items-center gap-2"
            >
              <div className={`w-11 h-11 rounded-full ${a.bg} flex items-center justify-center ${a.color}`}>
                <a.icon size={20} />
              </div>
              <span className="text-[11px] font-semibold text-slate-800 text-center leading-tight">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-5">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.8px] mb-2.5 md:hidden">
          Ce mois · {moisLabel}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/factures" className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500">CA encaissé</span>
              <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center">
                <TrendingUp size={14} className="text-green-600" />
              </div>
            </div>
            <p className="text-[20px] font-extrabold text-slate-900">{formatEur(stats.caMois)}</p>
          </Link>

          <Link to="/factures" className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-500">Impayé</span>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${stats.montantImpaye > 0 ? 'bg-orange-50' : 'bg-slate-100'}`}>
                <AlertCircle size={14} className={stats.montantImpaye > 0 ? 'text-orange-500' : 'text-slate-400'} />
              </div>
            </div>
            <p className={`text-[20px] font-extrabold ${stats.montantImpaye > 0 ? 'text-orange-600' : 'text-slate-900'}`}>
              {formatEur(stats.montantImpaye)}
            </p>
            {stats.facturesImpayees > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">{stats.facturesImpayees} facture{stats.facturesImpayees > 1 ? 's' : ''}</p>
            )}
          </Link>
        </div>
      </div>

      {/* Devis récents */}
      {devisRecents.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.8px]">Devis récents</p>
            <Link to="/devis" className="text-[12px] font-semibold text-primary-600">Voir tout →</Link>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            {devisRecents.map((d, i) => (
              <Link
                key={d.id}
                to="/devis"
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition ${i < devisRecents.length - 1 ? 'border-b border-slate-100' : ''}`}
              >
                <div
                  className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                >
                  {getInitials(d.clients)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{d.titre || d.numero}</p>
                  <p className="text-xs text-slate-500">{getClientName(d.clients)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-slate-900">{formatEur(d.montant_ttc)}</p>
                  <StatusBadge statut={d.statut} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}
