'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { PhoneCall, X, Check } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'

interface IdleCallbackPromptProps {
  imovelId: string
  imovelCodigo: string
  imovelTitulo: string
  /** Quantos segundos no detalhe antes de abrir (default 45). */
  idleSeconds?: number
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

function dismissedKey(propertyId: string) {
  return `moreja:callback-prompt-dismissed:${propertyId}`
}

/**
 * Idle callback prompt — abre uma bottom sheet "Quer que um corretor te ligue?"
 * após N segundos de dwell time no detalhe do imóvel.
 *
 * Padrões de UX (research mobile):
 *   • Só dispara em pageview com >= idleSeconds de dwell ativo
 *   • Se o usuário sai e volta, o timer não é reiniciado (sessionStorage)
 *   • Dismissal por imóvel persiste em localStorage 24h
 *   • Não dispara se usuário já enviou lead (LeadFormInline grava success em sessionStorage)
 *   • Pausa quando aba fica oculta (Page Visibility API)
 */
export function IdleCallbackPrompt({
  imovelId,
  imovelCodigo,
  imovelTitulo,
  idleSeconds = 45,
}: IdleCallbackPromptProps) {
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [bestTime, setBestTime] = useState<'now' | 'morning' | 'afternoon' | 'evening'>('now')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Abort se já dispensou nas últimas 24h
    try {
      const dismissedAt = Number(localStorage.getItem(dismissedKey(imovelId)) ?? '0')
      if (dismissedAt && Date.now() - dismissedAt < 24 * 60 * 60 * 1000) return
    } catch {
      /* ignore */
    }
    // Abort se já enviou lead nesta sessão
    try {
      if (sessionStorage.getItem(`moreja:lead-sent:${imovelId}`) === '1') return
    } catch {
      /* ignore */
    }

    let dwellMs = 0
    let lastTick = Date.now()
    let timer: ReturnType<typeof setInterval> | null = null

    const tick = () => {
      if (document.hidden) {
        lastTick = Date.now()
        return
      }
      const now = Date.now()
      dwellMs += now - lastTick
      lastTick = now
      if (dwellMs >= idleSeconds * 1000) {
        setOpen(true)
        if (timer) clearInterval(timer)
      }
    }

    timer = setInterval(tick, 1000)

    const onVisibility = () => {
      lastTick = Date.now()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      if (timer) clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [imovelId, idleSeconds])

  function dismissPersist() {
    try {
      localStorage.setItem(dismissedKey(imovelId), String(Date.now()))
    } catch {
      /* ignore */
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!phone.trim()) return

    setLoading(true)
    setError('')

    const bestTimeLabel = {
      now: 'agora (em até 5 minutos)',
      morning: 'pela manhã',
      afternoon: 'à tarde',
      evening: 'no fim da tarde',
    }[bestTime]

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          nome: name || 'Solicitação de callback',
          email: 'callback@anonymous.local', // edge function exige email; placeholder
          telefone: phone,
          mensagem:
            `[CALLBACK ${bestTimeLabel.toUpperCase()}] Visitante interessado no imóvel ` +
            `"${imovelTitulo}" (ref. ${imovelCodigo}). Pediu retorno ${bestTimeLabel}.`,
          imovel_id: imovelId,
          imovel_codigo: imovelCodigo,
          origem: 'idle_callback_prompt',
        }),
      })

      if (!res.ok) throw new Error('Erro ao enviar')
      setSuccess(true)
      try {
        sessionStorage.setItem(`moreja:lead-sent:${imovelId}`, '1')
      } catch {
        /* ignore */
      }
    } catch {
      setError('Não foi possível solicitar agora. Por favor, ligue diretamente para nós.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o && !success) dismissPersist()
      }}
    >
      <SheetContent side="bottom" className="max-w-lg mx-auto">
        {success ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-7 w-7 text-emerald-600" strokeWidth={3} />
            </div>
            <SheetTitle className="text-center">Pedido recebido!</SheetTitle>
            <SheetDescription className="mt-2 text-center">
              Um corretor entrará em contato {bestTime === 'now' ? 'em até 5 minutos' : 'em breve'}.
              Fique de olho no telefone.
            </SheetDescription>
            <SheetClose asChild>
              <Button variant="primary" size="lg" className="mt-6 w-full">
                Continuar navegando
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3 mb-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2d22e] text-[#010744]">
                  <PhoneCall size={18} />
                </span>
                <SheetTitle>Quer que um corretor te ligue?</SheetTitle>
              </div>
              <SheetDescription>
                Sem compromisso. Tire dúvidas sobre <span className="font-semibold text-[#010744]">{imovelTitulo}</span> com
                quem entende do imóvel.
              </SheetDescription>
            </SheetHeader>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome (opcional)"
                autoComplete="name"
                autoCapitalize="words"
                className="h-12 w-full rounded-lg border border-gray-200 px-3 text-base
                           focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent"
                aria-label="Nome"
              />

              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Seu telefone *"
                required
                autoComplete="tel"
                inputMode="tel"
                className="h-12 w-full rounded-lg border border-gray-200 px-3 text-base
                           focus:outline-none focus:ring-2 focus:ring-[#010744] focus:border-transparent"
                aria-label="Telefone"
              />

              <fieldset>
                <legend className="text-sm font-semibold text-[#010744] mb-2">
                  Quando posso te ligar?
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'now', label: 'Agora (5min)' },
                    { value: 'morning', label: 'Manhã' },
                    { value: 'afternoon', label: 'Tarde' },
                    { value: 'evening', label: 'Fim de tarde' },
                  ].map((opt) => {
                    const active = bestTime === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setBestTime(opt.value as 'now' | 'morning' | 'afternoon' | 'evening')
                        }
                        className={`min-h-[44px] rounded-lg border-2 text-sm font-semibold transition-all ${
                          active
                            ? 'border-[#010744] bg-[#010744] text-white'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-[#010744]'
                        }`}
                        aria-pressed={active}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              {error && (
                <p
                  className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={!phone.trim()}
                className="w-full"
              >
                <PhoneCall size={18} />
                Sim, me liga
              </Button>

              <p className="text-center text-xs text-gray-500">
                Ao enviar, você concorda em receber contato. Pode cancelar quando quiser.
              </p>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
