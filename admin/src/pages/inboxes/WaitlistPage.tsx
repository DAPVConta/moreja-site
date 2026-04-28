import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bell, Mail, Phone, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

interface WaitlistEntry {
  id: string
  email: string
  phone: string | null
  name: string | null
  lancamento_id: string | null
  utm_source: string | null
  utm_campaign: string | null
  consent_lgpd: boolean
  notified_at: string | null
  created_at: string
}

export default function WaitlistPage() {
  const { data: entries, isLoading } = useQuery({
    queryKey: ['lancamentos-waitlist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lancamentos_waitlist')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as WaitlistEntry[]
    },
  })

  function exportCsv() {
    if (!entries || entries.length === 0) return
    const rows = [
      ['email', 'name', 'phone', 'lancamento_id', 'utm_source', 'utm_campaign', 'created_at'],
      ...entries.map((e) => [
        e.email,
        e.name ?? '',
        e.phone ?? '',
        e.lancamento_id ?? 'GERAL',
        e.utm_source ?? '',
        e.utm_campaign ?? '',
        e.created_at,
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lista de espera (Pré-Lançamento)</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Inscritos via seção LaunchesWaitlist da home.
          </p>
        </div>
        <Button onClick={exportCsv} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {entries?.length ?? 0} inscrito(s)
          </CardTitle>
          <CardDescription>
            Marque &quot;Notificado&quot; depois de enviar o aviso de lançamento (manual via SQL ou cron).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (entries ?? []).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum inscrito ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Lançamento</TableHead>
                  <TableHead>UTM</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(entries ?? []).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <a
                        href={`mailto:${e.email}`}
                        className="flex items-center gap-1.5 text-primary hover:underline text-sm"
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        {e.email}
                      </a>
                    </TableCell>
                    <TableCell className="text-sm">{e.name ?? '—'}</TableCell>
                    <TableCell>
                      {e.phone ? (
                        <a
                          href={`tel:${e.phone.replace(/\D/g, '')}`}
                          className="flex items-center gap-1.5 text-primary hover:underline text-sm"
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          {e.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {e.lancamento_id ? (
                        <Badge variant="secondary">{e.lancamento_id}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Geral</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {e.utm_source ?? '—'}
                    </TableCell>
                    <TableCell>
                      {e.notified_at ? (
                        <Badge variant="success">Notificado</Badge>
                      ) : (
                        <Badge>Aguardando</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(e.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
