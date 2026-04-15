import { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import useOnline from '../lib/useOnline'
import { enqueueRequest } from '../lib/offlineQueue'
import Modal from './Modal'

const emptyForm = { nom: '', prenom: '', email: '', telephone: '', adresse: '' }

export default function QuickClientModal({ isOpen, onClose, userId, onClientCreated }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const online = useOnline()

  const updateField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    if (!online) {
      // En mode offline, on ne peut pas créer le client en base
      // mais on le sauvegarde dans la queue pour sync plus tard
      await enqueueRequest({
        method: 'POST',
        url: '/clients',
        data: { ...form, user_id: userId },
      })
      setSaving(false)
      toast.success('Client sauvegardé hors-ligne — sera créé au retour du réseau')
      setForm(emptyForm)
      onClose()
      return
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({ ...form, user_id: userId })
      .select('id, nom, prenom')
      .single()

    setSaving(false)

    if (error) {
      toast.error('Erreur lors de la création du client')
      return
    }

    toast.success('Client ajouté')
    setForm(emptyForm)
    onClose()
    onClientCreated(data)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nouveau client rapide">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
            <input
              type="text"
              value={form.prenom}
              onChange={updateField('prenom')}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input
              type="text"
              value={form.nom}
              onChange={updateField('nom')}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
          <input
            type="tel"
            value={form.telephone}
            onChange={updateField('telephone')}
            placeholder="06 12 34 56 78"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={updateField('email')}
            placeholder="client@email.com"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <input
            type="text"
            value={form.adresse}
            onChange={updateField('adresse')}
            placeholder="12 rue de la Paix, 75001 Paris"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            {saving ? 'Ajout...' : 'Ajouter le client'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
