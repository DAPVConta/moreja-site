'use client'

/**
 * PropertyCard v3 — Design Committee pass (richness × minimalist × detail)
 *
 * Mudanças vs v2 (síntese de 3 lentes):
 *
 * Convergências aplicadas:
 * - tabular-nums em preço, stats e área (cards param de "dançar" em grid)
 * - Preço ganha text-2xl + tracking-tight (decisão de compra dominante)
 * - Eyebrow ganha contraste WCAG (text-[#010744]/65) e peso editorial
 *   (font-semibold, tracking-[0.18em]) — antes text-gray-400 falhava AA
 * - Título com text-balance + min-h-[3.5rem] (sem órfã/viúva, altura estável)
 * - Padding interno p-5 sm:p-6 (era p-4 sm:p-5) — respiração premium
 * - title= duplicado removido das features (já tinham aria-label)
 *
 * Bloqueantes de detail resolvidos:
 * - Setas slider sobem para h-11 w-11 (44×44) e somem em pointer:coarse
 * - Swipe touch: touchstart/end delta vira navegação no slider
 * - Dots clicáveis com aria-label "Ir para foto N" + área de toque ampliada
 * - group-hover:scale-105 só dispara em motion-safe (respeita reduce-motion)
 * - Lazy load explícito nas fotos i > 0 (era 5 Images eager por card)
 * - onError no Image troca para PLACEHOLDER (antes falhava silenciosa)
 *
 * Tensões resolvidas:
 * - MapPin amarelo no eyebrow REMOVIDO (decoração; bairro é texto puro)
 * - Hover underline mantido mas decoration-1 (presente, não maquiagem)
 * - Maximize2 da área mantém navy (consistência com Bed/Bath/Car)
 * - Dots permanecem sempre visíveis (signal de mais fotos)
 * - CompareToggle saiu do bloco com border-t e virou icon-only no canto
 *   inferior direito do conteúdo, fora do <Link>
 * - priceDropped agora mostra preço anterior riscado ao lado (peça narrativa)
 */

import { ViewTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Bed, Bath, Car, Maximize2, ChevronLeft, ChevronRight, GitCompare, Check,
} from 'lucide-react'
import { Heart } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import type { Property } from '@/types/property'
import { formatPrice, formatArea } from '@/lib/format'
import { Badge } from '@/components/ui/Badge'
import { useFavorites } from '@/hooks/useFavorites'
import {
  isInCompare,
  toggleCompare,
  COMPARE_EVENT,
  COMPARE_MAX,
} from '@/lib/compare'
import { cn } from '@/lib/utils'

interface PropertyCardProps {
  property: Property
  priority?: boolean
  /** Aspect ratio do thumb. mobile: 16:9 (mais cards no fold); desktop: mantém 4:3. */
  aspect?: 'card' | 'square'
  /** Threshold de preço (em R$) p/ aplicar badge "Morejá Premium". Default: 1.000.000 */
  premiumThreshold?: number
}

const PLACEHOLDER = '/fallbacks/imovel-1.svg'

// ─── FavoriteButton ──────────────────────────────────────────────────────────

function FavoriteButton({ propertyId }: { propertyId: string }) {
  const { isFavorite, toggle } = useFavorites(propertyId)
  const buttonRef = useRef<HTMLButtonElement>(null)

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    const btn = buttonRef.current
    if (btn && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      btn.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(0.88)' },
          { transform: 'scale(1.12)' },
          { transform: 'scale(1)' },
        ],
        { duration: 220, easing: 'ease-in-out' },
      )
    }
    toggle()
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      aria-pressed={isFavorite}
      className={cn(
        'inline-flex items-center justify-center',
        'h-11 w-11 rounded-full',
        'bg-white/90 backdrop-blur-sm shadow-md',
        'transition-all duration-150',
        'hover:bg-white motion-safe:hover:scale-105',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2',
        'cursor-pointer',
      )}
    >
      <Heart
        size={18}
        aria-hidden="true"
        className={cn(
          'transition-colors duration-150',
          isFavorite
            ? 'fill-[#f2d22e] text-[#010744] stroke-[#010744]'
            : 'text-gray-600 fill-transparent',
        )}
      />
    </button>
  )
}

