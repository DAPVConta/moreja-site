import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Newspaper, Plus, Edit3, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
// import { Switch } from '@/components/ui/switch' // not used
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Status = 'draft' | 'published' | 'archived'

interface Post {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string | null
  cover_image: string | null
  category: string | null
  author_name: string | null
  status: Status
  published_at: string | null
  meta_title: string | null
  meta_description: string | null
  read_minutes: number | null
  views: number
  position: number
  updated_at: string
}

const STATUS_LABEL: Record<Status, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Arquivado',
}

const STATUS_VARIANT: Record<Status, 'default' | 'success' | 'secondary'> = {
  draft: 'default',
  published: 'success',
  archived: 'secondary',
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function PostsPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Partial<Post> | null>(null)

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Post[]
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (p: Partial<Post>) => {
      if (!p.title?.trim()) throw new Error('Título obrigatório')
      const slug = p.slug?.trim() || slugify(p.title)
      const payload = {
        ...p,
        slug,
        published_at:
          p.status === 'published' && !p.published_at
            ? new Date().toISOString()
            : p.published_at,
      }
      delete (payload as Partial<Post> & { updated_at?: string }).updated_at
      if (p.id) {
        const { error } = await supabase.from('posts').update(payload).eq('id', p.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('posts').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.success('Post salvo')
      setEditing(null)
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('posts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      toast.success('Post removido')
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Artigos editoriais — alimenta /blog e a seção BlogPreview na home.
          </p>
        </div>
        <Button
          onClick={() =>
            setEditing({
              title: '',
              slug: '',
              excerpt: '',
              content: '',
              status: 'draft',
              category: 'mercado',
              author_name: 'Equipe Morejá',
              read_minutes: 5,
            })
          }
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo artigo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            Artigos ({posts?.length ?? 0})
          </CardTitle>
          <CardDescription>
            Apenas artigos com status &quot;Publicado&quot; aparecem no site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (posts ?? []).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum artigo ainda. Clique em &quot;Novo artigo&quot; para começar.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(posts ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        /{p.slug}
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.category && <Badge variant="secondary">{p.category}</Badge>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[p.status]}>
                        {STATUS_LABEL[p.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(p.updated_at), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {p.status === 'published' && (
                          <a
                            href={`/blog/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-muted"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setEditing(p)}>
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Remover "${p.title}"?`)) deleteMutation.mutate(p.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Editar' : 'Novo'} artigo</DialogTitle>
            <DialogDescription>
              Markdown ou HTML (será sanitizado). Para SEO, preencha meta_title e
              meta_description.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
                <div>
                  <label className="text-sm font-medium">Título *</label>
                  <Input
                    value={editing.title ?? ''}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={editing.status ?? 'draft'}
                    onValueChange={(v) =>
                      setEditing({ ...editing, status: v as Status })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_120px] gap-3">
                <div>
                  <label className="text-sm font-medium">Slug (URL)</label>
                  <Input
                    value={editing.slug ?? ''}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    placeholder="auto-gerado"
                    className="mt-1 font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <Input
                    value={editing.category ?? ''}
                    onChange={(e) =>
                      setEditing({ ...editing, category: e.target.value })
                    }
                    placeholder="mercado, dicas..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tempo (min)</label>
                  <Input
                    type="number"
                    value={editing.read_minutes ?? 5}
                    onChange={(e) =>
                      setEditing({ ...editing, read_minutes: Number(e.target.value) })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Cover image (URL)</label>
                <Input
                  value={editing.cover_image ?? ''}
                  onChange={(e) =>
                    setEditing({ ...editing, cover_image: e.target.value || null })
                  }
                  placeholder="https://…"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Excerpt (resumo)</label>
                <Textarea
                  value={editing.excerpt ?? ''}
                  onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                  rows={2}
                  placeholder="Aparece no preview da home"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Conteúdo (Markdown ou HTML)</label>
                <Textarea
                  value={editing.content ?? ''}
                  onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  rows={12}
                  className="mt-1 font-mono text-sm"
                />
              </div>

              <details className="group">
                <summary className="cursor-pointer text-sm font-medium">SEO</summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="text-sm font-medium">Meta title</label>
                    <Input
                      value={editing.meta_title ?? ''}
                      onChange={(e) =>
                        setEditing({ ...editing, meta_title: e.target.value || null })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Meta description</label>
                    <Textarea
                      value={editing.meta_description ?? ''}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          meta_description: e.target.value || null,
                        })
                      }
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </div>
              </details>
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
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
