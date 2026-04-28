'use client'

import { useEffect, useState } from 'react'
import { Cookie, Settings2, Check } from 'lucide-react'
import {
  readConsent,
  writeConsent,
  applyConsentToTags,
  type ConsentState,
} from '@/lib/consent'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'

/**
 * Banner LGPD com:
 *   - Aceitar todos
 *   - Recusar (apenas funcional)
 *   - Personalizar (abre Sheet com toggle por categoria)
 *
 * Conforma com Lei 13.709/2018 (LGPD): coleta de consentimento granular,
 * livre, informado e específico. Nada dispara antes do banner ser respondido.
 *
 * Aplica Google Consent Mode v2 nos sinais do gtag/dataLayer (analytics_
 * storage, ad_storage etc.) — Meta Pixel e Clarity respeitam o gate via
 * canFireAnalytics()/canFireMarketing() em PixelEvents.
 */
export function CookieConsent() {
  const [open, setOpen] = useState(false)
  const [customize, setCustomize] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const existing = readConsent()
    if (!existing || existing.status === 'pending') {
      setOpen(true)
    } else {
      // Re-aplica gtag consent caso o page tenha hard-reload
      applyConsentToTags(existing)
    }
  }, [])

  const persist = (state: Omit<ConsentState, 'timestamp'>) => {
    writeConsent(state)
    setOpen(false)
    setCustomize(false)
  }

  const acceptAll = () =>
    persist({ status: 'granted', analytics: true, marketing: true, functional: true })

  const rejectAll = () =>
    persist({ status: 'denied', analytics: false, marketing: false, functional: true })

  const saveCustom = () =>
    persist({
      status: analytics && marketing ? 'granted' : analytics || marketing ? 'partial' : 'denied',
      analytics,
      marketing,
      functional: true,
    })

  if (!open) return null

  return (
    <>
      {/* Banner principal */}
      {!customize && (
        <div
          role="dialog"
          aria-labelledby="cc-title"
          aria-describedby="cc-desc"
          className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-2xl rounded-2xl bg-white p-5 shadow-2xl
                     ring-1 ring-black/10 sm:bottom-6 sm:p-6
                     animate-in slide-in-from-bottom-4 duration-300"
          style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#010744] text-[#f2d22e]">
              <Cookie size={20} />
            </div>
            <div className="flex-1">
              <h3 id="cc-title" className="text-base font-bold text-[#010744]">
                Sua privacidade é importante
              </h3>
              <p id="cc-desc" className="mt-1 text-sm text-gray-600 leading-relaxed">
                Usamos cookies para melhorar sua experiência, analisar tráfego e
                personalizar publicidade. Conforme a LGPD, você pode aceitar
                todos, recusar ou escolher quais permitir. Veja nossa{' '}
                <a
                  href="/privacidade"
                  className="font-semibold text-[#010744] underline underline-offset-2 hover:text-[#f2d22e]"
                >
                  política de privacidade
                </a>
                .
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button onClick={acceptAll} variant="primary" size="md" className="sm:flex-1">
                  Aceitar todos
                </Button>
                <Button
                  onClick={() => setCustomize(true)}
                  variant="outline"
                  size="md"
                  className="sm:flex-1"
                >
                  <Settings2 size={16} aria-hidden="true" />
                  Personalizar
                </Button>
                <Button onClick={rejectAll} variant="ghost" size="md" className="sm:flex-1">
                  Recusar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personalizar (Sheet) */}
      <Sheet open={customize} onOpenChange={setCustomize}>
        <SheetContent side="bottom" className="max-w-lg mx-auto">
          <SheetHeader>
            <SheetTitle>Preferências de privacidade</SheetTitle>
            <SheetDescription>
              Escolha quais categorias de cookies você aceita. Você pode mudar a
              qualquer momento via link no rodapé.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-4">
            <CategoryRow
              title="Funcionais (obrigatórios)"
              description="Necessários para o site funcionar — login, segurança, preferências básicas. Não podem ser desativados."
              enabled={true}
              locked
              onChange={() => {}}
            />
            <CategoryRow
              title="Analítica"
              description="Google Analytics, Microsoft Clarity. Nos ajudam a entender como o site é usado para melhorar a experiência. Dados anonimizados."
              enabled={analytics}
              onChange={setAnalytics}
            />
            <CategoryRow
              title="Marketing"
              description="Meta Pixel, Google Ads, LinkedIn. Permitem mostrar anúncios mais relevantes em outras plataformas e medir o desempenho de campanhas."
              enabled={marketing}
              onChange={setMarketing}
            />
          </div>

          <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex flex-col-reverse gap-2 border-t border-gray-100 bg-white px-6 pb-6 pt-4 sm:flex-row sm:justify-end">
            <Button onClick={rejectAll} variant="ghost" size="md">
              Recusar todos
            </Button>
            <Button onClick={saveCustom} variant="primary" size="md">
              Salvar preferências
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

interface CategoryRowProps {
  title: string
  description: string
  enabled: boolean
  locked?: boolean
  onChange: (enabled: boolean) => void
}

function CategoryRow({ title, description, enabled, locked, onChange }: CategoryRowProps) {
  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-[#010744]">{title}</h4>
          <p className="mt-1 text-xs text-gray-600 leading-relaxed">{description}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={title}
          disabled={locked}
          onClick={() => !locked && onChange(!enabled)}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#010744] focus-visible:ring-offset-2
                     ${enabled ? 'bg-[#010744]' : 'bg-gray-300'}
                     ${locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            aria-hidden="true"
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform
                       ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
          />
          {locked && (
            <Check
              size={10}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-white"
              aria-hidden="true"
            />
          )}
        </button>
      </div>
    </div>
  )
}

/**
 * Link "Gerenciar cookies" para o footer — re-abre o banner.
 * Útil para o usuário mudar preferências depois.
 */
export function ManageConsentLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        // Reseta status pra 'pending' pra forçar reaparição do banner
        try {
          const c = readConsent()
          if (c) {
            writeConsent({ ...c, status: 'pending' })
          } else {
            writeConsent({ status: 'pending', analytics: false, marketing: false, functional: true })
          }
        } catch {
          /* ignore */
        }
        // Force reload pra garantir que o banner apareça
        window.location.reload()
      }}
      className={className}
    >
      Gerenciar cookies
    </button>
  )
}