// ─── CompareIconButton — versão compacta para colocar inline no card ─────────

function CompareIconButton({
  property,
}: {
  property: PropertyCardProps['property']
}) {
  const [active, setActive] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setActive(isInCompare(property.id))
    const onChange = () => setActive(isInCompare(property.id))
    window.addEventListener(COMPARE_EVENT, onChange)
    return () => window.removeEventListener(COMPARE_EVENT, onChange)
  }, [property.id])

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const { added, full } = toggleCompare({
      id: property.id,
      titulo: property.titulo,
      preco: property.preco,
      finalidade: property.finalidade,
      tipo: property.tipo,
      bairro: property.bairro,
      cidade: property.cidade,
      area_total: property.area_total,
      quartos: property.quartos,
      banheiros: property.banheiros,
      vagas: property.vagas ?? 0,
      fotos: property.fotos,
      href: `/imovel/${property.id}`,
      preco_condominio: property.preco_condominio,
      preco_iptu: property.preco_iptu,
    })
    if (full) {
      toast.error(`Limite de ${COMPARE_MAX} imóveis no comparador.`)
      return
    }
    toast.success(added ? 'Adicionado ao comparador' : 'Removido do comparador')
  }

  if (!mounted) return null

  const Icon = active ? Check : GitCompare
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? 'Remover do comparador' : 'Adicionar ao comparador'}
      className={cn(
        'inline-flex items-center justify-center',
        'h-9 w-9 rounded-full transition-colors duration-150',
        active
          ? 'bg-[#010744] text-[#f2d22e]'
          : 'bg-gray-50 text-gray-500 hover:bg-[#010744] hover:text-white',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2',
        'cursor-pointer',
      )}
    >
      <Icon size={16} aria-hidden="true" />
    </button>
  )
}

// ─── PropertyCard ─────────────────────────────────────────────────────────────

