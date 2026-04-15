import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import useAuth from '../lib/useAuth'
import Layout from '../components/Layout'
import api from '../lib/api'
import toast from 'react-hot-toast'
import useOnline from '../lib/useOnline'
import { enqueueRequest } from '../lib/offlineQueue'
import { Plus, Trash2, ArrowLeft, UserPlus } from 'lucide-react'
import QuickClientModal from '../components/QuickClientModal'
import { PRESTATIONS_TYPES } from '../lib/constants'

export default function EditDevis() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [numero, setNumero] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)
  const online = useOnline()

  const [form, setForm] = useState({
    client_id: '',
    titre: '',
    tva: 20,
    notes: '',
    date_validite: '',
    urgence: 'normal',
    charge: '',
  })

  const [prestations, setPrestations] = useState([
    { description: '', quantite: 1, prix_unitaire: 0 },
  ])

  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      // Charger clients et devis en parallèle
      const [clientsRes, devisRes] = await Promise.all([
        supabase
          .from('clients')
          .select('id, nom, prenom')
          .eq('user_id', user.id)
          .order('nom'),
        api.get(`/devis/${id}`),
      ])

      setClients(clientsRes.data || [])

      const devis = devisRes.data
      setNumero(devis.numero)
      setForm({
        client_id: devis.client_id,
        titre: devis.titre || '',
        tva: devis.tva ?? 20,
        notes: devis.notes || '',
        date_validite: devis.date_validite ? devis.date_validite.slice(0, 10) : '',
        urgence: devis.urgence || 'normal',
        charge: devis.charge || '',
      })
      setPrestations(
        devis.prestations && devis.prestations.length > 0
          ? devis.prestations.map((p) => ({
              description: p.description || '',
              quantite: p.quantite ?? 1,
              prix_unitaire: p.prix_unitaire ?? 0,
            }))
          : [{ description: '', quantite: 1, prix_unitaire: 0 }]
      )
      setLoading(false)
    }

    loadData().catch(() => {
      setError('Impossible de charger le devis')
      setLoading(false)
    })
  }, [user, id])

  const addPrestation = () => {
    setPrestations([...prestations, { description: '', quantite: 1, prix_unitaire: 0 }])
  }

  const removePrestation = (index) => {
    if (prestations.length === 1) return
    setPrestations(prestations.filter((_, i) => i !== index))
  }

  const updatePrestation = (index, field, value) => {
    setPrestations(prestations.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    ))
  }

  const montantHT = prestations.reduce(
    (sum, p) => sum + (parseFloat(p.quantite) || 0) * (parseFloat(p.prix_unitaire) || 0), 0
  )
  const montantTVA = montantHT * (parseFloat(form.tva) || 0) / 100
  const montantTTC = montantHT + montantTVA

  const formatEur = (n) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.client_id) { setError('Sélectionnez un client'); return }
    if (prestations.some((p) => !p.description || !p.prix_unitaire)) {
      setError('Remplissez toutes les prestations (description + prix)')
      return
    }

    setSaving(true)

    const payload = {
      client_id: form.client_id,
      titre: form.titre,
      prestations: prestations.map((p) => ({
        description: p.description,
        quantite: parseFloat(p.quantite) || 1,
        prix_unitaire: parseFloat(p.prix_unitaire) || 0,
      })),
      tva: parseFloat(form.tva) || 20,
      date_validite: form.date_validite || null,
      notes: form.notes || null,
      urgence: form.urgence || 'normal',
      charge: form.charge || null,
    }

    if (!online) {
      await enqueueRequest({ method: 'PUT', url: `/devis/${id}`, data: payload })
      toast.success('Modification sauvegardée hors-ligne — sera envoyée au retour du réseau')
      navigate('/devis')
      return
    }

    try {
      await api.put(`/devis/${id}`, payload)
      toast.success('Devis modifié avec succès')
      navigate('/devis')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la modification')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <p className="text-gray-400">Chargement du devis...</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <button
        onClick={() => navigate('/devis')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-6 transition"
      >
        <ArrowLeft size={16} />
        Retour
      </button>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Modifier le devis</h1>
        {numero && (
          <span className="text-sm font-mono text-gray-400 bg-gray-100 px-2 py-1 rounded">{numero}</span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Infos générales */}
        <div className="bg-white rounded-xl border p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Informations</h2>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Client *</label>
              <button
                type="button"
                onClick={() => setShowNewClient(true)}
                className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs font-medium"
              >
                <UserPlus size={14} /> Nouveau client
              </button>
            </div>
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              required
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
            >
              <option value="">Sélectionner un client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre du devis *</label>
            <input
              type="text"
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              required
              placeholder="Ex: Réparation fuite salle de bain"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TVA (%)</label>
              <input
                type="number"
                value={form.tva}
                onChange={(e) => setForm({ ...form, tva: e.target.value })}
                step="0.1"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Validité</label>
              <input
                type="date"
                value={form.date_validite}
                onChange={(e) => setForm({ ...form, date_validite: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
              <select
                value={form.urgence}
                onChange={(e) => setForm({ ...form, urgence: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
              >
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Charge estimée</label>
              <select
                value={form.charge}
                onChange={(e) => setForm({ ...form, charge: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
              >
                <option value="">Non définie</option>
                <option value="rapide">Rapide (- de 2h)</option>
                <option value="moyen">Moyen (demi-journée)</option>
                <option value="long">Long (1 jour+)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Prestations */}
        <div className="bg-white rounded-xl border p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Prestations</h2>
            <button
              type="button"
              onClick={addPrestation}
              className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              <Plus size={16} /> Ajouter
            </button>
          </div>

          {prestations.map((p, index) => (
            <div key={index} className="border rounded-lg p-3 sm:p-4 space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <input
                    type="text"
                    value={p.description}
                    onChange={(e) => updatePrestation(index, 'description', e.target.value)}
                    required
                    placeholder="Décrivez la prestation"
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
                  />
                  <div className="flex flex-wrap gap-1 mt-2">
                    {PRESTATIONS_TYPES
                      .filter((t) => !prestations.some((pr) => pr.description === t))
                      .slice(0, 3)
                      .map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => updatePrestation(index, 'description', type)}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-primary-50 hover:text-primary-600 transition"
                        >
                          {type}
                        </button>
                      ))}
                  </div>
                </div>
                {prestations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePrestation(index)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg mt-6"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Qté</label>
                  <input
                    type="number"
                    value={p.quantite}
                    onChange={(e) => updatePrestation(index, 'quantite', e.target.value)}
                    min="0.1"
                    step="0.1"
                    className="w-full px-2 sm:px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Prix HT</label>
                  <input
                    type="number"
                    value={p.prix_unitaire}
                    onChange={(e) => updatePrestation(index, 'prix_unitaire', e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full px-2 sm:px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Total</label>
                  <div className="px-2 sm:px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium text-base">
                    {formatEur((parseFloat(p.quantite) || 0) * (parseFloat(p.prix_unitaire) || 0))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totaux */}
        <div className="bg-white rounded-xl border p-4 sm:p-6">
          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total HT</span><span>{formatEur(montantHT)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>TVA ({form.tva}%)</span><span>{formatEur(montantTVA)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                <span>Total TTC</span><span>{formatEur(montantTTC)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border p-4 sm:p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Conditions</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Conditions particulières, délais..."
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none text-base"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/devis')}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>

      <QuickClientModal
        isOpen={showNewClient}
        onClose={() => setShowNewClient(false)}
        userId={user?.id}
        onClientCreated={(newClient) => {
          setClients((prev) => [...prev, newClient])
          setForm((prev) => ({ ...prev, client_id: newClient.id }))
        }}
      />
    </Layout>
  )
}
