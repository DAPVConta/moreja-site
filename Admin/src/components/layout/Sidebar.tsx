import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Settings,
  Image,
  FileText,
  MessageSquare,
  Users,
  UserCheck,
  BarChart2,
  LogOut,
  LayoutGrid,
} from 'lucide-react'

const BRAND_LOGO_URL =
  'https://yxlepgmlhcnqhwshymup.supabase.co/storage/v1/object/public/admin/Logo/LOGO%20V%20SLICKER.png'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/configuracoes', label: 'Config. do Site', icon: Settings },
  { to: '/layout-home', label: 'Layout da Home', icon: LayoutGrid },
  { to: '/banners', label: 'Banners', icon: Image },
  { to: '/paginas', label: 'Páginas', icon: FileText },
  { to: '/depoimentos', label: 'Depoimentos', icon: MessageSquare },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/corretores', label: 'Corretores', icon: UserCheck },
  { to: '/estatisticas', label: 'Estatísticas', icon: BarChart2 },
]

export function Sidebar() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    toast.success('Sessão encerrada.')
    navigate('/login')
  }

  return (
    <aside className="flex flex-col h-screen w-64 bg-[#010744] text-white fixed left-0 top-0 z-40 shadow-xl">
      {/* Logo */}
      <div className="flex flex-col items-center gap-2 px-6 py-6 border-b border-white/10">
        <img
          src={BRAND_LOGO_URL}
          alt="Morejá"
          className="h-12 w-auto object-contain"
          loading="eager"
        />
        <p className="text-white/50 text-[10px] uppercase tracking-widest">
          Painel Admin
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-[#f2d22e] text-[#010744] shadow-sm'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer / Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white transition-all duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
