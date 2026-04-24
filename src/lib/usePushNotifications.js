import { useState, useEffect } from 'react'
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
  const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
  const [permission, setPermission] = useState(supported ? Notification.permission : 'denied')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (!supported) return
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub))
    )
  }, [supported])

  const subscribe = async () => {
    if (!supported || !VAPID_PUBLIC_KEY) return false
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return false

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      await api.post('/push/subscribe', sub.toJSON())
      setSubscribed(true)
      return true
    } catch {
      return false
    }
  }

  const unsubscribe = async () => {
    if (!supported) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await sub.unsubscribe()
      await api.post('/push/unsubscribe', { endpoint: sub.endpoint })
    }
    setSubscribed(false)
  }

  return { supported, permission, subscribed, subscribe, unsubscribe }
}
