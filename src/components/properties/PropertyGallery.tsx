'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X, ZoomIn, Images } from 'lucide-react'

interface PropertyGalleryProps {
  fotos: string[]
  titulo: string
}

export function PropertyGallery({ fotos, titulo }: PropertyGalleryProps) {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const prev = () => setCurrent((c) => (c - 1 + fotos.length) % fotos.length)
  const next = () => setCurrent((c) => (c + 1) % fotos.length)

  function openLightboxAt(index: number) {
    setCurrent(index)
    setLightbox(true)
  }

  // Lock body scroll while lightbox is open
  useEffect(() => {
    if (!lightbox) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [lightbox])

  // Keyboard navigation while lightbox is open
  useEffect(() => {
    if (!lightbox) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(false)
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, fotos.length])

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    touchStart.current = null
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next()
      else prev()
    }
  }

  if (fotos.length === 0) {
    return (
      <div className="aspect-[4/3] sm:aspect-[16/9] bg-gray-200 rounded-xl flex items-center justify-center">
        <span className="text-gray-400">Sem fotos disponíveis</span>
      </div>
    )
  }

  // Mosaico desktop usa as 4 fotos seguintes à principal.
  // Se faltarem fotos, a posição fica invisível e o grid se ajusta.
  const mosaicThumbs = fotos.slice(1, 5)
  const remainingCount = Math.max(0, fotos.length - 5)

  return (
    <>
      {/* ───────────── DESKTOP ─ Mosaico 1+4 ───────────── */}
      <div className="hidden lg:block relative">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 aspect-[16/9] rounded-2xl overflow-hidden">
          {/* Foto principal — col-span-2 row-span-2 */}
          <button
            type="button"
            onClick={() => openLightboxAt(0)}
            className="relative col-span-2 row-span-2 cursor-zoom-in group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2"
            aria-label="Abrir galeria em tela cheia"
          >
            <Image
              src={fotos[0]}
              alt={`${titulo} – foto principal`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              priority
              sizes="50vw"
              draggable={false}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>

          {/* 4 thumbnails 2x2 — preencher com placeholder cinza se faltar */}
          {mosaicThumbs.map((foto, i) => {
            const isLastVisible = i === 3 && remainingCount > 0
            return (
              <button
                key={i}
                type="button"
                onClick={() => openLightboxAt(i + 1)}
                className="relative cursor-zoom-in group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2"
                aria-label={`Ver foto ${i + 2}`}
              >
                <Image
                  src={foto}
                  alt={`${titulo} – foto ${i + 2}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  sizes="25vw"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                {isLastVisible && (
                  <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-base font-semibold">
                    +{remainingCount} fotos
                  </div>
                )}
              </button>
            )
          })}

          {/* Preencher slots vazios para manter o grid */}
          {Array.from({ length: Math.max(0, 4 - mosaicThumbs.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-gray-100" />
          ))}
        </div>

        <button
          type="button"
          onClick={() => openLightboxAt(0)}
          className="absolute bottom-4 right-4 inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm text-[#010744] font-semibold px-4 py-2 rounded-full shadow-md hover:bg-white transition-colors"
        >
          <Images size={16} aria-hidden="true" />
          Ver todas as {fotos.length} fotos
        </button>
      </div>

      {/* ───────────── MOBILE/TABLET ─ Imagem principal + carrossel de thumbs ───────────── */}
      <div className="lg:hidden bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div
          className="relative aspect-[4/3] sm:aspect-[16/9] cursor-zoom-in group select-none"
          onClick={() => setLightbox(true)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="button"
          aria-label="Abrir galeria em tela cheia"
        >
          <Image
            src={fotos[current] ?? ''}
            alt={`${titulo} – foto ${current + 1}`}
            fill
            className="object-cover"
            priority={current === 0}
            sizes="(max-width: 768px) 100vw, 66vw"
            draggable={false}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
          </div>

          {fotos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e]"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e]"
                aria-label="Próxima foto"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                {current + 1} / {fotos.length}
              </span>
            </>
          )}
        </div>

        {fotos.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto scrollbar-thin [-webkit-overflow-scrolling:touch]">
            {fotos.slice(0, 10).map((foto, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`relative w-20 h-16 sm:w-16 sm:h-12 shrink-0 rounded-lg overflow-hidden transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#010744] ${
                  i === current ? 'ring-2 ring-[#010744]' : 'opacity-60 hover:opacity-100'
                }`}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === current ? 'true' : undefined}
              >
                <Image src={foto} alt="" fill className="object-cover" sizes="80px" />
              </button>
            ))}
            {fotos.length > 10 && (
              <div className="w-20 h-16 sm:w-16 sm:h-12 shrink-0 rounded-lg bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium">
                +{fotos.length - 10}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ───────────── Lightbox ───────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex flex-col select-none"
          onClick={() => setLightbox(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="dialog"
          aria-modal="true"
          aria-label="Galeria de fotos"
        >
          {/* Top bar do lightbox */}
          <div
            className="flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16 shrink-0 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-sm sm:text-base font-medium">
              {current + 1} <span className="text-white/50">/</span> {fotos.length}
            </span>
            <button
              className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e]"
              onClick={() => setLightbox(false)}
              aria-label="Fechar galeria"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Imagem principal */}
          <div
            className="relative flex-1 px-3 sm:px-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={fotos[current] ?? ''}
              alt={`${titulo} – foto ${current + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />

            {fotos.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/15 hover:bg-white/25 text-white rounded-full items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e]"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                <button
                  onClick={next}
                  className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/15 hover:bg-white/25 text-white rounded-full items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e]"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              </>
            )}
          </div>

          {/* Tira de miniaturas no rodapé */}
          {fotos.length > 1 && (
            <div
              className="shrink-0 px-3 sm:px-6 pb-4 pt-2"
              onClick={(e) => e.stopPropagation()}
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              <div className="flex gap-2 overflow-x-auto scrollbar-thin [-webkit-overflow-scrolling:touch]">
                {fotos.map((foto, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`relative w-16 h-12 sm:w-20 sm:h-14 shrink-0 rounded-md overflow-hidden transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] ${
                      i === current ? 'ring-2 ring-[#f2d22e] opacity-100' : 'opacity-50 hover:opacity-100'
                    }`}
                    aria-label={`Ver foto ${i + 1}`}
                    aria-current={i === current ? 'true' : undefined}
                  >
                    <Image src={foto} alt="" fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
