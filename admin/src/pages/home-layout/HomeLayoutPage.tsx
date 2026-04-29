import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical, Eye, EyeOff, Save, Search, Star, Home,
  Building2, BarChart3, Quote, Megaphone, Image as ImageIcon,
  Award, CheckCircle2, MapPin, Sparkles, Pencil,
  Users, Calculator, Clock, Newspaper, HelpCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { revalidatePublicPaths } from '@/lib/revalidate'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { SectionEditDialog, EDITABLE_SECTION_TYPES } from './SectionEditDialog'

interface HomeSection {
  id: string
  section_type: string
  label: string
  position: number
  active: boolean
  config: Record<string, unknown>
}

const SECTION_DESCRIPTIONS: Record<string, string> = {
  hero_search: 'Banner principal com título, subtítulo e formulário de busca de imóveis.',
  featured_properties: 'Carrossel/grid de imóveis marcados como destaque.',
  category_cards: 'Cards com categorias: Comprar, Alugar, Lançamentos, etc.',
  stats: 'Números da empresa (anos de mercado, imóveis vendidos, clientes).',
  testimonials: 'Depoimentos de clientes satisfeitos.',
  cta_anunciar: 'Chamada para ação convidando a anunciar imóvel.',
  banners: 'Banners promocionais cadastrados em "Banners".',
  trust_stats: 'Bloco de credibilidade no estilo RE/MAX com 3 métricas grandes em fundo navy.',
  value_proposition: 'Bloco de proposta de valor com imagem à esquerda e texto + CTA à direita.',
  residential_featured: 'Imóveis residenciais em destaque (filtrados automaticamente).',
  commercial_featured: 'Imóveis comerciais em destaque (filtrados automaticamente).',
  featured_cities: 'Grid de cidades atendidas com imagem e contagem de imóveis.',
  launches_preview: 'Cards de lançamentos/empreendimentos com status, entrega e preço.',
  launches_waitlist: 'Formulário de lista de espera para um lançamento específico.',
  team: 'Equipe / corretores em destaque com foto, nome e CTA para perfil.',
  valuation_cta: 'Chamada para avaliação gratuita de imóvel (com benefícios).',
  recently_viewed: 'Carrossel dos últimos imóveis que o visitante visualizou (vazio se primeira visita).',
  blog_preview: 'Cards dos posts mais recentes do blog.',
  faq: 'Perguntas frequentes em accordion.',
}

// ── Sortable list item ────────────────────────────────────────────────

