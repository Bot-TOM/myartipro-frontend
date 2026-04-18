import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LayoutDashboard, FileText, Users, LogOut, Receipt, Bell, UserCog } from 'lucide-react'

const links = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/devis', label: 'Devis', icon: FileText },
  { to: '/factures', label: 'Factures', icon: Receipt },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/rappels', label: 'Rappels', icon: Bell },
  { to: '/profil', label: 'Mon profil', icon: UserCog },
]

export default function Sidebar({ onNavigate }) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleClick = () => {
    if (onNavigate) onNavigate()
  }

  return (
    <aside className="w-64 bg-white border-r min-h-screen flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-primary-600">MyArtipro</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={handleClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t space-y-1">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 w-full transition"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
        <NavLink
          to="/mentions-legales"
          onClick={handleClick}
          className="block px-4 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
        >
          Mentions légales
        </NavLink>
      </div>
    </aside>
  )
}
