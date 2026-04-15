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

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Email ou mot de passe incorrect')
      setLoading(false)
      return
    }

    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">MyArtipro</h1>
          <p className="text-gray-500 mt-2">Gérez vos devis en toute simplicité</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-xl shadow-sm border p-6 sm:p-8 space-y-5">
          <h2 className="text-xl font-semibold text-gray-900">Connexion</h2>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
              placeholder="vous@exemple.fr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-base"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 text-base"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <div className="text-center space-y-2">
            <Link to="/mot-de-passe-oublie" className="text-sm text-gray-400 hover:text-primary-600 hover:underline">
              Mot de passe oublie ?
            </Link>
            <p className="text-sm text-gray-500">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-primary-600 hover:underline font-medium">
                S'inscrire
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
