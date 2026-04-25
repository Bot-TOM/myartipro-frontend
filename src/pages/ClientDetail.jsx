import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAuth from '../lib/useAuth'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import api from '../lib/api'
import { toastApiError } from '../lib/toastApiError'
import toast from 'react-hot-toast'
import { ArrowLeft, Mail, Phone, MapPin, FileText, StickyNote, Receipt, Pencil } from 'lucide-react'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [client, setClient] = useState(null)
  const [devis, setDevis] = useState([])
  const [factures, setFactures] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    loadClient()
  }, [user, id])

  const loadClient = async () => {
    setLoading(true)
    try {
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
    } catch (err) {
      toast.error(err?.message || 'Erreur lors du chargement du client')
    } finally {
      setLoading(false)
    }
  }

  const openEdit = () => {
    setForm({
      nom: client.nom || '',
      prenom: client.prenom || '',
      email: client.email || '',
      telephone: client.telephone || '',
      adresse: client.adresse || '',
      notes: client.notes || '',
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: updated } = await api.put(`/clients/${id}`, form)
      setClient(updated)
      setModalOpen(false)
      toast.success('Client modifié')
    } catch (err) {
      toastApiError(err, 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

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
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition"
            >
              <Pencil size={14} />
              Modifier
            </button>
            {client.telephone && (
              <a
                href={`tel:${client.telephone}`}
                className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition"
                title="Appeler"
              >
                <Phone size={18} />
              </a>
            )}
          </div>
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
          <EmptyState
            compact
            icon={FileText}
            title="Aucun devis pour ce client"
            action={{ label: 'Créer un devis', onClick: () => navigate('/devis/nouveau') }}
          />
        ) : (
          <div className="divide-y">
            {devis.map((d) => (
              <div
                key={d.id}
                onClick={() => navigate(d.statut === 'brouillon' ? `/devis/${d.id}/modifier` : '/devis')}
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
          <EmptyState
            compact
            icon={Receipt}
            title="Aucune facture pour ce client"
          />
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
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Modifier le client">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input type="text" value={form.prenom || ''} onChange={updateField('prenom')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input type="text" value={form.nom || ''} onChange={updateField('nom')} required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email || ''} onChange={updateField('email')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input type="tel" value={form.telephone || ''} onChange={updateField('telephone')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <input type="text" value={form.adresse || ''} onChange={updateField('adresse')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes || ''} onChange={updateField('notes')} rows={2} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Annuler</button>
            <button type="submit" disabled={saving} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50">
              {saving ? 'Enregistrement...' : 'Modifier'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
