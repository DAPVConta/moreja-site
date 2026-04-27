'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Banner } from '@/types/site'

interface BannersSectionProps {
  banners: Banner[]
  autoplay?: boolean
  intervalSeconds?: number
}

export function BannersSection({ banners, autoplay = true, intervalSeconds = 5 }: BannersSectionProps) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const multi = banners.length > 1
  const intervalMs = Math.max(1, intervalSeconds) * 1000

  const go = (index: number) => {
    if (banners.length === 0) return
    setCurrent((index + banners.length) % banners.length)
  }

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (multi && autoplay) {
      timerRef.current = setTimeout(() => setCurrent((p) => (p + 1) % banners.length), intervalMs)
    }
  }

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, banners.length])

  if (banners.length === 0) return null

  const banner = banners[current]
  void banner

  return (
    // Wrapper com respiro vertical para destacar o banner do que vem
    // antes/depois (antes ele ficava grudado no container superior).
    <section className="py-8 sm:py-12 lg:py-16 bg-white">
      <div className="container-page">
        <div
          className="
            relative w-full overflow-hidden
            rounded-2xl shadow-xl shadow-[#010744]/10
            aspect-[3/2] md:aspect-[12/5]
          "
          onMouseEnter={() => { if (timerRef.current) clearTimeout(timerRef.current) }}
          onMouseLeave={resetTimer}
        >
          {banners.map((b, i) => {
            const hasMobile = !!b.mobile_image_url
            return (
              <div
                key={b.id}
                className="absolute inset-0 transition-opacity duration-700"
                style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}
                aria-hidden={i !== current}
              >
                {b.image_url && (
                  <>
                    {hasMobile && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.mobile_image_url!}
                        alt={b.title ?? ''}
                        className="w-full h-full object-cover md:hidden"
                        draggable={false}
                      />
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.image_url}
                      alt={b.title ?? ''}
                      className={`w-full h-full object-cover ${hasMobile ? 'hidden md:block' : ''}`}
                      draggable={false}
                    />
                  </>
                )}

                {(b.title || b.subtitle || b.cta_text) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-black/30 to-black/10">
                    <div className="text-center text-white px-4 max-w-2xl">
                      {b.title && (
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold drop-shadow-lg mb-2">
                          {b.title}
                        </h2>
                      )}
                      {b.subtitle && (
                        <p className="text-sm sm:text-base md:text-lg text-gray-100 drop-shadow mb-5">
                          {b.subtitle}
                        </p>
                      )}
                      {b.cta_text && b.cta_link && (
                        <Link
                          href={b.cta_link}
                          className="inline-block bg-[#f2d22e] text-[#010744] font-bold px-6 py-3 rounded-xl text-sm sm:text-base hover:bg-[#e0c22a] transition-colors"
                        >
                          {b.cta_text}
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {multi && (
            <>
              <button
                onClick={() => { go(current - 1); resetTimer() }}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors z-10 backdrop-blur-sm"
                aria-label="Banner anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => { go(current + 1); resetTimer() }}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors z-10 backdrop-blur-sm"
                aria-label="Próximo banner"
              >
                <ChevronRight size={20} />
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { go(i); resetTimer() }}
                    className={`h-2 rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/70'}`}
                    aria-label={`Ir para banner ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
