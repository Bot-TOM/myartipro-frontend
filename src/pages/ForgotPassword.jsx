import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">MyArtipro</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6 sm:p-8 space-y-5">
          {sent ? (
            <>
              <div className="text-center py-4">
                <div className="text-4xl mb-4">📧</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Email envoyé</h2>
                <p className="text-gray-500 text-sm">
                  Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un lien pour réinitialiser votre mot de passe.
                </p>
              </div>
              <Link
                to="/login"
                className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg transition text-base"
              >
                Retour à la connexion
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900">Mot de passe oublié</h2>
              <p className="text-sm text-gray-500">
                Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 text-base"
                >
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500">
                <Link to="/login" className="text-primary-600 hover:underline font-medium">
                  Retour à la connexion
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
