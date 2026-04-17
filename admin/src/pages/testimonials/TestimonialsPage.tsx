import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Star } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Testimonial } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TestimonialForm } from './TestimonialForm'

export default function TestimonialsPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<Testimonial | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Testimonial[]
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('testimonials').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] })
      toast.success('Depoimento excluído!')
      setDeleteId(null)
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('testimonials').update({ active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['testimonials'] }),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  const handleEdit = (item: Testimonial) => {
    setEditItem(item)
    setFormOpen(true)
  }

  const handleNew = () => {
    setEditItem(null)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {testimonials?.length ?? 0} depoimento(s) cadastrado(s)
        </p>
        <Button
          onClick={handleNew}
          className="bg-[#010744] hover:bg-[#010744]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Depoimento
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : testimonials?.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Nenhum depoimento cadastrado. Clique em "Novo Depoimento" para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {(testimonials ?? []).map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12 shrink-0">
                    {item.photo_url ? (
                      <AvatarImage src={item.photo_url} alt={item.name} />
                    ) : null}
                    <AvatarFallback className="bg-[#010744] text-[#f2d22e] font-bold">
                      {item.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{item.name}</p>
                      {item.role && (
                        <span className="text-xs text-muted-foreground">· {item.role}</span>
                      )}
                      <Badge variant={item.active ? 'success' : 'outline'} className="text-xs">
                        {item.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < item.rating
                              ? 'fill-[#f2d22e] text-[#f2d22e]'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      "{item.text}"
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={item.active}
                      onCheckedChange={(active) =>
                        toggleMutation.mutate({ id: item.id, active })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TestimonialForm
        open={formOpen}
        onOpenChange={setFormOpen}
        testimonial={editItem}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Excluir Depoimento"
        description="Tem certeza que deseja excluir este depoimento?"
        confirmLabel="Excluir"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
