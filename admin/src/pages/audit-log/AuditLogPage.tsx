import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Activity, Database, ChevronDown, ChevronRight } from 'lucide-react'
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

interface AuditEntry {
  id: number
  actor_id: string | null
  actor_email: string | null
  actor_role: string | null
  table_name: string
  record_id: string | null
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  diff: Record<string, unknown> | null
  ip: string | null
  user_agent: string | null
  created_at: string
}

const ACTION_VARIANT: Record<string, 'success' | 'warning' | 'destructive'> = {
  INSERT: 'success',
  UPDATE: 'warning',
  DELETE: 'destructive',
}

export default function AuditLogPage() {
  const [tableFilter, setTableFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { data: entries, isLoading } = useQuery({
    queryKey: ['audit-log', tableFilter, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)
      if (tableFilter !== 'all') query = query.eq('table_name', tableFilter)
      if (actionFilter !== 'all') query = query.eq('action', actionFilter)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as AuditEntry[]
    },
  })

  // Distinct table names p/ filter
  const tables = Array.from(
    new Set((entries ?? []).map((e) => e.table_name))
  ).sort()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auditoria</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Histórico de mudanças nas tabelas do CMS. Últimos 200 eventos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Filtros
          </CardTitle>
          <CardDescription>Filtre por tabela ou tipo de ação.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <div className="min-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1 block">Tabela</label>
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {tables.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1 block">Ação</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="INSERT">Inserir</SelectItem>
                  <SelectItem value="UPDATE">Atualizar</SelectItem>
                  <SelectItem value="DELETE">Deletar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Eventos recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (entries ?? []).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum evento de auditoria encontrado.
            </p>
          ) : (
            <ul className="space-y-2">
              {(entries ?? []).map((e) => (
                <li key={e.id} className="rounded-lg border bg-card">
                  <button
                    onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    {expandedId === e.id ? (
                      <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                    )}
                    <Badge variant={ACTION_VARIANT[e.action] ?? 'default'}>{e.action}</Badge>
                    <span className="font-mono text-sm">{e.table_name}</span>
                    <span className="font-mono text-xs text-muted-foreground hidden md:inline">
                      {e.record_id ?? '—'}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {format(new Date(e.created_at), "d 'de' MMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </button>
                  {expandedId === e.id && (
                    <div className="border-t px-4 py-3 bg-muted/20 space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Ator:</span>{' '}
                          {e.actor_email ?? e.actor_id?.slice(0, 8) ?? '—'}
                          {e.actor_role && (
                            <Badge variant="secondary" className="ml-2">
                              {e.actor_role}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <span className="text-muted-foreground">IP:</span>{' '}
                          {e.ip ?? '—'}
                        </div>
                      </div>
                      {e.diff && (
                        <pre className="text-xs bg-background border rounded p-3 overflow-x-auto max-h-64">
                          {JSON.stringify(e.diff, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
