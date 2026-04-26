import { useState, useEffect, useCallback } from 'react'
import api from './api'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output
}

export default function usePushNotifications() {
  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window

  const [permission, setPermission] = useState(supported ? Notification.permission : 'denied')
  const [subscribed, setSubscribed] = useState(false)

  const refreshState = useCallback(async () => {
    if (!supported) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
      setPermission(Notification.permission)
    } catch {
      setSubscribed(false)
    }
  }, [supported])

  useEffect(() => {
    refreshState()
  }, [refreshState])

  const subscribe = async () => {
    if (!supported)
      return { ok: false, error: 'Notifications non supportées sur cet appareil' }
    if (!VAPID_PUBLIC_KEY)
      return { ok: false, error: 'Clé VAPID manquante — contactez le support' }

    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted')
        return { ok: false, error: 'Permission refusée dans les réglages iOS' }

      const reg = await navigator.serviceWorker.ready

      // Nettoyer toute souscription existante (évite le "Network error" iOS)
      const existing = await reg.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      try {
        await api.post('/push/subscribe', sub.toJSON())
      } catch (apiErr) {
        await sub.unsubscribe()
        const detail = apiErr?.response?.data?.detail || apiErr?.message || 'Erreur serveur'
        return { ok: false, error: detail }
      }

      setSubscribed(true)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e?.message || 'Erreur inconnue' }
    }
  }

  const unsubscribe = async () => {
    if (!supported) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await api.post('/push/unsubscribe', { endpoint: sub.endpoint })
        await sub.unsubscribe()
      }
    } catch {
      // ignore
    }
    setSubscribed(false)
    setTimeout(() => refreshState(), 300)
  }

  return { supported, permission, subscribed, subscribe, unsubscribe }
}
