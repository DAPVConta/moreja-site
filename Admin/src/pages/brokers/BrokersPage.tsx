import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Broker } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { BrokerForm } from './BrokerForm'

export default function BrokersPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<Broker | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: brokers, isLoading } = useQuery({
    queryKey: ['brokers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brokers')
        .select('*')
        .order('sort_order')
        .order('name')
      if (error) throw error
      return (data ?? []) as Broker[]
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('brokers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] })
      toast.success('Corretor excluído!')
      setDeleteId(null)
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('brokers').update({ active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brokers'] }),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  const handleEdit = (item: Broker) => {
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
          {brokers?.length ?? 0} corretor(es) cadastrado(s)
        </p>
        <Button
          onClick={handleNew}
          className="bg-[#010744] hover:bg-[#010744]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Corretor
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : brokers?.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Nenhum corretor cadastrado. Clique em "Novo Corretor" para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {(brokers ?? []).map((broker) => (
            <Card key={broker.id} className={!broker.active ? 'opacity-60' : ''}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-14 h-14">
                      {broker.photo_url ? (
                        <AvatarImage src={broker.photo_url} alt={broker.name} />
                      ) : null}
                      <AvatarFallback className="bg-[#010744] text-[#f2d22e] font-bold text-lg">
                        {broker.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold leading-tight">{broker.name}</p>
                      {broker.creci && (
                        <p className="text-xs text-muted-foreground">
                          CRECI {broker.creci}
                        </p>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={broker.active}
                    onCheckedChange={(active) =>
                      toggleMutation.mutate({ id: broker.id, active })
                    }
                  />
                </div>

                {broker.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {broker.bio}
                  </p>
                )}

                {broker.specialties && broker.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {broker.specialties.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="space-y-1 text-sm text-muted-foreground">
                  {broker.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{broker.phone}</span>
                    </div>
                  )}
                  {broker.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{broker.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(broker)}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(broker.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BrokerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        broker={editItem}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Excluir Corretor"
        description="Tem certeza que deseja excluir este corretor? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
