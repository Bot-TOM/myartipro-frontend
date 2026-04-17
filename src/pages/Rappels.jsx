import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import useAuth from '../lib/useAuth'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { Plus, Trash2, Check, Circle, Calendar, User, Clock } from 'lucide-react'

export default function Rappels() {
  const { user } = useAuth()
  const [rappels, setRappels] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('a_faire')

  const [form, setForm] = useState({
    client_id: '',
    date_rappel: new Date().toISOString().slice(0, 10),
    heure_rappel: '',
    commentaire: '',
  })

  useEffect(() => {
    if (user) {
      loadRappels()
      loadClients()
    }
  }, [user])

  const loadRappels = async () => {
    setLoading(true)
    try {
      const res = await api.get('/rappels')
      setRappels(res.data || [])
    } catch {
      toast.error('Erreur chargement rappels')
    }
    setLoading(false)
  }

  const loadClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, nom, prenom')
      .eq('user_id', user.id)
      .order('nom')
    setClients(data || [])
  }

  const openNew = () => {
    setForm({
      client_id: '',
      date_rappel: new Date().toISOString().slice(0, 10),
      heure_rappel: '',
      commentaire: '',
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.commentaire.trim()) {
      toast.error('Ajoutez un commentaire')
      return
    }
    setSaving(true)
    try {
      await api.post('/rappels', {
        client_id: form.client_id || null,
        date_rappel: form.date_rappel,
        heure_rappel: form.heure_rappel || null,
        commentaire: form.commentaire.trim(),
      })
      toast.success('Rappel créé')
      setModalOpen(false)
      loadRappels()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la création')
    }
    setSaving(false)
  }

  const toggleFait = async (rappel) => {
    try {
      await api.put(`/rappels/${rappel.id}`, { fait: !rappel.fait })
      toast.success(rappel.fait ? 'Rappel réactivé' : 'Marqué comme fait')
      loadRappels()
    } catch {
      toast.error('Erreur')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce rappel ?')) return
    try {
      await api.delete(`/rappels/${id}`)
      toast.success('Rappel supprimé')
      loadRappels()
    } catch {
      toast.error('Erreur')
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  const filtered = rappels.filter((r) => {
    if (filter === 'a_faire') return !r.fait
    if (filter === 'fait') return r.fait
    return true
  })

  // Grouper par date
  const grouped = filtered.reduce((acc, r) => {
    const date = r.date_rappel
    if (!acc[date]) acc[date] = []
    acc[date].push(r)
    return acc
  }, {})

  const sortedDates = Object.keys(grouped).sort()

  const formatDateLabel = (dateStr) => {
    if (dateStr === today) return "Aujourd'hui"
    const d = new Date(dateStr + 'T00:00:00')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (dateStr === tomorrow.toISOString().slice(0, 10)) return 'Demain'
    if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Hier'
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const isOverdue = (dateStr) => dateStr < today

  const filters = [
    { value: 'a_faire', label: 'À faire' },
    { value: 'fait', label: 'Terminés' },
    { value: 'tous', label: 'Tous' },
  ]

  const rappelsAujourdhui = rappels.filter((r) => r.date_rappel === today && !r.fait).length
  const rappelsEnRetard = rappels.filter((r) => r.date_rappel < today && !r.fait).length

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rappels</h1>
          <p className="text-gray-500 mt-1">
            {rappelsAujourdhui > 0 && (
              <span className="text-primary-600 font-medium">{rappelsAujourdhui} aujourd'hui</span>
            )}
            {rappelsAujourdhui > 0 && rappelsEnRetard > 0 && ' · '}
            {rappelsEnRetard > 0 && (
              <span className="text-red-600 font-medium">{rappelsEnRetard} en retard</span>
            )}
            {rappelsAujourdhui === 0 && rappelsEnRetard === 0 && (
              `${rappels.length} rappel${rappels.length > 1 ? 's' : ''}`
            )}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nouveau rappel</span>
          <span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              filter === f.value
                ? 'bg-primary-600 text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Chargement...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <p className="text-gray-400 mb-4">
            {filter === 'a_faire'
              ? 'Aucun rappel en attente'
              : filter === 'fait'
              ? 'Aucun rappel terminé'
              : 'Aucun rappel'}
          </p>
          {filter === 'a_faire' && (
            <button onClick={openNew} className="text-primary-600 hover:underline font-medium text-sm">
              Créer un rappel
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <h3 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${
                isOverdue(date) && filter !== 'fait' ? 'text-red-600' : date === today ? 'text-primary-600' : 'text-gray-500'
              }`}>
                <Calendar size={14} />
                {formatDateLabel(date)}
                {isOverdue(date) && filter !== 'fait' && (
                  <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">En retard</span>
                )}
              </h3>
              <div className="space-y-2">
                {grouped[date].map((r) => (
                  <div
                    key={r.id}
                    className={`bg-white rounded-xl border p-4 flex items-start gap-3 transition ${
                      r.fait ? 'opacity-60' : isOverdue(r.date_rappel) ? 'border-red-200 bg-red-50/30' : ''
                    }`}
                  >
                    <button
                      onClick={() => toggleFait(r)}
                      className={`mt-0.5 shrink-0 p-1 rounded-full transition ${
                        r.fait
                          ? 'text-green-600 bg-green-100'
                          : 'text-gray-300 hover:text-primary-600 hover:bg-primary-50'
                      }`}
                    >
                      {r.fait ? <Check size={16} /> : <Circle size={16} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${r.fait ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {r.commentaire}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {r.heure_rappel && (
                          <span className="text-xs text-primary-600 font-medium flex items-center gap-1">
                            <Clock size={11} /> {r.heure_rappel}
                          </span>
                        )}
                        {r.clients && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <User size={11} /> {r.clients.prenom} {r.clients.nom}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal création */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau rappel">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={form.date_rappel}
                onChange={(e) => setForm({ ...form, date_rappel: e.target.value })}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heure (optionnel)</label>
              <input
                type="time"
                value={form.heure_rappel}
                onChange={(e) => setForm({ ...form, heure_rappel: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client (optionnel)</label>
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            >
              <option value="">Aucun client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire *</label>
            <textarea
              value={form.commentaire}
              onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
              required
              rows={3}
              placeholder="Ex : RDV Solenn Blanchard pour devis salle de bain"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {saving ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
