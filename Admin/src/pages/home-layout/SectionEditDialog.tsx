import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Trash2, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUploadStorage } from '@/components/shared/ImageUploadStorage'
import { FocalPointPicker } from '@/components/shared/FocalPointPicker'

// ── Types ────────────────────────────────────────────────────────────

interface Section {
  id: string
  section_type: string
  label: string
  config: Record<string, unknown>
}

interface CategoryCardItem {
  title: string
  description: string
  href: string
  bg: string
}

interface SectionEditDialogProps {
  section: Section | null
  open: boolean
  onClose: () => void
}

// ── Editor registry — per section_type ───────────────────────────────

export function SectionEditDialog({ section, open, onClose }: SectionEditDialogProps) {
  const queryClient = useQueryClient()
  const [config, setConfig] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (!section) return
    // Merge defaults so that saving never wipes fields the user didn't touch
    const defaults = DEFAULT_CONFIG[section.section_type] ?? {}
    setConfig({ ...defaults, ...(section.config ?? {}) })
  }, [section])

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!section) return
      const { error } = await supabase
        .from('home_sections')
        .update({ config })
        .eq('id', section.id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Configuração salva!')
      queryClient.invalidateQueries({ queryKey: ['home-sections'] })
      onClose()
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  if (!section) return null

  const editorForType = EDITORS[section.section_type]

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar — {section.label}</DialogTitle>
          <DialogDescription>
            Ajuste imagens, textos e links desta seção. As alterações aparecem imediatamente
            no site após salvar.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {editorForType ? (
            editorForType({ config, setConfig })
          ) : (
            <div className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg">
              Esta seção ainda não tem editor visual configurado.
              <br />
              <code className="text-xs">{section.section_type}</code>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !editorForType}
            className="bg-[#010744] hover:bg-[#010744]/90"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Editors ──────────────────────────────────────────────────────────

type EditorProps = {
  config: Record<string, unknown>
  setConfig: (c: Record<string, unknown>) => void
}

function CategoryCardsEditor({ config, setConfig }: EditorProps) {
  const cards = (config.cards as CategoryCardItem[] | undefined) ?? defaultCards

  const updateCard = (i: number, patch: Partial<CategoryCardItem>) => {
    const next = [...cards]
    next[i] = { ...next[i], ...patch }
    setConfig({ ...config, cards: next })
  }

  const addCard = () => {
    setConfig({
      ...config,
      cards: [...cards, { title: 'Nova categoria', description: '', href: '/comprar', bg: '' }],
    })
  }

  const removeCard = (i: number) => {
    setConfig({ ...config, cards: cards.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-5">
      <div>
        <Label>Título da seção</Label>
        <Input
          value={(config.title as string) ?? 'O que você procura?'}
          onChange={(e) => setConfig({ ...config, title: e.target.value })}
          placeholder="O que você procura?"
        />
      </div>
      <div>
        <Label>Subtítulo</Label>
        <Input
          value={(config.subtitle as string) ?? 'Encontre o imóvel ideal para cada momento da sua vida'}
          onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
          placeholder="Encontre o imóvel ideal para cada momento da sua vida"
        />
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-base">Cards ({cards.length})</Label>
          <Button type="button" size="sm" variant="outline" onClick={addCard}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Adicionar card
          </Button>
        </div>

        <div className="space-y-4">
          {cards.map((card, i) => (
            <div key={i} className="border rounded-lg p-4 bg-muted/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#010744]">Card {i + 1}</span>
                {cards.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeCard(i)}
                    className="text-destructive hover:text-destructive h-7"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Remover
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Título</Label>
                  <Input
                    value={card.title}
                    onChange={(e) => updateCard(i, { title: e.target.value })}
                    placeholder="Residencial"
                  />
                </div>
                <div>
                  <Label className="text-xs">Link (href)</Label>
                  <Input
                    value={card.href}
                    onChange={(e) => updateCard(i, { href: e.target.value })}
                    placeholder="/comprar?tipo=Apartamento"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Descrição</Label>
                <Input
                  value={card.description}
                  onChange={(e) => updateCard(i, { description: e.target.value })}
                  placeholder="Apartamentos, casas e condomínios"
                />
              </div>

              <ImageUploadStorage
                value={card.bg ?? ''}
                onChange={(url) => updateCard(i, { bg: url })}
                bucket="site"
                folder={`home/category-cards/card-${i + 1}`}
                specs={{
                  width: 800,
                  height: 1000,
                  mode: 'cover',
                  quality: 0.85,
                  label: '800 × 1000 px (4:5)',
                  hint:
                    'Formato retrato 4:5. A imagem é redimensionada e cortada automaticamente para caber — envie em qualquer tamanho que o sistema ajusta.',
                }}
                label="Imagem de fundo"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const defaultCards: CategoryCardItem[] = [
  {
    title: 'Residencial',
    description: 'Apartamentos, casas e condomínios para sua família',
    href: '/comprar?tipo=Apartamento',
    bg: '',
  },
  {
    title: 'Comercial',
    description: 'Salas, galpões e espaços para o seu negócio crescer',
    href: '/comprar?tipo=Comercial',
    bg: '',
  },
  {
    title: 'Empreendimentos',
    description: 'Lançamentos exclusivos e novos empreendimentos',
    href: '/empreendimentos',
    bg: '',
  },
]

// ── Hero editor ──────────────────────────────────────────────────────

function HeroSearchEditor({ config, setConfig }: EditorProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Título principal</Label>
          <Input
            value={(config.title as string) ?? ''}
            onChange={(e) => setConfig({ ...config, title: e.target.value })}
            placeholder="Encontre o imóvel"
          />
        </div>
        <div>
          <Label>Destaque (em amarelo)</Label>
          <Input
            value={(config.highlight as string) ?? ''}
            onChange={(e) => setConfig({ ...config, highlight: e.target.value })}
            placeholder="dos seus sonhos"
          />
        </div>
      </div>

      <div>
        <Label>Subtítulo</Label>
        <Input
          value={(config.subtitle as string) ?? ''}
          onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
          placeholder="A Morejá Imobiliária oferece os melhores imóveis..."
        />
      </div>

      <div className="border-t pt-4">
        <ImageUploadStorage
          value={(config.bg_image as string) ?? ''}
          onChange={(url) => setConfig({ ...config, bg_image: url })}
          bucket="site"
          folder="home/hero"
          specs={{
            width: 2400,
            height: 1600,
            mode: 'fit',
            quality: 0.82,
            label: 'até 2400 × 1600 px',
            hint:
              'Envie a imagem em alta resolução — o sistema preserva a imagem original e você escolhe abaixo qual ponto deve ficar em destaque quando ela for exibida no banner.',
          }}
          label="Imagem de fundo do hero"
        />
      </div>

      {(config.bg_image as string) && (
        <div className="border-t pt-4">
          <FocalPointPicker
            src={(config.bg_image as string) ?? ''}
            x={(config.bg_focal_x as number) ?? 50}
            y={(config.bg_focal_y as number) ?? 50}
            onChange={(x, y) => setConfig({ ...config, bg_focal_x: x, bg_focal_y: y })}
            aspect={16 / 9}
            label="Ponto de destaque da imagem"
          />
        </div>
      )}

      <div>
        <Label>Opacidade do overlay escuro ({((config.overlay_opacity as number) ?? 0.55).toFixed(2)})</Label>
        <input
          type="range"
          min={0}
          max={0.9}
          step={0.05}
          value={(config.overlay_opacity as number) ?? 0.55}
          onChange={(e) =>
            setConfig({ ...config, overlay_opacity: parseFloat(e.target.value) })
          }
          className="w-full mt-2 accent-[#010744]"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Controla a escurecida sobre a imagem para garantir legibilidade do texto.
          0 = sem overlay · 0.9 = muito escuro.
        </p>
      </div>
    </div>
  )
}

// ── Defaults per section type — used on dialog open to avoid wiping fields
const DEFAULT_CONFIG: Record<string, Record<string, unknown>> = {
  category_cards: {
    title: 'O que você procura?',
    subtitle: 'Encontre o imóvel ideal para cada momento da sua vida',
    cards: defaultCards,
  },
  hero_search: {
    title: 'Encontre o imóvel',
    highlight: 'dos seus sonhos',
    subtitle:
      'A Morejá Imobiliária oferece os melhores imóveis residenciais e comerciais. Compre, alugue ou invista com segurança e qualidade.',
    bg_image: '',
    bg_focal_x: 50,
    bg_focal_y: 50,
    overlay_opacity: 0.55,
  },
}

// Registry: section_type → editor component
const EDITORS: Record<string, (p: EditorProps) => React.ReactNode> = {
  category_cards: (p) => <CategoryCardsEditor {...p} />,
  hero_search: (p) => <HeroSearchEditor {...p} />,
}

export const EDITABLE_SECTION_TYPES = Object.keys(EDITORS)
