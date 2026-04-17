import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Page } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

export default function PagesListPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: pages, isLoading } = useQuery({
    queryKey: ['pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Page[]
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pages').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      toast.success('Página excluída!')
      setDeleteId(null)
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from('pages').update({ published }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pages'] }),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {pages?.length ?? 0} página(s) cadastrada(s)
        </p>
        <Button
          onClick={() => navigate('/paginas/nova')}
          className="bg-[#010744] hover:bg-[#010744]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Página
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : pages?.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Nenhuma página cadastrada. Clique em "Nova Página" para criar.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(pages ?? []).map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">{page.title}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      /{page.slug}
                    </TableCell>
                    <TableCell>
                      <Badge variant={page.published ? 'success' : 'outline'}>
                        {page.published ? 'Publicada' : 'Rascunho'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(page.updated_at), 'dd/MM/yy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            toggleMutation.mutate({ id: page.id, published: !page.published })
                          }
                          title={page.published ? 'Despublicar' : 'Publicar'}
                        >
                          {page.published ? (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/paginas/${page.id}`)}
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(page.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Excluir Página"
        description="Tem certeza que deseja excluir esta página? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
