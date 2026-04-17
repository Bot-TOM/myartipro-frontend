import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    entreprise: '',
    siret: '',
    telephone: '',
  })

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      setLoading(false)
      return
    }

    if (form.siret && !/^\d{14}$/.test(form.siret)) {
      setError('Le SIRET doit contenir exactement 14 chiffres')
      setLoading(false)
      return
    }

    try {
      // 1. Créer le compte + profil via le backend (service role — bypass RLS)
      await axios.post(`${API_URL}/auth/register`, {
        email: form.email,
        password: form.password,
        nom: form.nom,
        prenom: form.prenom,
        entreprise: form.entreprise || null,
        siret: form.siret || null,
        telephone: form.telephone || null,
      })

      // 2. Connecter automatiquement
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (loginError) {
        setError('Compte créé. Connectez-vous.')
        navigate('/login')
        return
      }

      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Erreur lors de la création du compte'
      setError(msg)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">MyArtipro</h1>
          <p className="text-gray-500 mt-2">Créez votre compte artisan</p>
        </div>

        <form onSubmit={handleRegister} className="bg-white rounded-xl shadow-sm border p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Inscription</h2>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
              <input
                type="text"
                value={form.prenom}
                onChange={update('prenom')}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                value={form.nom}
                onChange={update('nom')}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise</label>
            <input
              type="text"
              value={form.entreprise}
              onChange={update('entreprise')}
              placeholder="Ex: Martin Services"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
              <input
                type="text"
                value={form.siret}
                onChange={update('siret')}
                placeholder="14 chiffres"
                maxLength={14}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input
                type="tel"
                value={form.telephone}
                onChange={update('telephone')}
                placeholder="06 12 34 56 78"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={form.email}
              onChange={update('email')}
              required
              placeholder="vous@exemple.fr"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
            <input
              type="password"
              value={form.password}
              onChange={update('password')}
              required
              minLength={6}
              placeholder="Minimum 6 caractères"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 text-base"
          >
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary-600 hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
