import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Download, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Lead } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

const statusConfig = {
  new: { label: 'Novo', variant: 'default' as const },
  contacted: { label: 'Contatado', variant: 'warning' as const },
  qualified: { label: 'Qualificado', variant: 'success' as const },
  closed: { label: 'Fechado', variant: 'secondary' as const },
}

type LeadStatus = keyof typeof statusConfig

export default function LeadsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Lead[]
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const { error } = await supabase.from('leads').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Status atualizado!')
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  const sources = useMemo(() => {
    const set = new Set<string>()
    ;(leads ?? []).forEach((l) => {
      if (l.source) set.add(l.source)
    })
    return Array.from(set)
  }, [leads])

  const filtered = useMemo(() => {
    return (leads ?? []).filter((l) => {
      const matchSearch =
        !search ||
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.email.toLowerCase().includes(search.toLowerCase()) ||
        (l.phone ?? '').includes(search)
      const matchStatus = statusFilter === 'all' || l.status === statusFilter
      const matchSource = sourceFilter === 'all' || l.source === sourceFilter
      return matchSearch && matchStatus && matchSource
    })
  }, [leads, search, statusFilter, sourceFilter])

  const exportCSV = () => {
    const rows = [
      ['Nome', 'Email', 'Telefone', 'Imóvel', 'Fonte', 'Status', 'Data'],
      ...filtered.map((l) => [
        l.name,
        l.email,
        l.phone ?? '',
        l.property_title ?? '',
        l.source ?? '',
        statusConfig[l.status]?.label ?? l.status,
        format(new Date(l.created_at), 'dd/MM/yyyy HH:mm'),
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `leads_${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exportado!')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">
          {filtered.length} lead(s) encontrado(s)
        </p>
        <Button
          variant="outline"
          onClick={exportCSV}
          disabled={filtered.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Fonte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as fontes</SelectItem>
                {sources.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Imóvel</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-10"
                    >
                      Nenhum lead encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((lead) => {
                    const sc = statusConfig[lead.status] ?? statusConfig.new
                    return (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {lead.email}
                        </TableCell>
                        <TableCell>{lead.phone ?? '—'}</TableCell>
                        <TableCell className="max-w-[160px] truncate">
                          {lead.property_title ?? '—'}
                        </TableCell>
                        <TableCell>
                          {lead.source ? (
                            <Badge variant="outline" className="text-xs">
                              {lead.source}
                            </Badge>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={lead.status}
                            onValueChange={(v) =>
                              updateStatusMutation.mutate({
                                id: lead.id,
                                status: v as LeadStatus,
                              })
                            }
                          >
                            <SelectTrigger className="h-7 w-32 text-xs">
                              <Badge variant={sc.variant}>{sc.label}</Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(([k, v]) => (
                                <SelectItem key={k} value={k} className="text-xs">
                                  {v.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {format(new Date(lead.created_at), 'dd/MM/yy HH:mm')}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
