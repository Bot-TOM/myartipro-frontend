import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LayoutDashboard, FileText, Users, LogOut, Receipt, Bell, UserCog } from 'lucide-react'
import useProfil from '../lib/useProfil'

const links = [
  { to: '/',         label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/devis',    label: 'Devis',           icon: FileText },
  { to: '/factures', label: 'Factures',        icon: Receipt },
  { to: '/clients',  label: 'Clients',         icon: Users },
  { to: '/rappels',  label: 'Rappels',         icon: Bell },
  { to: '/profil',   label: 'Mon profil',      icon: UserCog },
]

export default function Sidebar({ onNavigate }) {
  const navigate = useNavigate()
  const { profil } = useProfil()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleClick = () => {
    if (onNavigate) onNavigate()
  }

  const entreprise = profil?.entreprise || `${profil?.prenom || ''} ${profil?.nom || ''}`.trim() || 'Mon entreprise'

  return (
    <aside className="w-64 bg-white border-r min-h-screen flex flex-col">
      <div className="px-6 py-5 border-b">
        <h1 className="text-xl font-extrabold text-primary-600 tracking-tight">MyArtipro</h1>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{entreprise}</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={handleClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-50'
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
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 w-full transition"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 px-4 py-1">
          {[
            { to: '/mentions-legales', label: 'Mentions légales' },
            { to: '/politique-confidentialite', label: 'Confidentialité' },
            { to: '/conditions-utilisation', label: 'CGU' },
            { to: '/conformite', label: 'Conformité TVA' },
          ].map(({ to, label }) => (
            <NavLink key={to} to={to} onClick={handleClick}
              className="text-xs text-slate-400 hover:text-slate-600 transition">
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </aside>
  )
}
