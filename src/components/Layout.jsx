import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../lib/useAuth'
import Sidebar from './Sidebar'
import { Menu, Bell, X } from 'lucide-react'
import OfflineBanner from './OfflineBanner'
import { supabase } from '../lib/supabase'

function NotifBell({ notifs, notifOpen, setNotifOpen, notifRef, navigate }) {
  const urgentCount = notifs.filter((n) => n.urgent).length
  const total = notifs.length

  return (
    <div className="relative" ref={notifRef}>
      <button
        onClick={() => setNotifOpen((v) => !v)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
      >
        <Bell size={20} />
        {total > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1 ${urgentCount > 0 ? 'bg-red-500' : 'bg-blue-500'}`}>
            {total}
          </span>
        )}
      </button>

      {notifOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
            <button onClick={() => setNotifOpen(false)} className="p-1 hover:bg-gray-100 rounded">
              <X size={14} />
            </button>
          </div>

          {notifs.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">
              Aucune notification
            </div>
          ) : (
            <div className="divide-y">
              {notifs.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    navigate(n.link)
                    setNotifOpen(false)
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${n.urgent ? 'bg-red-500' : 'bg-blue-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800 truncate">{n.text}</p>
                      {n.sub && <p className="text-xs text-gray-500 mt-0.5">{n.sub}</p>}
                      <span className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${n.urgent ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {n.label}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Layout({ children }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)

  // Charger les notifications (rappels du jour/en retard + devis urgents)
  useEffect(() => {
    if (!user) return
    const loadNotifs = async () => {
      const today = new Date().toISOString().slice(0, 10)
      const [rappelsRes, devisRes] = await Promise.all([
        supabase
          .from('rappels')
          .select('id, commentaire, date_rappel, clients(nom, prenom)')
          .eq('user_id', user.id)
          .eq('fait', false)
          .lte('date_rappel', today)
          .order('date_rappel'),
        supabase
          .from('devis')
          .select('id, numero, titre, date_envoi, statut')
          .eq('user_id', user.id)
          .in('statut', ['envoyé', 'relancé']),
      ])

      const items = []

      // Rappels
      ;(rappelsRes.data || []).forEach((r) => {
        const retard = r.date_rappel < today
        items.push({
          id: `rappel-${r.id}`,
          type: 'rappel',
          text: r.commentaire,
          sub: r.clients ? `${r.clients.prenom || ''} ${r.clients.nom}`.trim() : null,
          urgent: retard,
          label: retard ? 'En retard' : "Aujourd'hui",
          link: '/rappels',
        })
      })

      // Devis sans reponse > 3 jours
      ;(devisRes.data || []).filter((d) => {
        if (!d.date_envoi) return false
        const jours = Math.floor((Date.now() - new Date(d.date_envoi).getTime()) / 86400000)
        return jours >= 3
      }).forEach((d) => {
        items.push({
          id: `devis-${d.id}`,
          type: 'devis',
          text: `${d.numero} — ${d.titre}`,
          sub: 'Sans reponse depuis +3 jours',
          urgent: true,
          label: 'A relancer',
          link: '/devis',
        })
      })

      setNotifs(items)
    }

    loadNotifs()
    // Refresh toutes les 60s
    const interval = setInterval(loadNotifs, 60000)
    return () => clearInterval(interval)
  }, [user])

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">Chargement...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64">
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <main className="flex-1 min-w-0">
        <OfflineBanner />
        {/* Header mobile */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-bold text-primary-600">PlombierPro</h1>
          </div>
          <NotifBell notifs={notifs} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifRef={notifRef} navigate={navigate} />
        </div>

        {/* Header desktop — cloche en haut a droite */}
        <div className="hidden md:flex justify-end p-4 pb-0">
          <NotifBell notifs={notifs} notifOpen={notifOpen} setNotifOpen={setNotifOpen} notifRef={notifRef} navigate={navigate} />
        </div>

        <div className="p-4 md:px-8 md:pb-8 md:pt-2">
          {children}
        </div>
      </main>
    </div>
  )
}