export function PropertyCard({
  property,
  priority = false,
  aspect = 'card',
  premiumThreshold = 1_000_000,
}: PropertyCardProps) {
  const photos = (property.fotos.length > 0 ? property.fotos : [PLACEHOLDER]).slice(0, 5)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [imgErr, setImgErr] = useState<Record<number, boolean>>({})
  const hasMultiple = photos.length > 1
  const touchStartX = useRef<number | null>(null)

  function nextPhoto(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setPhotoIdx((i) => (i + 1) % photos.length)
  }
  function prevPhoto(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setPhotoIdx((i) => (i - 1 + photos.length) % photos.length)
  }
  function goToPhoto(i: number, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setPhotoIdx(i)
  }
  // Swipe gesture — acessibilidade mobile (sem hover, sem setas em pointer:coarse)
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const SWIPE_THRESHOLD = 40
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx < 0) nextPhoto()
      else prevPhoto()
    }
    touchStartX.current = null
  }

  // Heurística para badges promocionais
  const precoAnterior = (property as Property & { preco_anterior?: number }).preco_anterior
  const isLaunch = (property as Property & { lancamento?: boolean }).lancamento === true
  const priceDropped = !!(precoAnterior && precoAnterior > property.preco)
  const isPremium =
    property.finalidade === 'Venda' &&
    property.preco >= premiumThreshold &&
    !isLaunch

  const aspectClass = aspect === 'square' ? 'aspect-square' : 'aspect-[16/9] sm:aspect-[4/3]'

  return (
    <article
      className="group relative overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300
                 motion-safe:hover:-translate-y-1 hover:shadow-xl"
    >
      {/* Favorite — único elemento no canto superior direito da imagem. */}
      <div className="absolute right-3 top-3 z-20">
        <FavoriteButton propertyId={property.id} />
      </div>

      <Link href={`/imovel/${property.id}`} className="block">
        {/* Image area com swipe-touch (mobile) e setas hover (desktop, pointer:fine) */}
        <div
          className={`relative ${aspectClass} overflow-hidden bg-gray-100`}
          onTouchStart={hasMultiple ? onTouchStart : undefined}
          onTouchEnd={hasMultiple ? onTouchEnd : undefined}
        >
          {photos.map((src, i) => {
            const finalSrc = imgErr[i] ? PLACEHOLDER : src
            const imgEl = (
              <Image
                src={finalSrc}
                alt={i === 0 ? property.titulo : `${property.titulo} — foto ${i + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={cn(
                  'object-cover transition-opacity duration-500',
                  i === photoIdx ? 'opacity-100' : 'opacity-0',
                  'motion-safe:group-hover:scale-105',
                )}
                priority={i === 0 ? priority : false}
                loading={i === 0 ? undefined : 'lazy'}
                onError={() => setImgErr((prev) => ({ ...prev, [i]: true }))}
              />
            )
            return i === 0 ? (
              <ViewTransition key={i} name={`property-photo-${property.id}`}>
                {imgEl}
              </ViewTransition>
            ) : (
              <span key={i} className="contents">
                {imgEl}
              </span>
            )
          })}

          {/* Setas — 44×44, só em pointer:fine (desktop hover); escondidas em coarse */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={prevPhoto}
                aria-label="Foto anterior"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-white/90 backdrop-blur-sm
                           text-[#010744] shadow-md flex items-center justify-center
                           opacity-0 group-hover:opacity-100 transition-opacity duration-200
                           hover:bg-white focus-visible:opacity-100 focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2
                           cursor-pointer
                           [@media(pointer:coarse)]:hidden"
              >
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={nextPhoto}
                aria-label="Próxima foto"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-white/90 backdrop-blur-sm
                           text-[#010744] shadow-md flex items-center justify-center
                           opacity-0 group-hover:opacity-100 transition-opacity duration-200
                           hover:bg-white focus-visible:opacity-100 focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2
                           cursor-pointer
                           [@media(pointer:coarse)]:hidden"
              >
                <ChevronRight size={20} aria-hidden="true" />
              </button>

              {/* Dots — clicáveis com touch target ampliado via padding invisível */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => goToPhoto(i, e)}
                    aria-label={`Ir para foto ${i + 1} de ${photos.length}`}
                    aria-current={i === photoIdx ? 'true' : undefined}
                    className="p-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-1 rounded-full"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'block h-1.5 rounded-full transition-all duration-200',
                        i === photoIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/60',
                      )}
                    />
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Pílula primária canto superior esquerdo — tipo · finalidade */}
          <div className="absolute left-3 top-3 z-10 max-w-[calc(100%-4rem)]">
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-[#010744]/85
                         backdrop-blur-sm px-3 py-1 text-[11px] font-semibold uppercase
                         tracking-wide text-white shadow-md"
            >
              <span className="truncate">{property.tipo}</span>
              <span aria-hidden="true" className="opacity-50">·</span>
              <span
                className={cn(
                  'truncate',
                  property.finalidade === 'Venda' ? 'text-[#f2d22e]' : 'text-white',
                )}
              >
                {property.finalidade}
              </span>
            </span>
          </div>

          {/* Selo de status — UM único chip por prioridade (Lançamento > Baixou > Premium > Destaque) */}
          {(isLaunch || priceDropped || isPremium || property.destaque) && (
            <div className="absolute bottom-3 left-3 z-10">
              {isLaunch ? (
                <Badge variant="launch">Lançamento</Badge>
              ) : priceDropped ? (
                <Badge variant="priceDrop">Baixou de preço</Badge>
              ) : isPremium ? (
                <Badge variant="exclusive">Morejá Premium</Badge>
              ) : (
                <Badge variant="exclusive">Destaque</Badge>
              )}
            </div>
          )}
        </div>

        {/* Content — padding p-5 sm:p-6 (respiração premium) */}
        <div className="p-5 sm:p-6">
          {/* Eyebrow editorial: bairro · cidade. Sem MapPin (decoração); cor com contraste AA */}
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#010744]/65">
            <span className="truncate">
              {property.bairro}
              {property.cidade && (
                <span className="text-[#010744]/40"> · {property.cidade}</span>
              )}
            </span>
          </div>

          {/* Título — text-balance + min-h reservada para 2 linhas (sem pulo no grid) */}
          <h3
            className="mb-3 line-clamp-2 min-h-[3rem] text-base font-semibold leading-snug text-[#010744]
                       text-balance
                       transition-colors group-hover:underline group-hover:underline-offset-4
                       group-hover:decoration-[#f2d22e] group-hover:decoration-1"
          >
            {property.titulo}
          </h3>

          {/* Price — text-2xl + tabular-nums + preço anterior riscado quando aplicável */}
          <div className="mb-4 flex items-baseline gap-2 flex-wrap">
            <p className="text-2xl sm:text-[1.6rem] font-bold tracking-tight tabular-nums text-[#010744]">
              {formatPrice(property.preco)}
              {property.finalidade === 'Locação' && (
                <span className="ml-0.5 text-sm font-normal text-gray-500">/mês</span>
              )}
            </p>
            {priceDropped && precoAnterior && (
              <span
                className="text-sm text-gray-400 line-through tabular-nums"
                aria-label={`Preço anterior ${formatPrice(precoAnterior)}`}
              >
                {formatPrice(precoAnterior)}
              </span>
            )}
          </div>

          {/* Features — tabular-nums em todos os números, ícones consistentes em navy */}
          <div className="flex items-center gap-3 border-t border-gray-100 pt-3 text-sm text-gray-600">
            {property.quartos > 0 && (
              <span className="flex items-center gap-1 whitespace-nowrap tabular-nums">
                <Bed size={15} className="text-[#010744]" aria-label="Quartos" />
                {property.quartos}
              </span>
            )}
            {property.banheiros > 0 && (
              <span className="flex items-center gap-1 whitespace-nowrap tabular-nums">
                <Bath size={15} className="text-[#010744]" aria-label="Banheiros" />
                {property.banheiros}
              </span>
            )}
            {property.vagas != null && property.vagas > 0 && (
              <span className="flex items-center gap-1 whitespace-nowrap tabular-nums">
                <Car size={15} className="text-[#010744]" aria-label="Vagas" />
                {property.vagas}
              </span>
            )}
            {property.area_total > 0 && (
              <span className="ml-auto flex items-center gap-1 whitespace-nowrap tabular-nums">
                <Maximize2 size={14} className="text-[#010744]" aria-label="Área" />
                {formatArea(property.area_total)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* CompareToggle inline — icon-only no canto inferior direito do conteúdo,
          fora do <Link> para não disparar navegação. Substituí o bloco com border-t
          que fragmentava o card em 3 faixas. */}
      <div className="absolute bottom-3 right-3 z-10">
        <CompareIconButton property={property} />
      </div>
    </article>
  )
}

// ─── PropertyCardSkeleton ─────────────────────────────────────────────────────

export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-md" aria-hidden="true">
      <div className="skeleton-shimmer aspect-[16/9] sm:aspect-[4/3]" />
      <div className="space-y-3 p-5 sm:p-6">
        <div className="skeleton-shimmer h-3 w-1/3 rounded-md" />
        <div className="skeleton-shimmer h-4 w-3/4 rounded-md" />
        <div className="skeleton-shimmer h-4 w-1/2 rounded-md" />
        <div className="skeleton-shimmer h-7 w-2/5 rounded-md" />
        <div className="flex gap-3 border-t border-gray-100 pt-3">
          <div className="skeleton-shimmer h-3 w-8 rounded-md" />
          <div className="skeleton-shimmer h-3 w-8 rounded-md" />
          <div className="skeleton-shimmer h-3 w-16 rounded-md ml-auto" />
        </div>
      </div>
    </div>
  )
}
