import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAuth from '../lib/useAuth'
import Layout from '../components/Layout'
import { FileText, Users, Plus, Receipt, AlertCircle, TrendingUp, Bell, Zap, Clock, ArrowRight, CheckCircle } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [actions, setActions] = useState([])
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
      const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [devisRes, clientsRes, facturesRes, rappelsRes, devisUrgentsRes] = await Promise.all([
        supabase.from('devis').select('statut, montant_ttc').eq('user_id', user.id),
        supabase.from('clients').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('factures').select('statut, montant_ttc, date_paiement').eq('user_id', user.id),
        supabase.from('rappels').select('*, clients(nom, prenom)').eq('user_id', user.id).eq('fait', false).lte('date_rappel', today).order('date_rappel'),
        supabase.from('devis').select('numero, titre, statut, date_envoi, urgence, clients(nom, prenom)').eq('user_id', user.id).in('statut', ['envoyé', 'relancé']),
      ])

      // Actions à faire
      const actionsList = []

      ;(rappelsRes.data || []).forEach((r) => {
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

      ;(devisUrgentsRes.data || [])
        .filter((d) => {
          if (d.urgence === 'urgent') return true
          if (d.date_envoi) {
            const jours = Math.floor((Date.now() - new Date(d.date_envoi).getTime()) / 86400000)
            return jours >= 3
          }
          return false
        })
        .forEach((d) => {
          actionsList.push({
            type: 'devis',
            icon: Zap,
            label: `${d.numero} — ${d.titre}`,
            sub: d.clients ? `${d.clients.prenom || ''} ${d.clients.nom}`.trim() : null,
            urgent: true,
            badge: 'À relancer',
            badgeClass: 'bg-orange-100 text-orange-600',
            link: '/devis',
          })
        })

      actionsList.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0))
      setActions(actionsList)

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
        devisTotal: (devisRes.data || []).length,
        facturesTotal: facturesList.length,
      })

      setLoading(false)
      } catch {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const formatEur = (n) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0)

  const moisLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  if (loading) {
    return <Layout><p className="text-gray-400">Chargement...</p></Layout>
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 mt-0.5 capitalize text-sm">{moisLabel}</p>
        </div>
        <Link
          to="/devis/nouveau"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nouveau devis</span>
          <span className="sm:hidden">Devis</span>
        </Link>
      </div>

      {/* Actions à faire */}
      {actions.length > 0 ? (
        <div className="bg-white rounded-xl border mb-5">
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={15} className="text-primary-600" />
              À faire
              <span className="bg-primary-100 text-primary-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {actions.length}
              </span>
            </h2>
            <Link to="/rappels" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y">
            {actions.slice(0, 5).map((action, i) => {
              const Icon = action.icon
              return (
                <Link
                  key={i}
                  to={action.link}
                  className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition"
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${action.urgent ? 'bg-red-50 text-red-500' : 'bg-primary-50 text-primary-600'}`}>
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{action.label}</p>
                    {action.sub && <p className="text-xs text-gray-400">{action.sub}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${action.badgeClass}`}>
                    {action.badge}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-5 flex items-center gap-3">
          <CheckCircle size={18} className="text-green-600 shrink-0" />
          <p className="text-sm text-green-700 font-medium">Rien à faire pour le moment — tout est à jour ✓</p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <Link to="/factures" className="bg-white rounded-xl border p-4 hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">CA du mois</p>
            <div className="p-2 rounded-lg bg-green-50">
              <TrendingUp size={16} className="text-green-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatEur(stats.caMois)}</p>
        </Link>

        <Link to="/factures" className="bg-white rounded-xl border p-4 hover:shadow-sm transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Impayées</p>
            <div className={`p-2 rounded-lg ${stats.montantImpaye > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
              <AlertCircle size={16} className={stats.montantImpaye > 0 ? 'text-orange-500' : 'text-gray-400'} />
            </div>
          </div>
          <p className={`text-xl font-bold ${stats.montantImpaye > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
            {formatEur(stats.montantImpaye)}
          </p>
          {stats.facturesImpayees > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{stats.facturesImpayees} facture{stats.facturesImpayees > 1 ? 's' : ''}</p>
          )}
        </Link>
      </div>

      {/* Compteurs */}
      <div className="grid grid-cols-3 gap-3">
        <Link to="/devis" className="bg-white rounded-xl border p-4 text-center hover:shadow-sm transition">
          <div className="p-2 rounded-lg bg-blue-50 inline-block mb-2">
            <FileText size={17} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.devisTotal}</p>
          <p className="text-xs text-gray-500 mt-0.5">Devis</p>
        </Link>
        <Link to="/factures" className="bg-white rounded-xl border p-4 text-center hover:shadow-sm transition">
          <div className="p-2 rounded-lg bg-emerald-50 inline-block mb-2">
            <Receipt size={17} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.facturesTotal}</p>
          <p className="text-xs text-gray-500 mt-0.5">Factures</p>
        </Link>
        <Link to="/clients" className="bg-white rounded-xl border p-4 text-center hover:shadow-sm transition">
          <div className="p-2 rounded-lg bg-purple-50 inline-block mb-2">
            <Users size={17} className="text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.clients}</p>
          <p className="text-xs text-gray-500 mt-0.5">Clients</p>
        </Link>
      </div>
    </Layout>
  )
}
