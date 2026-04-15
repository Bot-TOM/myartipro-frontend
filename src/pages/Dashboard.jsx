import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAuth from '../lib/useAuth'
import Layout from '../components/Layout'
import { FileText, Users, Plus, Receipt, TrendingUp, AlertCircle, CheckCircle, XCircle, Bell, Zap, Clock, ArrowRight } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [actions, setActions] = useState([])
  const [stats, setStats] = useState({
    devisTotal: 0,
    clients: 0,
    facturesTotal: 0,
    caMois: 0,
    caTotal: 0,
    facturesImpayees: 0,
    montantImpaye: 0,
    devisAcceptes: 0,
    devisRefuses: 0,
    devisEnvoyes: 0,
    devisBrouillon: 0,
    devisFactures: 0,
    tauxConversion: 0,
  })

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10)
      const [devisRes, clientsRes, facturesRes, rappelsRes, devisUrgentsRes] = await Promise.all([
        supabase.from('devis').select('statut, montant_ttc, date_creation').eq('user_id', user.id),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('factures').select('statut, montant_ttc, date_creation, date_paiement').eq('user_id', user.id),
        supabase.from('rappels').select('*, clients(nom, prenom)').eq('user_id', user.id).eq('fait', false).lte('date_rappel', today).order('date_rappel'),
        supabase.from('devis').select('numero, titre, statut, date_envoi, urgence, clients(nom, prenom)').eq('user_id', user.id).in('statut', ['envoyé', 'relancé']),
      ])

      // Construire les actions du jour
      const actionsList = []

      // Rappels du jour et en retard
      const rappelsData = rappelsRes.data || []
      rappelsData.forEach((r) => {
        const isRetard = r.date_rappel < today
        actionsList.push({
          type: 'rappel',
          icon: Bell,
          label: r.commentaire,
          sub: r.clients ? `${r.clients.prenom || ''} ${r.clients.nom}`.trim() : null,
          urgent: isRetard,
          badge: isRetard ? 'En retard' : "Aujourd'hui",
          badgeClass: isRetard ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-600',
          link: '/rappels',
        })
      })

      // Devis urgents (envoyés depuis +3 jours)
      const devisUrgents = (devisUrgentsRes.data || []).filter((d) => {
        if (d.urgence === 'urgent') return true
        if (d.date_envoi) {
          const jours = Math.floor((Date.now() - new Date(d.date_envoi).getTime()) / 86400000)
          return jours >= 3
        }
        return false
      })
      devisUrgents.forEach((d) => {
        actionsList.push({
          type: 'devis',
          icon: Zap,
          label: `${d.numero} — ${d.titre}`,
          sub: d.clients ? `${d.clients.prenom || ''} ${d.clients.nom}`.trim() : null,
          urgent: true,
          badge: 'Relance urgente',
          badgeClass: 'bg-red-100 text-red-600',
          link: '/devis',
        })
      })

      // Trier : urgents en premier
      actionsList.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0))
      setActions(actionsList)

      const devisList = devisRes.data || []
      const facturesList = facturesRes.data || []

      // Mois en cours
      const now = new Date()
      const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      // Stats devis par statut
      const devisBrouillon = devisList.filter(d => d.statut === 'brouillon').length
      const devisEnvoyes = devisList.filter(d => d.statut === 'envoyé' || d.statut === 'relancé').length
      const devisAcceptes = devisList.filter(d => d.statut === 'accepté' || d.statut === 'facturé').length
      const devisRefuses = devisList.filter(d => d.statut === 'refusé').length

      // Taux de conversion : acceptés / (acceptés + refusés) — exclut brouillons et en cours
      const devisTraites = devisAcceptes + devisRefuses
      const tauxConversion = devisTraites > 0 ? Math.round((devisAcceptes / devisTraites) * 100) : 0

      // Factures
      const facturesPayees = facturesList.filter(f => f.statut === 'payée')
      const facturesImpayees = facturesList.filter(f => f.statut !== 'payée')
      const montantImpaye = facturesImpayees.reduce((sum, f) => sum + (f.montant_ttc || 0), 0)

      // CA = factures payées
      const caTotal = facturesPayees.reduce((sum, f) => sum + (f.montant_ttc || 0), 0)
      const caMois = facturesPayees
        .filter(f => f.date_paiement && f.date_paiement >= debutMois)
        .reduce((sum, f) => sum + (f.montant_ttc || 0), 0)

      setStats({
        devisTotal: devisList.length,
        clients: clientsRes.count || 0,
        facturesTotal: facturesList.length,
        caMois,
        caTotal,
        facturesImpayees: facturesImpayees.length,
        montantImpaye,
        devisAcceptes,
        devisRefuses,
        devisEnvoyes,
        devisBrouillon,
        devisFactures: devisList.filter(d => d.statut === 'facturé').length,
        tauxConversion,
      })
      setLoading(false)
    }
    load()
  }, [user])

  const formatEur = (n) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)

  const moisLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <Layout>
        <p className="text-gray-400">Chargement...</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
      <p className="text-gray-500 mt-1 mb-6">Vue d'ensemble de votre activite</p>

      {/* Actions a faire aujourd'hui */}
      {actions.length > 0 && (
        <div className="bg-white rounded-xl border mb-6">
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={16} className="text-primary-600" />
              Actions a faire ({actions.length})
            </h2>
            <Link to="/rappels" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y max-h-64 overflow-y-auto">
            {actions.slice(0, 6).map((action, i) => {
              const Icon = action.icon
              return (
                <Link
                  key={i}
                  to={action.link}
                  className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition"
                >
                  <div className={`p-1.5 rounded-lg ${action.urgent ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-600'}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{action.label}</p>
                    {action.sub && <p className="text-xs text-gray-400">{action.sub}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${action.badgeClass}`}>
                    {action.badge}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* KPI principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">CA du mois</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{formatEur(stats.caMois)}</p>
              <p className="text-xs text-gray-400 mt-1 capitalize">{moisLabel}</p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg bg-green-50 text-green-600">
              <TrendingUp size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Taux de conversion</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{stats.tauxConversion}%</p>
              <p className="text-xs text-gray-400 mt-1">{stats.devisAcceptes} accepté{stats.devisAcceptes > 1 ? 's' : ''} / {stats.devisAcceptes + stats.devisRefuses} traité{stats.devisAcceptes + stats.devisRefuses > 1 ? 's' : ''}</p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg bg-blue-50 text-blue-600">
              <CheckCircle size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Factures impayées</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-600 mt-1">{formatEur(stats.montantImpaye)}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.facturesImpayees} facture{stats.facturesImpayees > 1 ? 's' : ''}</p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg bg-orange-50 text-orange-600">
              <AlertCircle size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">CA total</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{formatEur(stats.caTotal)}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.facturesTotal} facture{stats.facturesTotal > 1 ? 's' : ''}</p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg bg-emerald-50 text-emerald-600">
              <Receipt size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Devis pipeline + compteurs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Pipeline devis */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Pipeline devis</h2>
          <div className="space-y-3">
            <PipelineRow label="Brouillons" count={stats.devisBrouillon} total={stats.devisTotal} color="bg-gray-400" />
            <PipelineRow label="Envoyés / Relancés" count={stats.devisEnvoyes} total={stats.devisTotal} color="bg-blue-500" />
            <PipelineRow label="Acceptés / Facturés" count={stats.devisAcceptes} total={stats.devisTotal} color="bg-green-500" />
            <PipelineRow label="Refusés" count={stats.devisRefuses} total={stats.devisTotal} color="bg-red-400" />
          </div>
        </div>

        {/* Compteurs rapides */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Résumé</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 inline-block mb-2">
                <FileText size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.devisTotal}</p>
              <p className="text-xs text-gray-500">Devis</p>
            </div>
            <div className="text-center">
              <div className="p-2.5 rounded-lg bg-green-50 text-green-600 inline-block mb-2">
                <Receipt size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.facturesTotal}</p>
              <p className="text-xs text-gray-500">Factures</p>
            </div>
            <div className="text-center">
              <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600 inline-block mb-2">
                <Users size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.clients}</p>
              <p className="text-xs text-gray-500">Clients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/devis/nouveau"
          className="flex items-center gap-3 bg-primary-600 hover:bg-primary-700 text-white p-5 rounded-xl transition"
        >
          <Plus size={20} />
          <div>
            <p className="font-semibold">Nouveau devis</p>
            <p className="text-sm text-primary-200">Créer un devis rapidement</p>
          </div>
        </Link>
        <Link
          to="/factures"
          className="flex items-center gap-3 bg-white hover:bg-gray-50 border p-5 rounded-xl transition"
        >
          <Receipt size={20} className="text-gray-400" />
          <div>
            <p className="font-semibold text-gray-900">Mes factures</p>
            <p className="text-sm text-gray-500">Suivi des paiements</p>
          </div>
        </Link>
      </div>
    </Layout>
  )
}

function PipelineRow({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{count} <span className="text-gray-400 font-normal">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
