import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import axios from 'axios'
import { API_URL } from '../lib/api'

export default function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [consent, setConsent] = useState(false)
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', password: '',
    entreprise: '', siret: '', telephone: '',
  })

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!consent) { setError('Vous devez accepter les CGU, CGV et la politique de confidentialité.'); return }
    if (form.password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères'); return }
    if (form.siret && !/^\d{14}$/.test(form.siret)) { setError('Le SIRET doit contenir exactement 14 chiffres'); return }

    setLoading(true)
    setError('')

    try {
      await axios.post(`${API_URL}/auth/register`, {
        email: form.email, password: form.password,
        nom: form.nom, prenom: form.prenom,
        entreprise: form.entreprise || null,
        siret: form.siret || null,
        telephone: form.telephone || null,
      })

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: form.email, password: form.password,
      })

      if (loginError) { setError('Compte créé. Connectez-vous.'); navigate('/login'); return }
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la création du compte')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EFF2F8] px-4 py-10">
      <div className="max-w-md w-full">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-primary-600 tracking-tight">MyArtipro</h1>
          <p className="text-slate-500 mt-1.5 text-sm">Gérez vos devis et factures en quelques clics</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-5">Créer mon compte</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Prénom *</label>
                <input type="text" value={form.prenom} onChange={update('prenom')} required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm bg-slate-50 focus:bg-white transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nom *</label>
                <input type="text" value={form.nom} onChange={update('nom')} required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm bg-slate-50 focus:bg-white transition" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nom de l'entreprise</label>
              <input type="text" value={form.entreprise} onChange={update('entreprise')} placeholder="Ex : Martin Services"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm bg-slate-50 focus:bg-white transition" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">SIRET</label>
                <input type="text" value={form.siret} onChange={update('siret')} placeholder="14 chiffres" maxLength={14}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm bg-slate-50 focus:bg-white transition font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Téléphone</label>
                <input type="tel" value={form.telephone} onChange={update('telephone')} placeholder="06 12 34 56 78"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm bg-slate-50 focus:bg-white transition" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email *</label>
              <input type="email" value={form.email} onChange={update('email')} required placeholder="vous@exemple.fr"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm bg-slate-50 focus:bg-white transition" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mot de passe *</label>
              <input type="password" value={form.password} onChange={update('password')} required minLength={6} placeholder="Minimum 6 caractères"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm bg-slate-50 focus:bg-white transition" />
            </div>

            {/* Consentement explicite RGPD */}
            <label className="flex items-start gap-3 cursor-pointer pt-1">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary-600 flex-shrink-0" />
              <span className="text-xs text-slate-500 leading-relaxed">
                J'ai lu et j'accepte les{' '}
                <Link to="/conditions-utilisation" target="_blank" className="text-primary-600 hover:underline font-medium">CGU</Link>,
                les{' '}
                <Link to="/cgv" target="_blank" className="text-primary-600 hover:underline font-medium">CGV</Link>
                {' '}et la{' '}
                <Link to="/politique-confidentialite" target="_blank" className="text-primary-600 hover:underline font-medium">politique de confidentialité</Link>.
                {' '}Je consens au traitement de mes données personnelles pour le fonctionnement du service.
              </span>
            </label>

            <button type="submit" disabled={loading || !consent}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 text-sm mt-2">
              {loading ? 'Création en cours...' : 'Créer mon compte'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary-600 hover:underline font-semibold">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
