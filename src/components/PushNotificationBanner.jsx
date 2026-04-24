import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import usePushNotifications from '../lib/usePushNotifications'
import toast from 'react-hot-toast'

const DISMISSED_KEY = 'push_banner_dismissed'

export default function PushNotificationBanner() {
  const { supported, permission, subscribed, subscribe } = usePushNotifications()
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(DISMISSED_KEY))
  const [loading, setLoading] = useState(false)

  // Ne pas afficher si : pas supporté, déjà souscrit, déjà refusé par le browser, ou ignoré
  if (!supported || subscribed || permission === 'denied' || dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  const handleEnable = async () => {
    setLoading(true)
    const ok = await subscribe()
    setLoading(false)
    if (ok) toast.success('Notifications activées')
    else handleDismiss()
  }

  return (
    <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 mb-5 flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bell size={16} className="text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900">Activer les notifications</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          Soyez alerté quand un devis est accepté, une facture payée ou qu'un rappel est dû. Désactivable à tout moment.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleEnable}
            disabled={loading}
            className="text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Activation...' : 'Activer'}
          </button>
          <button
            onClick={handleDismiss}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg transition"
          >
            Plus tard
          </button>
        </div>
      </div>
      <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
        <X size={16} />
      </button>
    </div>
  )
}
