import axios from 'axios'
import { supabase } from './supabase'

export const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://myartipro-backend-production.up.railway.app'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30s — tient compte du cold start Railway
})

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    console.error('[API]', err.config?.method?.toUpperCase(), err.config?.url, '→', err.message)

    // 401 = JWT expiré ou user supprimé → on force un signOut propre
    // pour éviter que l'app reste bloquée avec un token invalide
    if (err.response?.status === 401) {
      await supabase.auth.signOut().catch(() => {})
    }

    return Promise.reject(err)
  }
)

export default api
