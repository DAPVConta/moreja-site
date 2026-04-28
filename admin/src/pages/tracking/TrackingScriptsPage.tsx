import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Code2, Plus, Trash2, Save, Edit3, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Placement = 'head' | 'body_start' | 'body_end'

interface TrackingScript {
  id: string
  name: string
  placement: Placement
  code: string
  position: number
  active: boolean
  notes: string | null
}

const PLACEMENT_LABEL: Record<Placement, string> = {
  head: '<head>',
  body_start: '<body> (início)',
  body_end: '<body> (fim)',
}

const PLACEMENT_DESCRIPTION: Record<Placement, string> = {
  head: 'Carregado primeiro. Use p/ analytics que precisa estar antes da renderização (raro).',
  body_start: 'Logo depois do <body>. Use p/ noscript de pixels concorrentes ou A/B test snippets.',
  body_end: 'Antes do </body>. Padrão p/ chat widgets, tag-managers terceiros, scripts não-críticos.',
}

const empty: Omit<TrackingScript, 'id'> = {
  name: '',
  placement: 'body_end',
  code: '',
  position: 0,
  active: true,
  notes: null,
}

export default function TrackingScriptsPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Partial<TrackingScript> | null>(null)

  const { data: scripts, isLoading } = useQuery({
    queryKey: ['tracking-scripts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracking_scripts')
        .select('*')
        .order('placement')
        .order('position')
      if (error) throw error
      return (data ?? []) as TrackingScript[]
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (s: Partial<TrackingScript>) => {
      if (!s.name?.trim() || !s.code?.trim()) {
        throw new Error('Nome e código são obrigatórios')
      }
      const payload = {
        name: s.name,
        placement: s.placement ?? 'body_end',
        code: s.code,
        position: s.position ?? 0,
        active: s.active ?? true,
        notes: s.notes ?? null,
      }
      if (s.id) {
        const { error } = await supabase
          .from('tracking_scripts')
          .update(payload)
          .eq('id', s.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('tracking_scripts').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-scripts'] })
      toast.success('Script salvo')
      setEditing(null)
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('tracking_scripts')
        .update({ active })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tracking-scripts'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tracking_scripts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-scripts'] })
      toast.success('Script removido')
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  const grouped = (scripts ?? []).reduce(
    (acc, s) => {
      acc[s.placement] = acc[s.placement] || []
      acc[s.placement].push(s)
      return acc
    },
    {} as Record<Placement, TrackingScript[]>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tracking Scripts</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Cole scripts customizados de terceiros (chat, A/B test, pixels não-padrão).
            Todos respeitam o Consent Mode v2 — pixels só disparam após o usuário
            aceitar via banner LGPD.
          </p>
        </div>
        <Button onClick={() => setEditing({ ...empty })}>
          <Plus className="w-4 h-4 mr-2" />
          Novo script
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Carregando…
          </CardContent>
        </Card>
      ) : (
        (['head', 'body_start', 'body_end'] as Placement[]).map((p) => (
          <Card key={p}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="w-5 h-5" />
                {PLACEMENT_LABEL[p]}
              </CardTitle>
              <CardDescription>{PLACEMENT_DESCRIPTION[p]}</CardDescription>
            </CardHeader>
            <CardContent>
              {(grouped[p] ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Nenhum script aqui.</p>
              ) : (
                <ul className="space-y-2">
                  {grouped[p].map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{s.name}</span>
                          {!s.active && <Badge variant="secondary">Inativo</Badge>}
                        </div>
                        {s.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {s.notes}
                          </p>
                        )}
                      </div>
                      <Switch
                        checked={s.active}
                        onCheckedChange={(active) =>
                          toggleActiveMutation.mutate({ id: s.id, active })
                        }
                      />
                      <Button size="sm" variant="ghost" onClick={() => setEditing(s)}>
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Remover "${s.name}"?`)) deleteMutation.mutate(s.id)
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
        ))
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar' : 'Novo'} script</DialogTitle>
            <DialogDescription>
              ⚠️ Scripts são injetados no HTML diretamente. Cole apenas código de
              terceiros confiáveis.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Nome</label>
                  <Input
                    value={editing.name ?? ''}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="Ex: Tawk.to chat widget"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Placement</label>
                  <Select
                    value={editing.placement ?? 'body_end'}
                    onValueChange={(v) =>
                      setEditing({ ...editing, placement: v as Placement })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="head">{PLACEMENT_LABEL.head}</SelectItem>
                      <SelectItem value="body_start">
                        {PLACEMENT_LABEL.body_start}
                      </SelectItem>
                      <SelectItem value="body_end">{PLACEMENT_LABEL.body_end}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Código</label>
                <Textarea
                  value={editing.code ?? ''}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                  placeholder="<!-- cole o snippet aqui -->"
                  rows={10}
                  className="mt-1 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Notas (opcional)</label>
                <Input
                  value={editing.notes ?? ''}
                  onChange={(e) =>
                    setEditing({ ...editing, notes: e.target.value || null })
                  }
                  placeholder="Para que serve, contexto, validade..."
                  className="mt-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editing.active ?? true}
                  onCheckedChange={(active) => setEditing({ ...editing, active })}
                />
                <span className="text-sm">
                  {editing.active ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <Eye className="w-4 h-4" /> Ativo
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-1">
                      <EyeOff className="w-4 h-4" /> Inativo
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
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
