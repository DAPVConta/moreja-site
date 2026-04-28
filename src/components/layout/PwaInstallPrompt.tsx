'use client'

import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

const VIEW_COUNT_KEY = 'moreja:pageview-count'
const DISMISS_KEY = 'moreja:pwa-dismissed'
const SHOW_AT = 3 // mostra após 3 page views (sinal de intenção)

/**
 * PWA install prompt deferred:
 *   - Captura `beforeinstallprompt` (Chrome/Edge/Android)
 *   - Suprime o banner nativo do browser
 *   - Mostra banner próprio só após o usuário ter visualizado SHOW_AT páginas
 *   - Persiste dismissal por 30 dias
 *
 * iOS Safari: não dispara `beforeinstallprompt`. O banner mostra instruções
 * "Compartilhar → Adicionar à Tela de Início" como fallback.
 */
export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [open, setOpen] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Detecta iOS (sem suporte a beforeinstallprompt)
    const ua = navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)

    if (standalone) return // Já instalado, não mostrar

    setIsIOS(ios)

    // Conta page views (signal de intenção)
    let count = 0
    try {
      count = Number(localStorage.getItem(VIEW_COUNT_KEY) ?? '0') + 1
      localStorage.setItem(VIEW_COUNT_KEY, String(count))
    } catch {
      /* ignore */
    }

    // Verifica dismissal recente (30 dias)
    try {
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? '0')
      if (dismissedAt && Date.now() - dismissedAt < 30 * 24 * 60 * 60 * 1000) return
    } catch {
      /* ignore */
    }

    if (ios && count >= SHOW_AT) {
      // iOS: mostra banner com instruções (sem prompt nativo)
      setOpen(true)
      return
    }

    // Android/Desktop Chrome: aguarda evento beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      if (count >= SHOW_AT) setOpen(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    setOpen(false)
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      /* ignore */
    }
  }

  const install = async () => {
    if (!deferred) return
    deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') {
      setOpen(false)
    } else {
      dismiss()
    }
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-desc"
      className="fixed inset-x-3 bottom-3 z-[55] mx-auto max-w-md rounded-2xl bg-white p-4 shadow-2xl
                 ring-1 ring-black/5 sm:bottom-6 sm:inset-x-auto sm:right-6
                 animate-in slide-in-from-bottom-4 duration-300"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#010744] text-[#f2d22e]">
          <Download size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 id="pwa-install-title" className="text-sm font-bold text-[#010744]">
            Instalar Morejá
          </h3>
          <p id="pwa-install-desc" className="mt-0.5 text-xs text-gray-600 leading-relaxed">
            {isIOS
              ? 'Toque em "Compartilhar" e depois "Adicionar à Tela de Início".'
              : 'Acesse mais rápido — instale como app, sem ocupar espaço da App Store.'}
          </p>
          <div className="mt-3 flex gap-2">
            {!isIOS && deferred && (
              <button
                type="button"
                onClick={install}
                className="inline-flex h-9 items-center rounded-lg bg-[#f2d22e] px-3 text-sm font-semibold text-[#010744]
                           transition-all hover:brightness-105 active:scale-[0.98]
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e]"
              >
                Instalar
              </button>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex h-9 items-center rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-600
                         transition-colors hover:border-gray-300 hover:text-[#010744]"
            >
              Agora não
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400
                     transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
