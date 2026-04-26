import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
      return
    }

    navigate('/')
  }

  const inputCls = 'w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base transition'

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-sm w-full">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 mb-4">
            <span className="text-white text-2xl font-extrabold tracking-tight">M</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">MyArtipro</h1>
          <p className="text-slate-500 mt-1 text-sm">Devis et factures pour artisans</p>
        </div>

        {/* Carte */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-5">
          <h2 className="text-lg font-semibold text-slate-900">Connexion</h2>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputCls}
              placeholder="vous@exemple.fr"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-700">Mot de passe</label>
              <Link to="/mot-de-passe-oublie" className="text-xs text-slate-400 hover:text-primary-600 transition">
                Oublié ?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={inputCls}
              placeholder="••••••••"
            />
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 text-base"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>

          <p className="text-center text-sm text-slate-500">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-primary-600 hover:underline font-semibold">
              S'inscrire
            </Link>
          </p>
        </div>

        {/* Liens légaux */}
        <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-400">
          <Link to="/mentions-legales"          className="hover:text-slate-600 transition">Mentions légales</Link>
          <Link to="/politique-confidentialite" className="hover:text-slate-600 transition">Confidentialité</Link>
          <Link to="/conditions-utilisation"    className="hover:text-slate-600 transition">CGU</Link>
        </div>
      </div>
    </div>
  )
}
