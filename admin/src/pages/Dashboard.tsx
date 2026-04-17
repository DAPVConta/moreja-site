import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Users,
  UserCheck,
  Image,
  CheckCircle2,
  TrendingUp,
  Database,
  Clock,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Lead } from '@/types/database'

function useMetrics() {
  return useQuery({
    queryKey: ['dashboard_metrics'],
    queryFn: async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayIso = today.toISOString()

      const [leadsTotal, leadsToday, activeBrokers, activeBanners] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', todayIso),
        supabase.from('brokers').select('id', { count: 'exact', head: true }).eq('active', true),
        supabase.from('banners').select('id', { count: 'exact', head: true }).eq('active', true),
      ])

      return {
        leadsTotal: leadsTotal.count ?? 0,
        leadsToday: leadsToday.count ?? 0,
        activeBrokers: activeBrokers.count ?? 0,
        activeBanners: activeBanners.count ?? 0,
      }
    },
  })
}

function useLeadsChart() {
  return useQuery({
    queryKey: ['leads_chart'],
    queryFn: async () => {
      const since = subDays(new Date(), 29).toISOString()
      const { data } = await supabase
        .from('leads')
        .select('created_at')
        .gte('created_at', since)
        .order('created_at')

      // Build 30-day buckets
      const buckets: Record<string, number> = {}
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(new Date(), i), 'dd/MM')
        buckets[d] = 0
      }
      ;(data ?? []).forEach((lead) => {
        const d = format(new Date(lead.created_at), 'dd/MM')
        if (d in buckets) buckets[d]++
      })

      return Object.entries(buckets).map(([date, count]) => ({ date, count }))
    },
  })
}

function useRecentLeads() {
  return useQuery({
    queryKey: ['recent_leads'],
    queryFn: async () => {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      return (data ?? []) as Lead[]
    },
  })
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' }> = {
  new: { label: 'Novo', variant: 'default' },
  contacted: { label: 'Contatado', variant: 'warning' },
  qualified: { label: 'Qualificado', variant: 'success' },
  closed: { label: 'Fechado', variant: 'secondary' },
}

export default function Dashboard() {
  const metrics = useMetrics()
  const chart = useLeadsChart()
  const recentLeads = useRecentLeads()

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Leads Hoje"
          value={metrics.data?.leadsToday ?? 0}
          subtitle={`${metrics.data?.leadsTotal ?? 0} total`}
          icon={<TrendingUp className="w-5 h-5 text-[#010744]" />}
          loading={metrics.isLoading}
          color="yellow"
        />
        <MetricCard
          title="Total de Leads"
          value={metrics.data?.leadsTotal ?? 0}
          subtitle="Todos os tempos"
          icon={<Users className="w-5 h-5 text-blue-600" />}
          loading={metrics.isLoading}
          color="blue"
        />
        <MetricCard
          title="Corretores Ativos"
          value={metrics.data?.activeBrokers ?? 0}
          subtitle="Equipe disponível"
          icon={<UserCheck className="w-5 h-5 text-green-600" />}
          loading={metrics.isLoading}
          color="green"
        />
        <MetricCard
          title="Banners Ativos"
          value={metrics.data?.activeBanners ?? 0}
          subtitle="Exibidos no site"
          icon={<Image className="w-5 h-5 text-purple-600" />}
          loading={metrics.isLoading}
          color="purple"
        />
      </div>

      {/* Chart + Status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Leads nos últimos 30 dias</CardTitle>
            <CardDescription>Evolução diária de novos contatos</CardDescription>
          </CardHeader>
          <CardContent>
            {chart.isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chart.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    labelFormatter={(v) => `Dia ${v}`}
                    formatter={(v) => [v, 'Leads']}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#010744"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: '#f2d22e', stroke: '#010744' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* System status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusItem
              icon={<Database className="w-4 h-4" />}
              label="Supabase"
              status="online"
            />
            <StatusItem
              icon={<CheckCircle2 className="w-4 h-4" />}
              label="Autenticação"
              status="online"
            />
            <StatusItem
              icon={<Clock className="w-4 h-4" />}
              label="Cache"
              status="online"
            />
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                Última atualização:{' '}
                {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent leads table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leads Recentes</CardTitle>
          <CardDescription>Os últimos 10 contatos recebidos</CardDescription>
        </CardHeader>
        <CardContent>
          {recentLeads.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
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
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recentLeads.data ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum lead recebido ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  (recentLeads.data ?? []).map((lead) => {
                    const sc = statusConfig[lead.status] ?? statusConfig.new
                    return (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                        <TableCell>{lead.phone ?? '—'}</TableCell>
                        <TableCell className="max-w-[160px] truncate">
                          {lead.property_title ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sc.variant}>{sc.label}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
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

interface MetricCardProps {
  title: string
  value: number
  subtitle: string
  icon: React.ReactNode
  loading: boolean
  color: 'yellow' | 'blue' | 'green' | 'purple'
}

function MetricCard({ title, value, subtitle, icon, loading, color }: MetricCardProps) {
  const colorMap = {
    yellow: 'bg-yellow-50',
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface StatusItemProps {
  icon: React.ReactNode
  label: string
  status: 'online' | 'offline' | 'warning'
}

function StatusItem({ icon, label, status }: StatusItemProps) {
  const statusMap = {
    online: { dot: 'bg-green-500', text: 'Online' },
    offline: { dot: 'bg-red-500', text: 'Offline' },
    warning: { dot: 'bg-yellow-500', text: 'Atenção' },
  }
  const s = statusMap[status]

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${s.dot} animate-pulse`} />
        <span className="text-xs font-medium">{s.text}</span>
      </div>
    </div>
  )
}
