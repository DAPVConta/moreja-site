import { ShieldCheck, Star, Award, Lock } from 'lucide-react'

interface TrustBadge {
  icon: React.ReactNode
  title: string
  subtitle: string
  href?: string
  external?: boolean
}

const BADGES: TrustBadge[] = [
  {
    icon: <Award size={22} aria-hidden="true" />,
    title: 'CRECI-PE',
    subtitle: 'Imobiliária registrada',
  },
  {
    icon: <Star size={22} aria-hidden="true" />,
    title: 'Reclame Aqui',
    subtitle: 'Reputação verificada',
    href: 'https://www.reclameaqui.com.br/',
    external: true,
  },
  {
    icon: <ShieldCheck size={22} aria-hidden="true" />,
    title: 'Site seguro',
    subtitle: 'SSL · Dados protegidos',
  },
  {
    icon: <Lock size={22} aria-hidden="true" />,
    title: 'LGPD compliant',
    subtitle: 'Privacidade garantida',
  },
]

/**
 * Faixa de selos de confiança usada no rodapé / acima do bottom bar.
 * Foco em comunicação visual rápida — texto curto + ícone.
 */
export function TrustBadges() {
  return (
    <ul
      role="list"
      aria-label="Selos de confiança"
      className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
    >
      {BADGES.map((badge) => {
        const inner = (
          <div className="flex items-center gap-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 transition-colors h-full">
            <span className="flex items-center justify-center w-10 h-10 shrink-0 rounded-lg bg-[#f2d22e]/15 text-[#f2d22e]">
              {badge.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">{badge.title}</p>
              <p className="text-[11px] text-gray-400 leading-tight mt-0.5 truncate">
                {badge.subtitle}
              </p>
            </div>
          </div>
        )

        return (
          <li key={badge.title}>
            {badge.href ? (
              <a
                href={badge.href}
                target={badge.external ? '_blank' : undefined}
                rel={badge.external ? 'noopener noreferrer' : undefined}
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] rounded-xl"
              >
                {inner}
              </a>
            ) : (
              inner
            )}
          </li>
        )
      })}
    </ul>
  )
}
