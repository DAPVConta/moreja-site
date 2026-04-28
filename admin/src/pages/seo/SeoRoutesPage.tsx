import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Globe, Save, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SeoRoute {
  route: string
  title: string | null
  description: string | null
  og_image: string | null
  og_description: string | null
  canonical_url: string | null
  robots: string | null
  notes: string | null
}

export default function SeoRoutesPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Partial<SeoRoute> | null>(null)
  const [creating, setCreating] = useState(false)

  const { data: routes, isLoading } = useQuery({
    queryKey: ['seo-routes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('seo_routes').select('*').order('route')
      if (error) throw error
      return (data ?? []) as SeoRoute[]
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (r: Partial<SeoRoute>) => {
      if (!r.route?.trim()) throw new Error('Route obrigatória')
      const payload = {
        route: r.route,
        title: r.title || null,
        description: r.description || null,
        og_image: r.og_image || null,
        og_description: r.og_description || null,
        canonical_url: r.canonical_url || null,
        robots: r.robots || 'index,follow',
        notes: r.notes || null,
      }
      const { error } = await supabase.from('seo_routes').upsert(payload, { onConflict: 'route' })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-routes'] })
      toast.success('Rota salva')
      setEditing(null)
      setCreating(false)
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  const deleteMutation = useMutation({
    mutationFn: async (route: string) => {
      const { error } = await supabase.from('seo_routes').delete().eq('route', route)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-routes'] })
      toast.success('Rota removida')
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SEO por rota</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Override de title/description/OG por URL, lido pelo Next.js
            generateMetadata. Use &quot;:param&quot; para rotas dinâmicas (ex:
            /imovel/:id).
          </p>
        </div>
        <Button
          onClick={() => {
            setCreating(true)
            setEditing({ route: '', robots: 'index,follow' })
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova rota
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Rotas configuradas ({routes?.length ?? 0})
          </CardTitle>
          <CardDescription>
            Rotas pré-cadastradas: /, /comprar, /alugar, /empreendimentos, /sobre, /contato.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <ul className="space-y-2">
              {(routes ?? []).map((r) => (
                <li
                  key={r.route}
                  className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-medium">{r.route}</p>
                    {r.title && (
                      <p className="text-sm text-muted-foreground truncate">{r.title}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{r.robots}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCreating(false)
                      setEditing(r)
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Remover ${r.route}?`)) deleteMutation.mutate(r.route)
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null)
            setCreating(false)
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{creating ? 'Nova rota' : 'Editar rota'}</DialogTitle>
            <DialogDescription>
              Os campos vazios usam o default (geralmente meta_title do site_config).
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Route</label>
                <Input
                  value={editing.route ?? ''}
                  onChange={(e) => setEditing({ ...editing, route: e.target.value })}
                  placeholder="/comprar"
                  disabled={!creating}
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editing.title ?? ''}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editing.description ?? ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">OG image (URL)</label>
                  <Input
                    value={editing.og_image ?? ''}
                    onChange={(e) =>
                      setEditing({ ...editing, og_image: e.target.value })
                    }
                    placeholder="https://…"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Robots</label>
                  <Select
                    value={editing.robots ?? 'index,follow'}
                    onValueChange={(v) => setEditing({ ...editing, robots: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="index,follow">index,follow (default)</SelectItem>
                      <SelectItem value="noindex,follow">noindex,follow</SelectItem>
                      <SelectItem value="noindex,nofollow">noindex,nofollow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Canonical URL (override)</label>
                <Input
                  value={editing.canonical_url ?? ''}
                  onChange={(e) =>
                    setEditing({ ...editing, canonical_url: e.target.value })
                  }
                  placeholder="https://moreja.com.br/…"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notas internas</label>
                <Input
                  value={editing.notes ?? ''}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditing(null)
                setCreating(false)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => editing && saveMutation.mutate(editing)}
              disabled={saveMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
