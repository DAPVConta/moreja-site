import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'

const BRAND_LOGO_URL =
  'https://yxlepgmlhcnqhwshymup.supabase.co/storage/v1/object/public/admin/Logo/LOGO%20V%20SLICKER.png'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    const { error } = await signIn(data.email, data.password)
    if (error) {
      toast.error('Credenciais inválidas. Verifique seu e-mail e senha.')
      setLoading(false)
      return
    }
    toast.success('Bem-vindo ao painel Morejá!')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#010744] text-white p-12">
        <div className="flex items-center">
          <img
            src={BRAND_LOGO_URL}
            alt="Morejá"
            className="h-14 w-auto object-contain"
            loading="eager"
          />
        </div>

        <div className="space-y-6">
          <div className="w-16 h-1 bg-[#f2d22e] rounded-full" />
          <h1 className="text-4xl font-bold leading-tight">
            Painel de Administração
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm">
            Gerencie todo o conteúdo do Portal Morejá Imobiliária em um único lugar.
            Banners, depoimentos, leads, corretores e muito mais.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { label: 'Leads', desc: 'Gerencie contatos' },
              { label: 'Banners', desc: 'Controle visuais' },
              { label: 'Corretores', desc: 'Equipe completa' },
              { label: 'Conteúdo', desc: 'Páginas e textos' },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 rounded-xl p-4">
                <p className="font-semibold text-[#f2d22e]">{item.label}</p>
                <p className="text-white/60 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-sm">
          © {new Date().getFullYear()} Morejá Imobiliária. Todos os direitos reservados.
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center justify-center lg:hidden bg-[#010744] rounded-xl py-4 px-6 w-fit mx-auto">
            <img
              src={BRAND_LOGO_URL}
              alt="Morejá"
              className="h-10 w-auto object-contain"
              loading="eager"
            />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Entrar</h2>
            <p className="text-muted-foreground">
              Faça login para acessar o painel administrativo
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@moreja.com.br"
                  className="pl-10"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-[#010744] hover:bg-[#010744]/90 text-white"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar no painel'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
