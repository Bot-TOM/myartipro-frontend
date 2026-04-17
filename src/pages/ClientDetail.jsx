import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAuth from '../lib/useAuth'
import Layout from '../components/Layout'
import StatusBadge from '../components/StatusBadge'
import toast from 'react-hot-toast'
import { ArrowLeft, Mail, Phone, MapPin, FileText, StickyNote, Receipt } from 'lucide-react'
import { getStatutConfig } from '../lib/constants'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [client, setClient] = useState(null)
  const [devis, setDevis] = useState([])
  const [factures, setFactures] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadClient()
  }, [user, id])

  const loadClient = async () => {
    setLoading(true)
    const [clientRes, devisRes, facturesRes] = await Promise.all([
      supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('devis')
        .select('id, numero, titre, montant_ttc, statut, date_creation')
        .eq('client_id', id)
        .eq('user_id', user.id)
        .order('date_creation', { ascending: false }),
      supabase
        .from('factures')
        .select('id, numero, titre, montant_ttc, statut, date_creation')
        .eq('client_id', id)
        .eq('user_id', user.id)
        .order('date_creation', { ascending: false }),
    ])

    if (!clientRes.data) {
      toast.error('Client introuvable')
      navigate('/clients')
      return
    }

    setClient(clientRes.data)
    setDevis(devisRes.data || [])
    setFactures(facturesRes.data || [])
    setLoading(false)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('fr-FR')
  }

  const formatEur = (montant) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant || 0)

  if (loading) {
    return <Layout><p className="text-gray-400">Chargement...</p></Layout>
  }

  if (!client) return null

  const cfg = getStatutConfig(client.statut)
  const totalDevis = devis.reduce((sum, d) => sum + (d.montant_ttc || 0), 0)
  const devisAcceptes = devis.filter((d) => d.statut === 'accepté' || d.statut === 'facturé')
  const totalFactures = factures.reduce((sum, f) => sum + (f.montant_ttc || 0), 0)
  const facturesPayees = factures.filter((f) => f.statut === 'payée')

  return (
    <Layout>
      <button
        onClick={() => navigate('/clients')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-6 transition"
      >
        <ArrowLeft size={16} />
        Retour
      </button>

      {/* En-tete client */}
      <div className="bg-white rounded-xl border p-5 sm:p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.prenom} {client.nom}</h1>
            <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.className}`}>
              {cfg.label}
            </span>
          </div>
          <a
            href={`tel:${client.telephone}`}
            className={`p-2 rounded-lg transition ${client.telephone ? 'text-green-500 hover:text-green-700 hover:bg-green-50' : 'text-gray-200 pointer-events-none'}`}
            title="Appeler"
          >
            <Phone size={18} />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
          {client.telephone && (
            <a href={`tel:${client.telephone}`} className="flex items-center gap-2 hover:text-primary-600 transition">
              <Phone size={16} className="text-gray-400" /> {client.telephone}
            </a>
          )}
          {client.email && (
            <a href={`mailto:${client.email}`} className="flex items-center gap-2 hover:text-primary-600 transition">
              <Mail size={16} className="text-gray-400" /> {client.email}
            </a>
          )}
          {client.adresse && (
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-gray-400" /> {client.adresse}
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-400">
            Client depuis le {formatDate(client.created_at)}
          </div>
        </div>

        {client.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 flex items-start gap-2">
            <StickyNote size={16} className="text-gray-400 mt-0.5 shrink-0" />
            <p>{client.notes}</p>
          </div>
        )}
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{devis.length}</p>
          <p className="text-sm text-gray-500">Devis</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{formatEur(totalDevis)}</p>
          <p className="text-sm text-gray-500">Total devis</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{factures.length}</p>
          <p className="text-sm text-gray-500">Factures</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{formatEur(totalFactures)}</p>
          <p className="text-sm text-gray-500">Facture</p>
        </div>
      </div>

      {/* Liste des devis du client */}
      <div className="bg-white rounded-xl border">
        <div className="px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText size={18} /> Devis
          </h2>
        </div>
        {devis.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>Aucun devis pour ce client</p>
            <button
              onClick={() => navigate('/devis/nouveau')}
              className="text-primary-600 hover:underline font-medium text-sm mt-2"
            >
              Creer un devis
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {devis.map((d) => (
              <div
                key={d.id}
                onClick={() => navigate(`/devis/${d.id}/modifier`)}
                className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{d.numero}</p>
                  <p className="text-xs text-gray-500">{d.titre} - {formatDate(d.date_creation)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">{formatEur(d.montant_ttc)}</span>
                  <StatusBadge statut={d.statut} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Liste des factures du client */}
      <div className="bg-white rounded-xl border mt-6">
        <div className="px-5 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Receipt size={18} /> Factures
          </h2>
        </div>
        {factures.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>Aucune facture pour ce client</p>
          </div>
        ) : (
          <div className="divide-y">
            {factures.map((f) => (
              <div
                key={f.id}
                onClick={() => navigate('/factures')}
                className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{f.numero}</p>
                  <p className="text-xs text-gray-500">{f.titre} - {formatDate(f.date_creation)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">{formatEur(f.montant_ttc)}</span>
                  <StatusBadge statut={f.statut} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
