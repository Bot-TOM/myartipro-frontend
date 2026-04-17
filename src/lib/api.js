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

export default api
