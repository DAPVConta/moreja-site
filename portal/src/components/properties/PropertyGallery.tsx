'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'

interface PropertyGalleryProps {
  fotos: string[]
  titulo: string
}

export function PropertyGallery({ fotos, titulo }: PropertyGalleryProps) {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  if (fotos.length === 0) {
    return (
      <div className="aspect-[16/9] bg-gray-200 rounded-xl flex items-center justify-center">
        <span className="text-gray-400">Sem fotos disponíveis</span>
      </div>
    )
  }

  const prev = () => setCurrent((c) => (c - 1 + fotos.length) % fotos.length)
  const next = () => setCurrent((c) => (c + 1) % fotos.length)

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Main image */}
        <div
          className="relative aspect-[16/9] cursor-zoom-in group"
          onClick={() => setLightbox(true)}
        >
          <Image
            src={fotos[current] ?? ''}
            alt={`${titulo} – foto ${current + 1}`}
            fill
            className="object-cover"
            priority={current === 0}
            sizes="(max-width: 768px) 100vw, 66vw"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
          </div>

          {fotos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                aria-label="Próxima foto"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                {current + 1} / {fotos.length}
              </span>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {fotos.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto">
            {fotos.slice(0, 10).map((foto, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`relative w-16 h-12 shrink-0 rounded-lg overflow-hidden transition-all ${
                  i === current ? 'ring-2 ring-[#010744]' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <Image src={foto} alt={`Miniatura ${i + 1}`} fill className="object-cover" sizes="64px" />
              </button>
            ))}
            {fotos.length > 10 && (
              <div className="w-16 h-12 shrink-0 rounded-lg bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium">
                +{fotos.length - 10}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
            onClick={() => setLightbox(false)}
            aria-label="Fechar"
          >
            <X className="w-8 h-8" />
          </button>

          {fotos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center"
                aria-label="Próxima foto"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          )}

          <div
            className="relative w-full max-w-5xl max-h-[80vh] aspect-[16/9] px-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={fotos[current] ?? ''}
              alt={`${titulo} – foto ${current + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          <p className="absolute bottom-4 text-white/70 text-sm">
            {current + 1} / {fotos.length}
          </p>
        </div>
      )}
    </>
  )
}
