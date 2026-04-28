import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calculator, Phone, Mail, MapPin, Maximize2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
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

type Status = 'new' | 'contacted' | 'scheduled' | 'done' | 'rejected'

interface ValuationRequest {
  id: string
  name: string
  email: string
  phone: string | null
  tipo: string | null
  finalidade: string | null
  bairro: string | null
  cidade: string | null
  area_total: number | null
  dormitorios: number | null
  banheiros: number | null
  vagas: number | null
  estimated_value: number | null
  status: Status
  notes: string | null
  utm_source: string | null
  consent_lgpd: boolean
  created_at: string
  updated_at: string
}

const STATUS_LABEL: Record<Status, string> = {
  new: 'Novo',
  contacted: 'Contatado',
  scheduled: 'Agendado',
  done: 'Concluído',
  rejected: 'Rejeitado',
}

const STATUS_VARIANT: Record<Status, 'default' | 'success' | 'warning' | 'secondary' | 'destructive'> = {
  new: 'default',
  contacted: 'warning',
  scheduled: 'warning',
  done: 'success',
  rejected: 'destructive',
}

export default function ValuationRequestsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: requests, isLoading } = useQuery({
    queryKey: ['valuation-requests', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('valuation_requests')
        .select('*')
        .order('created_at', { ascending: false })
      if (statusFilter !== 'all') query = query.eq('status', statusFilter)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as ValuationRequest[]
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase
        .from('valuation_requests')
        .update({ status })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['valuation-requests'] })
      toast.success('Status atualizado')
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Avaliações solicitadas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Proprietários que pediram uma avaliação gratuita do imóvel via /avaliar.
          </p>
        </div>
        <div className="min-w-[180px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            {requests?.length ?? 0} solicitação(ões)
          </CardTitle>
          <CardDescription>
            Cada card representa um lead de proprietário. Atualize o status conforme
            o follow-up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (requests ?? []).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma solicitação ainda.
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(requests ?? []).map((r) => (
                <div key={r.id} className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{r.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(r.created_at), "d MMM 'às' HH:mm", { locale: ptBR })}
                        {r.utm_source && ` · via ${r.utm_source}`}
                      </p>
                    </div>
                    <Select
                      value={r.status}
                      onValueChange={(v) =>
                        updateStatusMutation.mutate({ id: r.id, status: v as Status })
                      }
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue>
                          <Badge variant={STATUS_VARIANT[r.status]}>
                            {STATUS_LABEL[r.status]}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm">
                    <a
                      href={`mailto:${r.email}`}
                      className="flex items-center gap-1.5 text-primary hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" /> {r.email}
                    </a>
                    {r.phone && (
                      <a
                        href={`tel:${r.phone.replace(/\D/g, '')}`}
                        className="flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" /> {r.phone}
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {r.tipo && <Badge variant="secondary">{r.tipo}</Badge>}
                    {r.finalidade && <Badge variant="outline">{r.finalidade}</Badge>}
                    {(r.bairro || r.cidade) && (
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="w-3 h-3" />
                        {[r.bairro, r.cidade].filter(Boolean).join(', ')}
                      </Badge>
                    )}
                    {r.area_total && (
                      <Badge variant="outline" className="gap-1">
                        <Maximize2 className="w-3 h-3" />
                        {r.area_total} m²
                      </Badge>
                    )}
                    {r.dormitorios && (
                      <Badge variant="outline">{r.dormitorios} dorms</Badge>
                    )}
                  </div>

                  {r.notes && (
                    <p className="text-sm text-muted-foreground italic border-l-2 border-muted pl-3">
                      &quot;{r.notes}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
