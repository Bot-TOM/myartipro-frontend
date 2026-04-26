import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAuth from '../lib/useAuth'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { toastApiError } from '../lib/toastApiError'
import { SkeletonCardList } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'
import { Plus, Trash2, CheckCircle2, Circle, Calendar, User, Clock, Bell } from 'lucide-react'

const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm transition'

export default function Rappels() {
  const { user } = useAuth()
  const location = useLocation()
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
  }, [user, location.key])

  const loadRappels = async () => {
    setLoading(true)
    try {
      const res = await api.get('/rappels')
      setRappels(res.data || [])
    } catch (err) {
      toastApiError(err, 'Erreur chargement rappels')
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
    if (!form.commentaire.trim()) { toast.error('Ajoutez un commentaire'); return }
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
      toastApiError(err, 'Erreur lors de la création')
    }
    setSaving(false)
  }

  const toggleFait = async (rappel) => {
    try {
      await api.put(`/rappels/${rappel.id}`, { fait: !rappel.fait })
      toast.success(rappel.fait ? 'Rappel réactivé' : 'Marqué comme fait ✓')
      loadRappels()
    } catch (err) {
      toastApiError(err, 'Erreur lors de la mise à jour')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce rappel ?')) return
    try {
      await api.delete(`/rappels/${id}`)
      toast.success('Rappel supprimé')
      loadRappels()
    } catch (err) {
      toastApiError(err, 'Erreur lors de la suppression')
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  const filtered = rappels.filter((r) => {
    if (filter === 'a_faire') return !r.fait
    if (filter === 'fait') return r.fait
    return true
  })

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
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1)
    if (dateStr === tomorrow.toISOString().slice(0, 10)) return 'Demain'
    if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Hier'
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const isOverdue = (dateStr) => dateStr < today

  const filters = [
    { value: 'a_faire', label: 'À faire' },
    { value: 'fait',    label: 'Terminés' },
    { value: 'tous',    label: 'Tous' },
  ]

  const rappelsAujourdhui = rappels.filter((r) => r.date_rappel === today && !r.fait).length
  const rappelsEnRetard   = rappels.filter((r) => r.date_rappel < today && !r.fait).length

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rappels</h1>
          <p className="text-sm mt-0.5">
            {rappelsAujourdhui > 0 && (
              <span className="text-primary-600 font-semibold">{rappelsAujourdhui} aujourd'hui</span>
            )}
            {rappelsAujourdhui > 0 && rappelsEnRetard > 0 && <span className="text-slate-300 mx-1">·</span>}
            {rappelsEnRetard > 0 && (
              <span className="text-red-600 font-semibold">{rappelsEnRetard} en retard</span>
            )}
            {rappelsAujourdhui === 0 && rappelsEnRetard === 0 && (
              <span className="text-slate-500">{rappels.length} rappel{rappels.length > 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Nouveau rappel</span>
          <span className="sm:hidden">Ajouter</span>
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-5">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === f.value
                ? 'bg-primary-600 text-white shadow-sm scale-105'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonCardList count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={filter === 'fait' ? CheckCircle2 : Bell}
          title={
            filter === 'a_faire' ? 'Aucun rappel en attente'
            : filter === 'fait'  ? 'Aucun rappel terminé'
            : 'Aucun rappel'
          }
          description={
            filter === 'a_faire' ? 'Planifiez vos relances et rendez-vous clients'
            : filter === 'fait'  ? 'Les rappels cochés apparaîtront ici'
            : 'Créez un rappel pour ne rien oublier'
          }
          action={filter !== 'fait' ? { label: 'Créer un rappel', onClick: openNew } : undefined}
        />
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => {
            const overdue = isOverdue(date) && filter !== 'fait'
            const isToday = date === today
            return (
              <div key={date}>
                {/* Label de date */}
                <div className={`flex items-center gap-2 mb-3 ${overdue ? 'text-red-600' : isToday ? 'text-primary-700' : 'text-slate-500'}`}>
                  <Calendar size={14} />
                  <span className="text-sm font-semibold capitalize">{formatDateLabel(date)}</span>
                  {overdue && (
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      En retard
                    </span>
                  )}
                  {isToday && !overdue && (
                    <span className="bg-primary-100 text-primary-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Aujourd'hui
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {grouped[date].map((r) => (
                    <div
                      key={r.id}
                      className={`bg-white rounded-2xl shadow-sm flex items-start gap-3 p-4 transition ${
                        overdue && !r.fait ? 'border-l-4 border-l-red-400' : ''
                      } ${r.fait ? 'opacity-55' : ''}`}
                    >
                      {/* Bouton check */}
                      <button
                        onClick={() => toggleFait(r)}
                        className="mt-0.5 shrink-0 transition-transform hover:scale-110"
                        title={r.fait ? 'Réactiver' : 'Marquer comme fait'}
                      >
                        {r.fait
                          ? <CheckCircle2 size={22} className="text-green-500 fill-green-100" />
                          : <Circle size={22} className={overdue ? 'text-red-300' : 'text-slate-300'} />
                        }
                      </button>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-snug ${r.fait ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {r.commentaire}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5">
                          {r.heure_rappel && (
                            <span className="text-xs text-primary-600 font-semibold flex items-center gap-1">
                              <Clock size={11} /> {r.heure_rappel}
                            </span>
                          )}
                          {r.clients && (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <User size={11} /> {r.clients.prenom} {r.clients.nom}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Supprimer */}
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nouveau rappel">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date *</label>
              <input
                type="date"
                value={form.date_rappel}
                onChange={(e) => setForm({ ...form, date_rappel: e.target.value })}
                required
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Heure (opt.)</label>
              <input
                type="time"
                value={form.heure_rappel}
                onChange={(e) => setForm({ ...form, heure_rappel: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Client (opt.)</label>
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className={inputCls}
            >
              <option value="">Aucun client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Commentaire *</label>
            <textarea
              value={form.commentaire}
              onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
              required
              rows={3}
              placeholder="Ex : RDV Solenn Blanchard pour devis salle de bain"
              className={`${inputCls} resize-none`}
            />
          </div>
          <div className="flex gap-3 pt-1">
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
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
            >
              {saving ? 'Création…' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  )
}
