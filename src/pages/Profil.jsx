import { useEffect, useState } from 'react'
import useAuth from '../lib/useAuth'
import Layout from '../components/Layout'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { User, Building2, Phone, MapPin, CreditCard, Save } from 'lucide-react'

export default function Profil() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    entreprise: '',
    siret: '',
    telephone: '',
    adresse: '',
  })

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const res = await api.get('/auth/me')
        const p = res.data
        setForm({
          nom: p.nom || '',
          prenom: p.prenom || '',
          entreprise: p.entreprise || '',
          siret: p.siret || '',
          telephone: p.telephone || '',
          adresse: p.adresse || '',
        })
      } catch {
        toast.error('Erreur chargement du profil')
      }
      setLoading(false)
    }
    load()
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation SIRET
    if (form.siret && !/^\d{14}$/.test(form.siret)) {
      toast.error('Le SIRET doit contenir exactement 14 chiffres')
      return
    }

    setSaving(true)
    try {
      await api.put('/auth/me', form)
      toast.success('Profil mis a jour')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la mise a jour')
    }
    setSaving(false)
  }

  const updateField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  if (loading) {
    return <Layout><p className="text-gray-400">Chargement...</p></Layout>
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mon profil</h1>
      <p className="text-gray-500 mb-6">Ces informations apparaissent sur vos devis et factures</p>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Identite */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User size={18} className="text-primary-600" /> Identite
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prenom *</label>
              <input
                type="text"
                value={form.prenom}
                onChange={updateField('prenom')}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                value={form.nom}
                onChange={updateField('nom')}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telephone</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={form.telephone}
                onChange={updateField('telephone')}
                placeholder="06 12 34 56 78"
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
              />
            </div>
          </div>
        </div>

        {/* Entreprise */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 size={18} className="text-primary-600" /> Entreprise
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise</label>
            <input
              type="text"
              value={form.entreprise}
              onChange={updateField('entreprise')}
              placeholder="Ex: Dupont Plomberie"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
            <div className="relative">
              <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.siret}
                onChange={updateField('siret')}
                placeholder="12345678901234"
                maxLength={14}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base font-mono"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">14 chiffres — visible sur vos devis et factures</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse professionnelle</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
              <textarea
                value={form.adresse}
                onChange={updateField('adresse')}
                rows={2}
                placeholder="12 rue de la Paix, 75001 Paris"
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base resize-none"
              />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          Ces informations seront utilisees automatiquement sur vos devis et factures PDF.
          Pensez a bien renseigner le nom d'entreprise et le SIRET pour des documents conformes.
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </form>
    </Layout>
  )
}
