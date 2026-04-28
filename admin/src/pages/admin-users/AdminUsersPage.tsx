import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, Trash2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type Role = 'owner' | 'admin' | 'editor' | 'viewer'

interface AdminUser {
  user_id: string
  role: Role
  full_name: string | null
  created_at: string
  email?: string // joined view
}

const ROLE_LABEL: Record<Role, string> = {
  owner: 'Proprietário',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Leitor',
}

const ROLE_VARIANT: Record<Role, 'default' | 'success' | 'warning' | 'secondary'> = {
  owner: 'success',
  admin: 'default',
  editor: 'warning',
  viewer: 'secondary',
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('admin')

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id, role, full_name, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as AdminUser[]
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: Role }) => {
      const { error } = await supabase.from('admin_users').update({ role }).eq('user_id', user_id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Role atualizada')
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  const removeMutation = useMutation({
    mutationFn: async (user_id: string) => {
      const { error } = await supabase.from('admin_users').delete().eq('user_id', user_id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Acesso removido')
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  const inviteMutation = useMutation({
    mutationFn: async () => {
      // Inviting requires service_role privileges. Best path: run via SQL Editor:
      //   INSERT INTO admin_users (user_id, role) SELECT id, '<role>' FROM auth.users WHERE email = '<email>'
      // From client we surface a copy-paste snippet.
      throw new Error(
        'Convite por UI requer Service Role. Cole no SQL Editor:\n\n' +
        `INSERT INTO admin_users (user_id, role) SELECT id, '${role}' FROM auth.users WHERE email = '${email}' ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;`
      )
    },
    onError: (err: Error) => {
      toast.error(err.message, { duration: 12000 })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuários do Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Quem tem acesso ao painel e qual nível de permissão.
          </p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Convidar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar usuário</DialogTitle>
              <DialogDescription>
                O usuário precisa já ter conta no Supabase Auth. Após o convite,
                copie e cole o snippet SQL gerado no SQL Editor com role
                privilegiada.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">E-mail do usuário</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@exemplo.com"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['owner', 'admin', 'editor', 'viewer'] as Role[]).map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => inviteMutation.mutate()} disabled={!email}>
                Gerar SQL
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Lista de admins
          </CardTitle>
          <CardDescription>
            Usuários com acesso de escrita às tabelas do CMS. RLS aplicada via
            função is_admin() (lê desta tabela).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users ?? []).map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-mono text-xs">
                      {u.user_id.slice(0, 8)}…
                    </TableCell>
                    <TableCell>{u.full_name ?? '—'}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(v) =>
                          updateRoleMutation.mutate({ user_id: u.user_id, role: v as Role })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue>
                            <Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(['owner', 'admin', 'editor', 'viewer'] as Role[]).map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABEL[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm('Remover acesso deste usuário?')) {
                            removeMutation.mutate(u.user_id)
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(users ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum usuário admin cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
