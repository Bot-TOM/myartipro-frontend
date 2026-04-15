import { useEffect, useState } from 'react'
import useOnline from '../lib/useOnline'
import { syncPendingRequests } from '../lib/syncService'
import { getPendingCount } from '../lib/offlineQueue'
import { WifiOff, Wifi } from 'lucide-react'

export default function OfflineBanner() {
  const online = useOnline()
  const [pendingCount, setPendingCount] = useState(0)
  const [showReconnect, setShowReconnect] = useState(false)

  // Rafraîchir le compteur régulièrement
  useEffect(() => {
    const check = async () => {
      const count = await getPendingCount()
      setPendingCount(count)
    }
    check()
    const interval = setInterval(check, 3000)
    return () => clearInterval(interval)
  }, [])

  // Quand le réseau revient, sync et afficher un message temporaire
  useEffect(() => {
    if (online) {
      syncPendingRequests().then(async () => {
        const count = await getPendingCount()
        setPendingCount(count)
      })
      setShowReconnect(true)
      const timer = setTimeout(() => setShowReconnect(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [online])

  if (!online) {
    return (
      <div className="bg-orange-500 text-white text-sm px-4 py-2 flex items-center justify-center gap-2">
        <WifiOff size={16} />
        <span>Mode hors-ligne {pendingCount > 0 && `— ${pendingCount} en attente de sync`}</span>
      </div>
    )
  }

  if (showReconnect && pendingCount === 0) {
    return (
      <div className="bg-green-500 text-white text-sm px-4 py-2 flex items-center justify-center gap-2 transition-all">
        <Wifi size={16} />
        <span>Connexion rétablie — tout est synchronisé</span>
      </div>
    )
  }

  return null
}
