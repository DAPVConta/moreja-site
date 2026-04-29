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
        'inline-flex items-center justify-center shrink-0',
        // 44×44 atende WCAG 2.5.5 (touch target). Padding negativo via -m
        // para não quebrar o ritmo da stats row que vive em text-sm/14px.
        'h-11 w-11 -my-2 rounded-full transition-colors duration-150',
        active
          ? 'bg-[#010744] text-[#f2d22e] border border-[#010744]'
          : 'bg-white border border-[#010744]/15 text-[#010744]/70 hover:border-[#f2d22e] hover:text-[#010744]',
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
            const isActive = i === photoIdx
            const imgEl = (
              <Image
                src={finalSrc}
                alt={i === 0 ? property.titulo : `${property.titulo} — foto ${i + 1}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={cn(
                  'object-cover transition-opacity duration-500',
                  isActive ? 'opacity-100' : 'opacity-0',
                  'motion-safe:group-hover:scale-105',
                )}
                priority={i === 0 ? priority : false}
                loading={i === 0 ? undefined : 'lazy'}
                onError={() => setImgErr((prev) => ({ ...prev, [i]: true }))}
              />
            )
            // aria-hidden nas fotos não-ativas para leitores de tela não lerem
            // todas as 5 imagens (detail nice-to-have da rodada 2)
            return i === 0 ? (
              <ViewTransition key={i} name={`property-photo-${property.id}`}>
                {imgEl}
              </ViewTransition>
            ) : (
              <span key={i} className="contents" aria-hidden={!isActive}>
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

          {/* Pílula primária canto superior esquerdo — APENAS finalidade.
              Tipo (Apartamento/Casa/etc) está implícito no título e foi cortado
              por causar truncate quando longo (e por ser redundante — minimalist
              da rodada 2 ganhou). Letra maior + tracking para sustentar peso. */}
          <div className="absolute left-3 top-3 z-10">
            <span
              className={cn(
                'inline-flex items-center rounded-full backdrop-blur-sm px-3 py-1.5',
                'text-[11px] font-bold uppercase tracking-[0.18em] shadow-md',
                property.finalidade === 'Venda'
                  ? 'bg-[#010744]/85 text-[#f2d22e]'
                  : 'bg-[#010744]/85 text-white',
              )}
            >
              {property.finalidade}
            </span>
          </div>

          {/* Selo de URGÊNCIA — apenas Lançamento ou Baixou de preço sobre a
              foto. Premium/Destaque (qualidade) viraram microtag inline com o
              preço (ver bloco de conteúdo). Reduz competição visual sobre a foto. */}
          {(isLaunch || priceDropped) && (
            <div className="absolute bottom-3 left-3 z-10">
              {isLaunch ? (
                <Badge variant="launch">Lançamento</Badge>
              ) : (
                <Badge variant="priceDrop">Baixou de preço</Badge>
              )}
            </div>
          )}
        </div>

        {/* Content — padding reduzido para liberar espaço horizontal pro
            preço e título não estourarem em cards estreitos. */}
        <div className="p-4 sm:p-5">
          {/* Eyebrow editorial: bairro · cidade */}
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#010744]/65">
            <span className="truncate block">
              {property.bairro}
              {property.cidade && (
                <span className="text-[#010744]/55"> · {property.cidade}</span>
              )}
            </span>
          </div>

          {/* Título — text-[15px] em mobile (era text-base/16px) para caber em
              cards estreitos sem quebrar em 3 linhas. min-h-[2.5rem] = 40px =
              2 × leading-5/20px. text-balance evita órfã/viúva. */}
          <h3
            className="mb-2.5 line-clamp-2 min-h-[2.5rem] text-[15px] font-semibold leading-5 text-[#010744]
                       text-balance
                       transition-colors group-hover:underline group-hover:underline-offset-[5px]
                       group-hover:decoration-[#010744] group-hover:decoration-2"
          >
            {property.titulo}
          </h3>

          {/* Price + microtag de qualidade. text-xl mobile / text-2xl desktop
              evita overflow de "R$ 2.100.000" em cards de ~280px. */}
          <div className="mb-3 flex items-baseline gap-2 flex-wrap">
            <p className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums text-[#010744]">
              {formatPrice(property.preco)}
              {property.finalidade === 'Locação' && (
                <span className="ml-0.5 text-xs font-normal text-gray-500">/mês</span>
              )}
            </p>
            {priceDropped && precoAnterior && (
              <span
                className="text-xs text-gray-400 line-through tabular-nums"
                aria-label={`Preço anterior ${formatPrice(precoAnterior)}`}
              >
                {formatPrice(precoAnterior)}
              </span>
            )}
            {(isPremium || (property.destaque && !isLaunch && !priceDropped)) && (
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full',
                  'text-[10px] font-bold uppercase tracking-wider',
                  isPremium
                    ? 'bg-[#f2d22e] text-[#010744]'
                    : 'bg-[#010744]/10 text-[#010744]',
                )}
              >
                {isPremium ? 'Premium' : 'Destaque'}
              </span>
            )}
          </div>

          {/* Features — pr-10 reserva espaço para o CompareIconButton absolute,
              evitando que o número da área seja cortado em cards estreitos. */}
          <div className="flex items-center gap-2.5 border-t border-gray-100 pt-2.5 pr-10 text-[13px] text-gray-600">
            {property.quartos > 0 && (
              <span className="flex items-center gap-1 whitespace-nowrap tabular-nums">
                <Bed size={14} className="text-[#010744]" aria-label="Quartos" />
                {property.quartos}
              </span>
            )}
            {property.banheiros > 0 && (
              <span className="flex items-center gap-1 whitespace-nowrap tabular-nums">
                <Bath size={14} className="text-[#010744]" aria-label="Banheiros" />
                {property.banheiros}
              </span>
            )}
            {property.vagas != null && property.vagas > 0 && (
              <span className="flex items-center gap-1 whitespace-nowrap tabular-nums">
                <Car size={14} className="text-[#010744]" aria-label="Vagas" />
                {property.vagas}
              </span>
            )}
            {property.area_total > 0 && (
              <span className="ml-auto flex items-center gap-1 whitespace-nowrap tabular-nums">
                <Maximize2 size={13} className="text-[#010744]" aria-label="Área" />
                {formatArea(property.area_total)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Compare — fora do <Link> (HTML5 não permite <button> dentro de <a>),
          posicionado absolute. pr-10 da stats row reserva o espaço para
          ele NÃO cobrir o número da área. */}
      <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10">
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
      <div className="space-y-2.5 p-4 sm:p-5">
        <div className="skeleton-shimmer h-3 w-1/3 rounded-md" />
        <div className="skeleton-shimmer h-4 w-3/4 rounded-md" />
        <div className="skeleton-shimmer h-4 w-1/2 rounded-md" />
        <div className="skeleton-shimmer h-6 w-2/5 rounded-md" />
        <div className="flex gap-2.5 border-t border-gray-100 pt-2.5">
          <div className="skeleton-shimmer h-3 w-7 rounded-md" />
          <div className="skeleton-shimmer h-3 w-7 rounded-md" />
          <div className="skeleton-shimmer h-3 w-14 rounded-md ml-auto" />
        </div>
      </div>
    </div>
  )
}
