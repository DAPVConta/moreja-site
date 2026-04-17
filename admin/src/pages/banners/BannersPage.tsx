import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Save, Timer } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Banner } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { BannerForm } from './BannerForm'

const pageLabels: Record<string, string> = {
  home: 'Página Inicial',
  imoveis: 'Imóveis',
  sobre: 'Sobre',
  contato: 'Contato',
}

export default function BannersPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editBanner, setEditBanner] = useState<Banner | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: banners, isLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('page')
        .order('position')
      if (error) throw error
      return (data ?? []) as Banner[]
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('banners').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] })
      toast.success('Banner excluído!')
      setDeleteId(null)
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('banners').update({ active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] })
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  const reorderMutation = useMutation({
    mutationFn: async ({
      id,
      newPosition,
    }: {
      id: string
      newPosition: number
    }) => {
      const { error } = await supabase
        .from('banners')
        .update({ position: newPosition })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['banners'] }),
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  const handleMove = (banner: Banner, direction: 'up' | 'down') => {
    const group = (banners ?? []).filter((b) => b.page === banner.page).sort((a, b) => a.position - b.position)
    const idx = group.findIndex((b) => b.id === banner.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= group.length) return
    const swap = group[swapIdx]
    reorderMutation.mutate({ id: banner.id, newPosition: swap.position })
    reorderMutation.mutate({ id: swap.id, newPosition: banner.position })
  }

  const handleEdit = (banner: Banner) => {
    setEditBanner(banner)
    setFormOpen(true)
  }

  const handleNew = () => {
    setEditBanner(null)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mt-1">
            {banners?.length ?? 0} banner(s) cadastrado(s)
          </p>
        </div>
        <Button
          onClick={handleNew}
          className="bg-[#010744] hover:bg-[#010744]/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Banner
        </Button>
      </div>

      <CarouselSettings />


      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : banners?.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Nenhum banner cadastrado. Clique em "Novo Banner" para começar.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(banners ?? []).map((banner) => {
            const group = (banners ?? []).filter((b) => b.page === banner.page).sort((a, b) => a.position - b.position)
            const idx = group.findIndex((b) => b.id === banner.id)
            const isFirst = idx === 0
            const isLast = idx === group.length - 1

            return (
              <Card key={banner.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-4 p-4">
                    {/* Preview */}
                    <div className="w-24 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      {banner.image_url ? (
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          Sem imagem
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">{banner.title}</p>
                        <Badge variant="secondary" className="text-xs">
                          {pageLabels[banner.page] ?? banner.page}
                        </Badge>
                        <Badge variant={banner.active ? 'success' : 'outline'} className="text-xs">
                          {banner.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      {banner.subtitle && (
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {banner.subtitle}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Posição: {banner.position}
                        {banner.cta_text && ` · CTA: ${banner.cta_text}`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMove(banner, 'up')}
                        disabled={isFirst || reorderMutation.isPending}
                        title="Mover para cima"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMove(banner, 'down')}
                        disabled={isLast || reorderMutation.isPending}
                        title="Mover para baixo"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          toggleMutation.mutate({ id: banner.id, active: !banner.active })
                        }
                        title={banner.active ? 'Desativar' : 'Ativar'}
                      >
                        {banner.active ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(banner)}
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(banner.id)}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <BannerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        banner={editBanner}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Excluir Banner"
        description="Tem certeza que deseja excluir este banner? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

// ── Configuração do carrossel (home_sections.config onde section_type='banners') ──
function CarouselSettings() {
  const queryClient = useQueryClient()
  const [autoplay, setAutoplay] = useState(true)
  const [intervalSeconds, setIntervalSeconds] = useState(5)

  const { data: section, isLoading } = useQuery({
    queryKey: ['home-sections', 'banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_sections')
        .select('id, config')
        .eq('section_type', 'banners')
        .maybeSingle()
      if (error) throw error
      return data as { id: string; config: Record<string, unknown> | null } | null
    },
  })

  useEffect(() => {
    const cfg = (section?.config ?? {}) as { autoplay?: boolean; interval_seconds?: number }
    setAutoplay(cfg.autoplay ?? true)
    setIntervalSeconds(cfg.interval_seconds ?? 5)
  }, [section])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!section) throw new Error('Seção "banners" não encontrada em home_sections')
      const nextConfig = {
        ...(section.config ?? {}),
        autoplay,
        interval_seconds: intervalSeconds,
      }
      const { error } = await supabase
        .from('home_sections')
        .update({ config: nextConfig })
        .eq('id', section.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Configurações salvas!')
      queryClient.invalidateQueries({ queryKey: ['home-sections', 'banners'] })
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="w-4 h-4" />
          Configurações do carrossel
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : !section ? (
          <p className="text-sm text-muted-foreground">
            Seção de banners não está ativa no layout da home. Ative-a em <strong>Layout da Home</strong> primeiro.
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-6">
            <div className="flex items-center gap-3">
              <Switch checked={autoplay} onCheckedChange={setAutoplay} />
              <div>
                <Label className="cursor-pointer">Avanço automático</Label>
                <p className="text-xs text-muted-foreground">
                  {autoplay ? 'Banners passam sozinhos' : 'Troca apenas manual (setas/pontos)'}
                </p>
              </div>
            </div>

            <div className="min-w-[180px]">
              <Label className="text-xs">Tempo entre banners (segundos)</Label>
              <Input
                type="number"
                min={1}
                max={60}
                step={1}
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Math.max(1, Number(e.target.value) || 1))}
                disabled={!autoplay}
              />
            </div>

            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="bg-[#010744] hover:bg-[#010744]/90 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
