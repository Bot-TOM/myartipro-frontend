import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

// Le SW attend sagement — skipWaiting() déclenché uniquement par le bouton "Recharger"
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()))

// Requis pour le bouton "Recharger" du PwaUpdatePrompt
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

registerRoute(
  ({ url }) => url.hostname.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'supabase-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 3600 })],
    networkTimeoutSeconds: 5,
  })
)

registerRoute(
  ({ url }) => url.hostname.includes('railway.app'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 300 })],
    networkTimeoutSeconds: 8,
  })
)

self.addEventListener('push', (event) => {
  if (!event.data) return
  let data
  try { data = event.data.json() } catch { return }

  event.waitUntil(
    Promise.all([
      // Notification système (background)
      self.registration.showNotification(data.title || 'MyArtipro', {
        body: data.body || '',
        icon: '/icon-192.png',
        tag: data.tag || 'myartipro',
        renotify: true,
        data: { url: data.url || '/' },
      }),
      // Message vers l'app si elle est au premier plan
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        windowClients.forEach((client) => client.postMessage({ type: 'PUSH_RECEIVED', ...data }))
      }),
    ])
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        return clients.openWindow(url)
      })
  )
})
