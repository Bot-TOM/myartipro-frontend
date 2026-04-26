import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAuth from '../lib/useAuth'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import api from '../lib/api'
import { toastApiError } from '../lib/toastApiError'
import { SkeletonCardList } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Phone, Mail, MapPin, Search, StickyNote, Users } from 'lucide-react'

const emptyClient = { nom: '', prenom: '', email: '', telephone: '', adresse: '', notes: '' }

const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm transition'

export default function Clients() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyClient)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (user) {
      setSearch('')
      loadClients(user.id)
    }
  }, [user, location.key])

  const loadClients = async (userId) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setClients(data || [])
    } catch (err) {
      toastApiError(err, 'Erreur lors du chargement des clients')
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => {
    setEditing(null)
    setForm(emptyClient)
    setModalOpen(true)
  }

  const openEdit = (client) => {
    setEditing(client)
    setForm({
      nom:       client.nom,
      prenom:    client.prenom    || '',
      email:     client.email     || '',
      telephone: client.telephone || '',
      adresse:   client.adresse   || '',
      notes:     client.notes     || '',
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/clients/${editing.id}`, form)
        toast.success('Client modifié')
      } else {
        await api.post('/clients', form)
        toast.success('Client ajouté')
      }
      setModalOpen(false)
      loadClients(user.id)
    } catch (err) {
      toastApiError(err, 'Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce client ?')) return
    try {
      await api.delete(`/clients/${id}`)
      toast.success('Client supprimé')
      loadClients(user.id)
    } catch (err) {
      toastApiError(err, 'Erreur lors de la suppression')
    }
  }

  const updateField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const filtered = clients.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return [c.nom, c.prenom, c.email, c.telephone, c.adresse]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(q))
  })

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 mt-0.5 text-sm">{clients.length} client{clients.length > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nouveau client</span>
          <span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      {/* Recherche */}
      {clients.length > 0 && (
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (nom, email, téléphone…)"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm transition"
          />
        </div>
      )}

      {loading ? (
        <SkeletonCardList count={4} />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun client pour le moment"
          description="Ajoutez vos clients pour créer des devis et factures"
          action={{ label: 'Ajouter un client', onClick: openNew }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Aucun client trouvé"
          description={search ? `Aucun résultat pour « ${search} »` : undefined}
          action={search ? { label: 'Effacer la recherche', onClick: () => setSearch('') } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-2xl shadow-sm p-5 cursor-pointer hover:shadow-md transition"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              {/* Nom + actions */}
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">
                    {client.prenom} {client.nom}
                  </h3>
                </div>
                <div className="flex gap-0.5 ml-2 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(client) }}
                    className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(client.id) }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Infos contact */}
              <div className="space-y-1.5 text-sm text-slate-500">
                {client.email && (
                  <div className="flex items-center gap-2 truncate">
                    <Mail size={13} className="shrink-0 text-slate-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.telephone && (
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="shrink-0 text-slate-400" />
                    {client.telephone}
                  </div>
                )}
                {client.adresse && (
                  <div className="flex items-center gap-2 truncate">
                    <MapPin size={13} className="shrink-0 text-slate-400" />
                    <span className="truncate">{client.adresse}</span>
                  </div>
                )}
                {client.notes && (
                  <div className="flex items-start gap-2 text-slate-400 italic">
                    <StickyNote size={13} className="mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{client.notes}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal création / édition */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Modifier le client' : 'Nouveau client'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
              <input type="text" value={form.prenom} onChange={updateField('prenom')} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nom *</label>
              <input type="text" value={form.nom} onChange={updateField('nom')} required className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={updateField('email')} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
            <input type="tel" value={form.telephone} onChange={updateField('telephone')} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
            <input type="text" value={form.adresse} onChange={updateField('adresse')} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={updateField('notes')}
              rows={2}
              placeholder="Notes internes sur ce client…"
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
            >
              {saving ? 'Enregistrement…' : editing ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
