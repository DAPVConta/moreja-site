'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'

const STORAGE_KEY = 'moreja:favorites'

function readFavorites(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : []
  } catch {
    return []
  }
}

function writeFavorites(ids: string[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    /* quota exceeded */
  }
}

interface SaveButtonProps {
  propertyId: string
  /** Variante visual: 'pill' (action bar mobile) ou 'icon' (canto da galeria) */
  variant?: 'pill' | 'icon'
  className?: string
}

export function SaveButton({ propertyId, variant = 'pill', className = '' }: SaveButtonProps) {
  const [saved, setSaved] = useState(false)

  // Hidrata do localStorage no client
  useEffect(() => {
    const favs = readFavorites()
    setSaved(favs.includes(propertyId))
  }, [propertyId])

  function toggle() {
    const favs = readFavorites()
    const next = saved ? favs.filter((id) => id !== propertyId) : [...favs, propertyId]
    writeFavorites(next)
    setSaved(!saved)

    // Haptic feedback opcional (suporte limitado mas grátis no Android)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={saved ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
        aria-pressed={saved}
        className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm shadow-md hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2 ${className}`}
      >
        <Heart
          size={18}
          className={saved ? 'fill-red-500 text-red-500' : 'text-gray-600'}
          aria-hidden="true"
        />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={saved ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
      aria-pressed={saved}
      className={`flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-lg font-semibold text-sm border-2 transition-colors active:scale-[0.98] ${
        saved
          ? 'bg-red-50 border-red-300 text-red-600'
          : 'border-gray-200 text-gray-700 hover:border-[#010744]'
      } ${className}`}
    >
      <Heart
        size={18}
        className={saved ? 'fill-red-500 text-red-500' : ''}
        aria-hidden="true"
      />
      {saved ? 'Salvo' : 'Salvar'}
    </button>
  )
}