function SortableItem({
  section,
  onToggleActive,
  onEdit,
}: {
  section: HomeSection
  onToggleActive: (id: string, active: boolean) => void
  onEdit: (section: HomeSection) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg p-4 flex items-center gap-4 shadow-sm transition-all ${
        isDragging ? 'shadow-lg ring-2 ring-[#f2d22e]' : 'hover:shadow-md'
      } ${!section.active ? 'opacity-60' : ''}`}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-[#010744] p-1 touch-none"
        aria-label="Arrastar para reordenar"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#010744]">{section.label}</span>
          <span className="text-xs text-gray-400 font-mono">{section.section_type}</span>
        </div>
        <p className="text-sm text-gray-600 mt-0.5 truncate">
          {SECTION_DESCRIPTIONS[section.section_type] ?? '—'}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {EDITABLE_SECTION_TYPES.includes(section.section_type) && (
          <button
            type="button"
            onClick={() => onEdit(section)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#010744]/20 text-[#010744] text-xs font-semibold hover:bg-[#010744] hover:text-white transition-colors"
            aria-label={`Editar seção ${section.label}`}
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </button>
        )}
        {section.active ? (
          <Eye className="w-4 h-4 text-green-600" />
        ) : (
          <EyeOff className="w-4 h-4 text-gray-400" />
        )}
        <Switch
          checked={section.active}
          onCheckedChange={(v) => onToggleActive(section.id, v)}
          aria-label={`Ativar seção ${section.label}`}
        />
      </div>
    </div>
  )
}

// ── Preview blocks (mini representação de cada seção) ─────────────────

function PreviewHero() {
  return (
    <div className="bg-gradient-to-br from-[#010744] to-[#1a1f6e] text-white p-4 flex flex-col items-center gap-2">
      <div className="h-2 w-32 bg-white/80 rounded" />
      <div className="h-2 w-40 bg-[#f2d22e] rounded" />
      <div className="h-1.5 w-24 bg-white/40 rounded mt-1" />
      <div className="mt-2 bg-white/10 border border-white/20 rounded-md px-2 py-1.5 flex items-center gap-1 w-full max-w-[180px]">
        <Search className="w-3 h-3 text-[#f2d22e]" />
        <div className="h-1 flex-1 bg-white/30 rounded" />
      </div>
    </div>
  )
}

function PreviewFeatured() {
  return (
    <div className="bg-white p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Star className="w-3 h-3 text-[#f2d22e] fill-[#f2d22e]" />
        <div className="h-1.5 w-20 bg-[#010744] rounded" />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded bg-gray-100 overflow-hidden">
            <div className="h-8 bg-gradient-to-br from-gray-300 to-gray-200" />
            <div className="p-1 space-y-0.5">
              <div className="h-0.5 w-full bg-gray-300 rounded" />
              <div className="h-0.5 w-2/3 bg-[#f2d22e] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewCategories() {
  return (
    <div className="bg-[#ededd1]/60 p-3">
      <div className="h-1.5 w-24 bg-[#010744] rounded mx-auto mb-2" />
      <div className="grid grid-cols-4 gap-1.5">
        {['Comprar', 'Alugar', 'Novo', 'Comercial'].map((label) => (
          <div key={label} className="bg-white rounded p-1.5 flex flex-col items-center gap-0.5">
            <Home className="w-3 h-3 text-[#010744]" />
            <span className="text-[7px] text-gray-600 font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewStats() {
  return (
    <div className="bg-[#010744] p-3 text-white">
      <div className="grid grid-cols-4 gap-1.5 text-center">
        {['15+', '2k', '500', '98%'].map((n, i) => (
          <div key={i}>
            <BarChart3 className="w-3 h-3 text-[#f2d22e] mx-auto mb-0.5" />
            <div className="text-[10px] font-bold text-[#f2d22e]">{n}</div>
            <div className="h-0.5 w-full bg-white/30 rounded mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewTestimonials() {
  return (
    <div className="bg-white p-3">
      <div className="h-1.5 w-28 bg-[#010744] rounded mx-auto mb-2" />
      <div className="grid grid-cols-2 gap-1.5">
        {[0, 1].map((i) => (
          <div key={i} className="bg-gray-50 rounded p-1.5 border border-gray-100">
            <Quote className="w-2.5 h-2.5 text-[#f2d22e] mb-0.5" />
            <div className="h-0.5 w-full bg-gray-300 rounded mb-0.5" />
            <div className="h-0.5 w-4/5 bg-gray-300 rounded mb-0.5" />
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <div className="h-0.5 w-8 bg-gray-400 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewCta() {
  return (
    <div className="bg-[#ededd1] p-3 text-center">
      <Megaphone className="w-4 h-4 text-[#010744] mx-auto mb-1" />
      <div className="h-1.5 w-32 bg-[#010744] rounded mx-auto mb-1" />
      <div className="h-1 w-24 bg-gray-500 rounded mx-auto mb-2" />
      <div className="inline-block bg-[#010744] rounded px-3 py-1">
        <div className="h-1 w-12 bg-[#f2d22e] rounded" />
      </div>
    </div>
  )
}

function PreviewBanners() {
  return (
    <div className="bg-gray-100 p-2">
      <div className="bg-gradient-to-r from-[#010744] to-[#1a1f6e] rounded p-3 flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-[#f2d22e]" />
        <div className="flex-1 space-y-1">
          <div className="h-1.5 w-3/4 bg-white rounded" />
          <div className="h-1 w-1/2 bg-white/60 rounded" />
        </div>
        <div className="bg-[#f2d22e] rounded px-2 py-1">
          <div className="h-1 w-6 bg-[#010744] rounded" />
        </div>
      </div>
    </div>
  )
}

function PreviewFallback({ type }: { type: string }) {
  return (
    <div className="bg-gray-50 border-dashed border border-gray-300 p-4 text-center">
      <div className="text-[10px] text-gray-500 font-mono">{type}</div>
      <div className="text-[9px] text-gray-400 mt-0.5">Preview indisponível</div>
    </div>
  )
}

function PreviewTrustStats() {
  return (
    <div className="bg-[#010744] p-3 text-white">
      <div className="h-1.5 w-32 bg-[#f2d22e] rounded mx-auto mb-2" />
      <div className="grid grid-cols-3 gap-1.5">
        {['15+', '2k+', '98%'].map((n, i) => (
          <div key={i} className="bg-white/10 border border-white/20 rounded p-1.5 text-center">
            <Award className="w-3 h-3 text-[#f2d22e] mx-auto mb-0.5" />
            <div className="text-[10px] font-black text-[#f2d22e]">{n}</div>
            <div className="h-0.5 w-full bg-white/30 rounded mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewValueProp() {
  return (
    <div className="bg-white p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded h-16 relative">
          <div className="absolute bottom-1 left-1 bg-white rounded p-0.5 flex items-center gap-0.5">
            <CheckCircle2 className="w-2 h-2 text-[#f2d22e]" />
            <div className="h-0.5 w-6 bg-[#010744] rounded" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="h-0.5 w-8 bg-[#f2d22e] rounded" />
          <div className="h-1.5 w-full bg-[#010744] rounded" />
          <div className="h-0.5 w-full bg-gray-300 rounded" />
          <div className="h-0.5 w-5/6 bg-gray-300 rounded" />
          <div className="inline-block bg-[#010744] rounded px-1.5 py-0.5 mt-0.5">
            <div className="h-0.5 w-6 bg-[#f2d22e] rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewResidential() {
  return (
    <div className="bg-[#fafbff] p-3">
      <div className="flex items-center gap-1 mb-2">
        <div className="bg-[#f2d22e]/40 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
          <Home className="w-2 h-2 text-[#010744]" />
          <div className="h-0.5 w-5 bg-[#010744] rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded bg-white overflow-hidden border border-gray-100">
            <div className="h-6 bg-gradient-to-br from-blue-200 to-blue-100" />
            <div className="p-0.5 space-y-0.5">
              <div className="h-0.5 w-full bg-gray-300 rounded" />
              <div className="h-0.5 w-2/3 bg-[#f2d22e] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewCommercial() {
  return (
    <div className="bg-white p-3 border-t border-gray-100">
      <div className="flex items-center gap-1 mb-2">
        <div className="bg-[#010744] rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
          <Building2 className="w-2 h-2 text-white" />
          <div className="h-0.5 w-5 bg-white rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded bg-gray-50 overflow-hidden border border-gray-100">
            <div className="h-6 bg-gradient-to-br from-slate-300 to-slate-200" />
            <div className="p-0.5 space-y-0.5">
              <div className="h-0.5 w-full bg-gray-300 rounded" />
              <div className="h-0.5 w-1/2 bg-[#010744] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewCities() {
  return (
    <div className="bg-[#ededd1]/40 p-3">
      <div className="h-1.5 w-20 bg-[#010744] rounded mx-auto mb-0.5" />
      <div className="h-1 w-28 bg-gray-500 rounded mx-auto mb-2" />
      <div className="grid grid-cols-6 gap-1">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="relative aspect-[3/4] rounded overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#010744] to-transparent" />
            <div className="absolute bottom-0.5 left-0.5 right-0.5 flex items-center gap-0.5">
              <MapPin className="w-1.5 h-1.5 text-[#f2d22e]" />
              <div className="h-0.5 flex-1 bg-white/90 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewLaunches() {
  return (
    <div className="bg-white p-3">
      <div className="flex items-center gap-1 mb-2">
        <div className="bg-gradient-to-r from-[#010744] to-[#1a1f6e] rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
          <Sparkles className="w-2 h-2 text-white" />
          <div className="h-0.5 w-6 bg-white rounded" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded overflow-hidden bg-gray-100 border border-gray-100">
            <div className="relative h-8 bg-gradient-to-br from-amber-200 to-orange-200">
              <div className="absolute top-0.5 left-0.5 bg-[#f2d22e] rounded px-0.5 py-px">
                <div className="h-px w-4 bg-[#010744] rounded" />
              </div>
            </div>
            <div className="p-1 space-y-0.5">
              <div className="h-0.5 w-full bg-[#010744] rounded" />
              <div className="h-0.5 w-1/2 bg-gray-400 rounded" />
              <div className="h-0.5 w-3/4 bg-[#f2d22e] rounded mt-0.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewTeam() {
  return (
    <div className="bg-white p-3">
      <div className="h-1.5 w-24 bg-[#010744] rounded mx-auto mb-2" />
      <div className="grid grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-200 flex items-center justify-center">
              <Users className="w-3 h-3 text-[#010744]" />
            </div>
            <div className="h-0.5 w-8 bg-[#010744] rounded" />
            <div className="h-0.5 w-6 bg-gray-300 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewValuationCta() {
  return (
    <div className="bg-gradient-to-r from-[#010744] to-[#1a1f6e] p-3 text-white">
      <div className="grid grid-cols-2 gap-2 items-center">
        <div className="space-y-1">
          <Calculator className="w-3 h-3 text-[#f2d22e] mb-0.5" />
          <div className="h-1.5 w-full bg-white rounded" />
          <div className="h-0.5 w-3/4 bg-white/60 rounded" />
          <div className="inline-block bg-[#f2d22e] rounded px-2 py-0.5 mt-1">
            <div className="h-0.5 w-8 bg-[#010744] rounded" />
          </div>
        </div>
        <div className="space-y-0.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-1">
              <CheckCircle2 className="w-2 h-2 text-[#f2d22e]" />
              <div className="h-0.5 flex-1 bg-white/60 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PreviewRecentlyViewed() {
  return (
    <div className="bg-white p-3 border-t border-gray-100">
      <div className="flex items-center gap-1 mb-2">
        <Clock className="w-3 h-3 text-gray-500" />
        <div className="h-1 w-20 bg-gray-500 rounded" />
      </div>
      <div className="grid grid-cols-4 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded bg-gray-100 overflow-hidden">
            <div className="h-5 bg-gradient-to-br from-gray-300 to-gray-200" />
            <div className="p-0.5">
              <div className="h-0.5 w-2/3 bg-[#f2d22e] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewBlog() {
  return (
    <div className="bg-[#ededd1]/30 p-3">
      <div className="flex items-center gap-1 mb-2">
        <Newspaper className="w-3 h-3 text-[#010744]" />
        <div className="h-1.5 w-20 bg-[#010744] rounded" />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded bg-white overflow-hidden border border-gray-100">
            <div className="h-6 bg-gradient-to-br from-amber-100 to-orange-100" />
            <div className="p-1 space-y-0.5">
              <div className="h-0.5 w-full bg-[#010744] rounded" />
              <div className="h-0.5 w-2/3 bg-gray-300 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PreviewFaq() {
  return (
    <div className="bg-white p-3">
      <div className="h-1.5 w-32 bg-[#010744] rounded mx-auto mb-2" />
      <div className="space-y-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-1">
            <div className="flex items-center gap-1 flex-1">
              <HelpCircle className="w-2 h-2 text-[#f2d22e]" />
              <div className="h-0.5 w-3/4 bg-gray-400 rounded" />
            </div>
            <div className="text-[8px] text-gray-400 leading-none">+</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const PREVIEW_MAP: Record<string, () => React.ReactNode> = {
  hero_search: () => <PreviewHero />,
  featured_properties: () => <PreviewFeatured />,
  category_cards: () => <PreviewCategories />,
  stats: () => <PreviewStats />,
  testimonials: () => <PreviewTestimonials />,
  cta_anunciar: () => <PreviewCta />,
  banners: () => <PreviewBanners />,
  trust_stats: () => <PreviewTrustStats />,
  value_proposition: () => <PreviewValueProp />,
  residential_featured: () => <PreviewResidential />,
  commercial_featured: () => <PreviewCommercial />,
  featured_cities: () => <PreviewCities />,
  launches_preview: () => <PreviewLaunches />,
  team: () => <PreviewTeam />,
  valuation_cta: () => <PreviewValuationCta />,
  recently_viewed: () => <PreviewRecentlyViewed />,
  blog_preview: () => <PreviewBlog />,
  faq: () => <PreviewFaq />,
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function HomeLayoutPage() {
  const queryClient = useQueryClient()
  const [sections, setSections] = useState<HomeSection[]>([])
  const [dirty, setDirty] = useState(false)
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['home-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_sections')
        .select('*')
        .order('position', { ascending: true })
      if (error) throw error
      return data as HomeSection[]
    },
  })

  useEffect(() => {
    if (data) {
      setSections(data)
      setDirty(false)
    }
  }, [data])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Live reorder during drag so the preview updates in real time
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setSections((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id)
      const newIndex = prev.findIndex((s) => s.id === over.id)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (!event.over) return
    // Order was already applied in handleDragOver; just flag dirty
    setDirty(true)
  }

  const handleToggleActive = (id: string, active: boolean) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, active } : s)))
    setDirty(true)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = sections.map((s, idx) =>
        supabase
          .from('home_sections')
          .update({ position: idx, active: s.active })
          .eq('id', s.id)
      )
      const results = await Promise.all(updates)
      const failed = results.find((r) => r.error)
      if (failed?.error) throw failed.error
      await revalidatePublicPaths(['/'])
    },
    onSuccess: () => {
      toast.success('Layout da home salvo!')
      queryClient.invalidateQueries({ queryKey: ['home-sections'] })
      setDirty(false)
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  const visibleSections = sections.filter((s) => s.active)

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 max-w-6xl">
        <div>
          <h1 className="text-2xl font-bold text-[#010744]">Layout da Home</h1>
          <p className="text-sm text-gray-600 mt-1">
            Arraste os blocos para alterar a ordem em que aparecem na página inicial do portal.
            Use o botão de visibilidade para mostrar ou ocultar cada bloco.
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={!dirty || saveMutation.isPending}
          className="bg-[#010744] hover:bg-[#010744]/90 text-white shrink-0"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>

      {dirty && (
        <div className="mb-4 px-4 py-2 bg-[#f2d22e]/20 border border-[#f2d22e] rounded-md text-sm text-[#010744] max-w-6xl">
          Você tem alterações não salvas. Clique em "Salvar alterações" para aplicar.
        </div>
      )}

      {/* Two columns: sortable list + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 max-w-6xl">
        {/* Sortable list */}
        <div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {sections.map((section) => (
                  <SortableItem
                    key={section.id}
                    section={section}
                    onToggleActive={handleToggleActive}
                    onEdit={setEditingSection}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {sections.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhuma seção cadastrada.
            </div>
          )}
        </div>

        {/* Live preview (sticky on large screens) */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-[#010744] uppercase tracking-wider">
              Preview da Home
            </h2>
            <span className="text-[10px] text-gray-500 font-mono">
              {visibleSections.length}/{sections.length} visíveis
            </span>
          </div>

          <div className="border-2 border-gray-200 rounded-xl bg-gray-50 overflow-hidden shadow-sm">
            {/* Browser chrome */}
            <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <div className="flex-1 bg-gray-100 rounded-full px-2 py-0.5 ml-2">
                <span className="text-[9px] text-gray-500 font-mono truncate block">
                  moreja.com.br
                </span>
              </div>
            </div>

            {/* Page content */}
            <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
              {/* Fake site header */}
              <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-[#010744]" />
                  <span className="text-[10px] font-bold text-[#010744]">MOREJÁ</span>
                </div>
                <div className="flex gap-2">
                  {['Comprar', 'Alugar', 'Sobre'].map((l) => (
                    <span key={l} className="text-[8px] text-gray-500">{l}</span>
                  ))}
                </div>
              </div>

              {/* Dynamic section previews in current order */}
              {visibleSections.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  Nenhum bloco visível
                </div>
              ) : (
                visibleSections.map((s) => {
                  const render = PREVIEW_MAP[s.section_type]
                  return (
                    <div key={s.id} className="border-b border-gray-100 last:border-b-0">
                      {render ? render() : <PreviewFallback type={s.section_type} />}
                    </div>
                  )
                })
              )}

              {/* Fake footer */}
              <div className="bg-[#010744] p-2 text-center">
                <div className="h-1 w-16 bg-[#f2d22e] rounded mx-auto" />
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-500 mt-2 text-center">
            Preview esquemático — atualiza em tempo real ao arrastar
          </p>
        </div>
      </div>

      <SectionEditDialog
        section={editingSection}
        open={!!editingSection}
        onClose={() => setEditingSection(null)}
      />
    </div>
  )
}
