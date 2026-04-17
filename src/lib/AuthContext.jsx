import { createContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import api from './api'

export const AuthContext = createContext({ user: null, loading: true })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // S'assure que le profil existe en base (auto-création si manquant)
  const ensureProfile = async () => {
    try {
      await api.get('/auth/me')
    } catch {
      // Silencieux — l'utilisateur sera redirigé si le token est invalide
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) ensureProfile()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) ensureProfile()
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
