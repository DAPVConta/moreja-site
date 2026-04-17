'use client'

import { Share2, Check } from 'lucide-react'
import { useState } from 'react'

export function ShareButtonClient({ titulo }: { titulo: string }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, url })
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="w-full mb-4 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-600" />
          Link copiado!
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Compartilhar imóvel
        </>
      )}
    </button>
  )
}
