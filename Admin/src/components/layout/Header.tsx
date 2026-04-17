import { useLocation, useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/configuracoes': 'Configurações do Site',
  '/banners': 'Banners',
  '/paginas': 'Páginas',
  '/depoimentos': 'Depoimentos',
  '/leads': 'Leads',
  '/corretores': 'Corretores',
  '/estatisticas': 'Estatísticas do Site',
}

export function Header() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const pageTitle = pageTitles[location.pathname] ?? 'Admin'

  const handleSignOut = async () => {
    await signOut()
    toast.success('Sessão encerrada.')
    navigate('/login')
  }

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'AD'

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-6 fixed top-0 left-64 right-0 z-30 shadow-sm">
      <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#010744] text-[#f2d22e] text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">Administrador</p>
              <p className="text-xs leading-none text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
