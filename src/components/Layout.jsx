import { useState, useEffect, useRef } from 'react'
import { useNavigate, NavLink, useLocation } from 'react-router-dom'
import useAuth from '../lib/useAuth'
import Sidebar from './Sidebar'
import { Bell, X, LayoutDashboard, FileText, Receipt, UserCog } from 'lucide-react'
import OfflineBanner from './OfflineBanner'
import { supabase } from '../lib/supabase'

const tabs = [
  { to: '/',         label: 'Accueil',  icon: LayoutDashboard, end: true },
  { to: '/devis',    label: 'Devis',    icon: FileText },
  { to: '/factures', label: 'Factures', icon: Receipt },
  { to: '/rappels',  label: 'Rappels',  icon: Bell },
  { to: '/profil',   label: 'Profil',   icon: UserCog },
]

function NotifDropdown({ notifs, notifOpen, setNotifOpen, notifRef, navigate }) {
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
                  onClick={() => { navigate(n.link); setNotifOpen(false) }}
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
  const location = useLocation()
  const [notifs, setNotifs] = useState([])
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)

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
      ;(rappelsRes.data || []).forEach((r) => {
        const retard = r.date_rappel < today
        items.push({
          id: `rappel-${r.id}`,
          text: r.commentaire,
          sub: r.clients ? `${r.clients.prenom || ''} ${r.clients.nom}`.trim() : null,
          urgent: retard,
          label: retard ? 'En retard' : "Aujourd'hui",
          link: '/rappels',
        })
      })
      ;(devisRes.data || []).filter((d) => {
        if (!d.date_envoi) return false
        return Math.floor((Date.now() - new Date(d.date_envoi).getTime()) / 86400000) >= 3
      }).forEach((d) => {
        items.push({
          id: `devis-${d.id}`,
          text: `${d.numero} — ${d.titre}`,
          sub: 'Sans réponse depuis +3 jours',
          urgent: true,
          label: 'À relancer',
          link: '/devis',
        })
      })

      setNotifs(items)
    }

    loadNotifs()
    const interval = setInterval(loadNotifs, 60000)
    return () => clearInterval(interval)
  }, [user])

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
      <div className="min-h-screen flex items-center justify-center bg-[#EFF2F8]">
        <p className="text-slate-400">Chargement...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-[#EFF2F8]">
      {/* Sidebar desktop uniquement */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Contenu principal */}
      <main className="flex-1 min-w-0">
        <OfflineBanner />

        {/* Header desktop — cloche en haut à droite */}
        <div className="hidden md:flex justify-end p-4 pb-0">
          <NotifDropdown
            notifs={notifs}
            notifOpen={notifOpen}
            setNotifOpen={setNotifOpen}
            notifRef={notifRef}
            navigate={navigate}
          />
        </div>

        <div className="main-content p-4 md:px-8 md:pb-8 md:pt-2">
          {children}
        </div>
      </main>

      {/* Bottom tab bar — mobile uniquement */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-slate-200 bg-white/95 backdrop-blur-sm pb-safe pt-1.5 md:hidden"
           style={{ paddingBottom: 'max(1.75rem, env(safe-area-inset-bottom))' }}>
        {tabs.map(({ to, label, icon: Icon, end }) => {
          const isActive = end
            ? location.pathname === to
            : location.pathname === to || location.pathname.startsWith(to + '/')
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="flex flex-1 flex-col items-center gap-0.5 py-1"
            >
              <Icon size={22} className={isActive ? 'text-primary-600' : 'text-slate-400'} />
              <span className={`text-[10px] ${isActive ? 'font-bold text-primary-600' : 'font-normal text-slate-400'}`}>
                {label}
              </span>
              {isActive && <div className="h-1 w-1 rounded-full bg-primary-600 -mt-0.5" />}
            </NavLink>
          )
        })}
      </div>
    </div>
  )
}
