'use client'

import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'

interface WhatsAppFabProps {
  /** Número com DDI, ex: 5511999999999 */
  whatsapp?: string
  /** Mensagem inicial pré-preenchida (será URL-encoded) */
  message?: string
}

/**
 * Botão flutuante de WhatsApp visível em todas as páginas após o
 * usuário rolar > 200px (evita competir com o hero). Aparece com
 * fade + scale; respeita prefers-reduced-motion via tokens.
 */
export function WhatsAppFab({
  whatsapp,
  message = 'Olá! Vim pelo site da Morejá e gostaria de mais informações.',
}: WhatsAppFabProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!whatsapp) return
    const onScroll = () => setVisible(window.scrollY > 200)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [whatsapp])

  if (!whatsapp) return null

  const digits = whatsapp.replace(/\D/g, '')
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className={`
        fixed z-40 right-4 sm:right-6
        bottom-4 sm:bottom-6
        flex items-center justify-center
        w-14 h-14 sm:w-16 sm:h-16 rounded-full
        bg-green-500 hover:bg-green-600 active:bg-green-700
        text-white shadow-xl shadow-green-500/30
        transition-all duration-300 ease-out
        focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-300
        ${visible ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-75 pointer-events-none'}
      `}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Pulse ring discreto */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-green-500/40 animate-ping opacity-50"
        style={{ animationDuration: '2.5s' }}
      />
      <MessageCircle size={26} strokeWidth={2} className="relative z-10" aria-hidden="true" />
    </a>
  )
}
