import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAuth from '../lib/useAuth'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Phone, Mail, MapPin, Search, StickyNote } from 'lucide-react'
import { CLIENT_STATUTS, getStatutConfig } from '../lib/constants'

const emptyClient = { nom: '', prenom: '', email: '', telephone: '', adresse: '', notes: '', statut: 'nouveau' }

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
  const [filterStatut, setFilterStatut] = useState('tous')

  useEffect(() => {
    if (user) {
      setSearch('')
      setFilterStatut('tous')
      loadClients(user.id)
    }
  }, [user, location.key])

  const loadClients = async (userId) => {
    setLoading(true)
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }

  const openNew = () => {
    setEditing(null)
    setForm(emptyClient)
    setModalOpen(true)
  }

  const openEdit = (client) => {
    setEditing(client)
    setForm({
      nom: client.nom,
      prenom: client.prenom || '',
      email: client.email || '',
      telephone: client.telephone || '',
      adresse: client.adresse || '',
      notes: client.notes || '',
      statut: client.statut || 'nouveau',
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('clients').update(form).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('clients').insert({ ...form, user_id: user.id })
        if (error) throw error
      }
      setModalOpen(false)
      toast.success(editing ? 'Client modifie' : 'Client ajoute')
      loadClients(user.id)
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce client ?')) return
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id)
      if (error) throw error
      toast.success('Client supprime')
      loadClients(user.id)
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la suppression')
    }
  }

  const updateField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const filtered = clients.filter((c) => {
    if (filterStatut !== 'tous' && (c.statut || 'nouveau') !== filterStatut) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return [c.nom, c.prenom, c.email, c.telephone, c.adresse]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(q))
  })

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 mt-1">{clients.length} client{clients.length > 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nouveau client</span>
          <span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      {clients.length > 0 && (
        <>
          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un client (nom, email, tel...)"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
            />
          </div>
          <div className="flex gap-2 mb-6 overflow-x-auto">
            <button
              onClick={() => setFilterStatut('tous')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${filterStatut === 'tous' ? 'bg-primary-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
            >
              Tous
            </button>
            {CLIENT_STATUTS.map((s) => (
              <button
                key={s.value}
                onClick={() => setFilterStatut(s.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${filterStatut === s.value ? 'bg-primary-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </>
      )}

      {loading ? (
        <p className="text-gray-400">Chargement...</p>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <p className="text-gray-400 mb-4">Aucun client pour le moment</p>
          <button onClick={openNew} className="text-primary-600 hover:underline font-medium text-sm">
            Ajouter votre premier client
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <p className="text-gray-400">Aucun client trouvé</p>
          {(search || filterStatut !== 'tous') && (
            <button
              onClick={() => { setSearch(''); setFilterStatut('tous') }}
              className="text-primary-600 hover:underline text-sm mt-2 block mx-auto"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <div key={client.id} className="bg-white rounded-xl border p-5 cursor-pointer hover:shadow-md transition" onClick={() => navigate(`/clients/${client.id}`)}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{client.prenom} {client.nom}</h3>
                  {(() => {
                    const cfg = getStatutConfig(client.statut)
                    return (
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    )
                  })()}
                </div>
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(client) }} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition">
                    <Pencil size={16} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(client.id) }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 text-sm text-gray-500">
                {client.email && <div className="flex items-center gap-2"><Mail size={14} />{client.email}</div>}
                {client.telephone && <div className="flex items-center gap-2"><Phone size={14} />{client.telephone}</div>}
                {client.adresse && <div className="flex items-center gap-2"><MapPin size={14} />{client.adresse}</div>}
                {client.notes && <div className="flex items-start gap-2 text-gray-400 italic"><StickyNote size={14} className="mt-0.5 shrink-0" /><span className="line-clamp-2">{client.notes}</span></div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Modifier le client' : 'Nouveau client'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
              <input type="text" value={form.prenom} onChange={updateField('prenom')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input type="text" value={form.nom} onChange={updateField('nom')} required className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={updateField('email')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input type="tel" value={form.telephone} onChange={updateField('telephone')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <input type="text" value={form.adresse} onChange={updateField('adresse')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select value={form.statut} onChange={updateField('statut')} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none">
              {CLIENT_STATUTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={updateField('notes')} rows={2} placeholder="Notes internes sur ce client..." className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Annuler</button>
            <button type="submit" disabled={saving} className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50">
              {saving ? 'Enregistrement...' : editing ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
