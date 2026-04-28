'use client'

/**
 * LivePresenceIndicator — exibe status de atendimento em tempo real.
 *
 * Implementação:
 * - Client component com useState + useEffect para evitar SSR mismatch.
 * - Renderiza estado neutro no servidor ("Carregando…") e atualiza
 *   apenas após hidratação (depois do primeiro useEffect).
 * - Dot pulse verde quando dentro do horário comercial; cinza fora.
 * - Respeita prefers-reduced-motion (pulse desativado pelo global CSS).
 * - role="status" + aria-live="polite" para anúncio de leitores de tela.
 *
 * @param businessHours - string de horário, ex: "Seg-Sex 8h-18h".
 *   Quando vazio, usa o fallback padrão "Seg-Sex 8h-18h".
 */

import { useEffect, useState } from 'react'

interface LivePresenceIndicatorProps {
  businessHours?: string
}

// Horário padrão de atendimento: Seg-Sex, 08:00–18:00 (horário local)
const DEFAULT_HOURS = 'Seg-Sex 8h-18h'
const OPEN_HOUR_START = 8
const OPEN_HOUR_END = 18   // exclusive — 18:00 já está fechado

type Status = 'online' | 'offline' | 'loading'

function checkIsOpen(): boolean {
  const now = new Date()
  const day = now.getDay()   // 0 = Dom, 1 = Seg … 5 = Sex, 6 = Sáb
  const hour = now.getHours()
  const isWeekday = day >= 1 && day <= 5
  const isBusinessHour = hour >= OPEN_HOUR_START && hour < OPEN_HOUR_END
  return isWeekday && isBusinessHour
}

export function LivePresenceIndicator({ businessHours }: LivePresenceIndicatorProps) {
  const hoursLabel = businessHours || DEFAULT_HOURS

  // Inicia como 'loading' — previne mismatch SSR/client.
  // O servidor não renderiza dot nem texto de status (apenas a label de horário).
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    // Determina status imediatamente após hidratação
    setStatus(checkIsOpen() ? 'online' : 'offline')

    // Atualiza a cada minuto para refletir mudanças de horário em tempo real
    const interval = setInterval(() => {
      setStatus(checkIsOpen() ? 'online' : 'offline')
    }, 60_000)

    return () => clearInterval(interval)
  }, [])

  const isOnline = status === 'online'
  const isLoading = status === 'loading'

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={
        isLoading
          ? 'Verificando disponibilidade de atendimento'
          : isOnline
          ? `Atendemos agora — ${hoursLabel}`
          : `Atendemos no próximo horário útil — ${hoursLabel}`
      }
      className="inline-flex items-center gap-2 text-sm"
    >
      {/* Dot indicador de status */}
      <span
        aria-hidden="true"
        className={[
          'relative flex items-center justify-center w-2.5 h-2.5 shrink-0',
        ].join(' ')}
      >
        {/* Pulse ring — só visível quando online e motion ativado */}
        {isOnline && !isLoading && (
          <span
            aria-hidden="true"
            className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"
          />
        )}
        <span
          className={[
            'relative inline-flex rounded-full w-2 h-2',
            isLoading
              ? 'bg-gray-400'
              : isOnline
              ? 'bg-green-400'
              : 'bg-gray-400',
          ].join(' ')}
        />
      </span>

      {/* Label de status */}
      <span className="text-gray-300 text-xs leading-none">
        {isLoading ? (
          // Estado neutro inicial — não mostra status até hidratar
          <span aria-hidden="true">{hoursLabel}</span>
        ) : isOnline ? (
          <>
            <span className="text-green-400 font-semibold">Online</span>
            {' · '}
            <span>Atendemos agora</span>
            {' — '}
            <span>{hoursLabel}</span>
          </>
        ) : (
          <>
            <span className="text-gray-400">Offline</span>
            {' · '}
            <span>Atendemos {hoursLabel}</span>
          </>
        )}
      </span>
    </div>
  )
}
