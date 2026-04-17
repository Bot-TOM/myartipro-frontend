import { createContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import api from './api'

export const AuthContext = createContext({ user: null, loading: true })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Garantit l'existence du profil avant de débloquer l'app
  const ensureProfile = async () => {
    try {
      await api.get('/auth/me')
    } catch {
      // Silencieux — token invalide ou backend indisponible
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await ensureProfile() // bloquant : profil garanti avant rendu
      }
      setUser(session?.user ?? null)
      setLoading(false)
    }
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await ensureProfile()
        }
        setUser(session?.user ?? null)
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
