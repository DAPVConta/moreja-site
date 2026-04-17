import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { SiteStat } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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

interface EditRow {
  id: string
  key: string
  value: string
  label: string
  icon: string
  sort_order: number
}

const emptyRow = (): EditRow => ({
  id: '',
  key: '',
  value: '',
  label: '',
  icon: '',
  sort_order: 0,
})

export default function StatsPage() {
  const queryClient = useQueryClient()
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<EditRow>(emptyRow())
  const [newRow, setNewRow] = useState<EditRow | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: stats, isLoading } = useQuery({
    queryKey: ['site_stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_stats')
        .select('*')
        .order('sort_order')
      if (error) throw error
      return (data ?? []) as SiteStat[]
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (row: EditRow) => {
      const payload = {
        key: row.key,
        value: row.value,
        label: row.label,
        icon: row.icon || null,
        sort_order: row.sort_order,
      }
      if (row.id) {
        const { error } = await supabase.from('site_stats').update(payload).eq('id', row.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('site_stats').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_stats'] })
      toast.success('Estatística salva!')
      setEditId(null)
      setNewRow(null)
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('site_stats').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_stats'] })
      toast.success('Estatística excluída!')
      setDeleteId(null)
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  const handleEdit = (stat: SiteStat) => {
    setEditId(stat.id)
    setEditData({
      id: stat.id,
      key: stat.key,
      value: stat.value,
      label: stat.label,
      icon: stat.icon ?? '',
      sort_order: stat.sort_order,
    })
  }

  const handleSave = (row: EditRow) => {
    updateMutation.mutate(row)
  }

  const handleCancel = () => {
    setEditId(null)
    setNewRow(null)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas do Site</CardTitle>
          <CardDescription>
            Números exibidos na seção de estatísticas do portal (ex: anos de experiência, imóveis vendidos, clientes).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chave</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Rótulo</TableHead>
                    <TableHead>Ícone</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stats ?? []).map((stat) =>
                    editId === stat.id ? (
                      <EditableRow
                        key={stat.id}
                        row={editData}
                        onChange={setEditData}
                        onSave={() => handleSave(editData)}
                        onCancel={handleCancel}
                        loading={updateMutation.isPending}
                      />
                    ) : (
                      <TableRow key={stat.id}>
                        <TableCell className="font-mono text-sm">{stat.key}</TableCell>
                        <TableCell className="font-bold text-[#010744]">{stat.value}</TableCell>
                        <TableCell>{stat.label}</TableCell>
                        <TableCell className="text-muted-foreground">{stat.icon ?? '—'}</TableCell>
                        <TableCell>{stat.sort_order}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(stat)}
                            >
                              <Pencil className="w-4 h-4 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(stat.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  )}

                  {newRow && (
                    <EditableRow
                      row={newRow}
                      onChange={setNewRow}
                      onSave={() => handleSave(newRow)}
                      onCancel={handleCancel}
                      loading={updateMutation.isPending}
                    />
                  )}

                  {(stats ?? []).length === 0 && !newRow && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhuma estatística cadastrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditId(null)
                    setNewRow(emptyRow())
                  }}
                  disabled={!!newRow}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Estatística
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Excluir Estatística"
        description="Tem certeza que deseja excluir esta estatística?"
        confirmLabel="Excluir"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

interface EditableRowProps {
  row: EditRow
  onChange: (row: EditRow) => void
  onSave: () => void
  onCancel: () => void
  loading: boolean
}

function EditableRow({ row, onChange, onSave, onCancel, loading }: EditableRowProps) {
  const set = (field: keyof EditRow) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...row, [field]: field === 'sort_order' ? Number(e.target.value) : e.target.value })

  return (
    <TableRow className="bg-muted/30">
      <TableCell>
        <Input
          value={row.key}
          onChange={set('key')}
          placeholder="ex: anos_experiencia"
          className="h-8 text-sm"
        />
      </TableCell>
      <TableCell>
        <Input
          value={row.value}
          onChange={set('value')}
          placeholder="ex: 20+"
          className="h-8 text-sm"
        />
      </TableCell>
      <TableCell>
        <Input
          value={row.label}
          onChange={set('label')}
          placeholder="ex: Anos de Experiência"
          className="h-8 text-sm"
        />
      </TableCell>
      <TableCell>
        <Input
          value={row.icon}
          onChange={set('icon')}
          placeholder="ex: Trophy"
          className="h-8 text-sm"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={row.sort_order}
          onChange={set('sort_order')}
          className="h-8 text-sm w-20"
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            size="icon"
            className="h-8 w-8 bg-[#010744] hover:bg-[#010744]/90 text-white"
            onClick={onSave}
            disabled={loading}
          >
            <Save className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onCancel}
            disabled={loading}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
