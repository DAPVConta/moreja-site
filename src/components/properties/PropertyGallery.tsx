'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'

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

  // Lock body scroll while lightbox is open
  useEffect(() => {
    if (lightbox) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
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
    // threshold 40px horizontal, mostly horizontal motion
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

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Main image */}
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

        {/* Thumbnails */}
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

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center select-none"
          onClick={() => setLightbox(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="dialog"
          aria-modal="true"
          aria-label="Galeria de fotos"
        >
          <button
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-12 h-12 inline-flex items-center justify-center text-white hover:text-gray-300 bg-black/40 hover:bg-black/60 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e]"
            onClick={(e) => { e.stopPropagation(); setLightbox(false) }}
            aria-label="Fechar"
          >
            <X className="w-7 h-7" />
          </button>

          {fotos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e]"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e]"
                aria-label="Próxima foto"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          )}

          <div
            className="relative w-full h-full max-w-6xl px-3 sm:px-16 py-12"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={fotos[current] ?? ''}
              alt={`${titulo} – foto ${current + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          <p className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs sm:text-sm px-3 py-1 rounded-full">
            {current + 1} / {fotos.length}
          </p>
        </div>
      )}
    </>
  )
}
