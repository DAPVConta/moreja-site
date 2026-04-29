'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, MapPin, Phone, Mail, Clock, MessageCircle, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MobileSearchButton } from './MobileSearchButton'
import { HeaderMegaMenu } from './HeaderMegaMenu'

// ── Nav data ──────────────────────────────────────────────────────────────────

const COMPRAR_COLUMNS = [
  {
    heading: 'Tipo de imóvel',
    links: [
      { label: 'Apartamentos', href: '/comprar?tipo=Apartamento' },
      { label: 'Casas', href: '/comprar?tipo=Casa' },
      { label: 'Casa em Condomínio', href: '/comprar?tipo=Casa%20de%20Condom%C3%ADnio' },
      { label: 'Coberturas', href: '/comprar?tipo=Cobertura' },
      { label: 'Terrenos', href: '/comprar?tipo=Terreno' },
    ],
  },
  {
    heading: 'Comercial',
    links: [
      { label: 'Salas comerciais', href: '/comprar?tipo=Sala%20Comercial' },
      { label: 'Lojas', href: '/comprar?tipo=Comercial' },
      { label: 'Galpões', href: '/comprar?tipo=Galp%C3%A3o' },
    ],
  },
  {
    heading: 'Por cidade',
    links: [
      { label: 'Recife', href: '/comprar?cidade=recife' },
      { label: 'Olinda', href: '/comprar?cidade=olinda' },
      { label: 'Jaboatão dos Guararapes', href: '/comprar?cidade=jaboatao' },
      { label: 'Caruaru', href: '/comprar?cidade=caruaru' },
      { label: 'Ver todas as cidades', href: '/comprar' },
    ],
  },
]

const ALUGAR_COLUMNS = [
  {
    heading: 'Residencial',
    links: [
      { label: 'Apartamentos', href: '/alugar?tipo=Apartamento' },
      { label: 'Casas', href: '/alugar?tipo=Casa' },
      { label: 'Studios e Kitnets', href: '/alugar?tipo=Studio' },
    ],
  },
  {
    heading: 'Comercial',
    links: [
      { label: 'Salas comerciais', href: '/alugar?tipo=Sala%20Comercial' },
      { label: 'Lojas', href: '/alugar?tipo=Comercial' },
      { label: 'Galpões', href: '/alugar?tipo=Galp%C3%A3o' },
    ],
  },
  {
    heading: 'Por faixa de preço',
    links: [
      { label: 'Até R$ 1.500/mês', href: '/alugar?preco_max=1500' },
      { label: 'R$ 1.500 – R$ 3.000', href: '/alugar?preco_min=1500&preco_max=3000' },
      { label: 'R$ 3.000 – R$ 5.000', href: '/alugar?preco_min=3000&preco_max=5000' },
      { label: 'Acima de R$ 5.000', href: '/alugar?preco_min=5000' },
    ],
  },
]

const navLinks = [
  { href: '/comprar', label: 'Comprar' },
  { href: '/alugar', label: 'Alugar' },
  { href: '/empreendimentos', label: 'Empreendimentos' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/contato', label: 'Contato' },
]

// ── Logo ──────────────────────────────────────────────────────────────────────

export function MoRejaLogo({
  variant = 'navy',
  logoUrl,
  companyName = 'Morejá',
  className,
}: {
  variant?: 'navy' | 'yellow' | 'white'
  logoUrl?: string | null
  companyName?: string
  className?: string
}) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={logoUrl}
        alt={companyName ?? 'Logo'}
        className={`h-7 md:h-12 w-auto max-w-[132px] md:max-w-[220px] object-contain ${className ?? ''}`}
      />
    )
  }

  // Cor das letras (M e REJÁ) segue o variant para contrastar com o fundo.
  const letterColor =
    variant === 'yellow' ? '#f2d22e' : variant === 'white' ? '#ffffff' : '#010744'
  // Cor do pin é SEMPRE o acento amarelo da marca — antes assumia a mesma
  // cor das letras, o que fazia o pin sumir quando o variant era 'white'
  // (sobre header transparente no hero navy) ou 'yellow' (footer onde letras
  // já são amarelas). Quando o próprio variant é 'yellow', o pin precisa
  // de outra cor pra não fundir com as letras — usamos cream da marca.
  const pinColor = variant === 'yellow' ? '#ededd1' : '#f2d22e'

  return (
    <span
      className={`flex items-center gap-0.5 md:gap-1 font-black text-sm md:text-2xl tracking-tight ${className ?? ''}`}
      style={{ color: letterColor }}
    >
      M
      <span className="relative inline-flex items-center justify-center">
        <MapPin
          fill={pinColor}
          strokeWidth={0}
          className="absolute w-[17px] h-[17px] md:w-7 md:h-7"
          aria-hidden="true"
        />
        <span className="opacity-0 select-none">O</span>
      </span>
      REJÁ
    </span>
  )
}

// ── Marquee top-bar (desktop only) ───────────────────────────────────────────
// Items are duplicated once so the seam is invisible (same technique as
// testimonials-marquee). CSS classes `.header-marquee-track / -inner` are
// defined in globals.css.

interface MarqueeItem {
  id: string
  content: React.ReactNode
}

function TopBarMarquee({ items }: { items: MarqueeItem[] }) {
  return (
    <div className="header-marquee-track flex-1 overflow-hidden">
      {/* Double the items so the loop seam is invisible */}
      <div className="header-marquee-inner">
        {[...items, ...items].map((item, i) => (
          <span
            key={`${item.id}-${i}`}
            className="flex items-center shrink-0 pr-10"
          >
            {item.content}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Nav underline (layoutId) ──────────────────────────────────────────────────
// A single <motion.div> with layoutId="header-nav-underline" slides between
// nav items when the active route changes. Each link renders it conditionally.

interface NavLinkProps {
  href: string
  label: string
  isActive: boolean
  isScrolled: boolean
}

function DesktopNavLink({ href, label, isActive, isScrolled }: NavLinkProps) {
  const [hovered, setHovered] = useState(false)
  const showUnderline = isActive || hovered

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={[
        'relative inline-flex flex-col items-center gap-0 pb-0.5',
        'text-sm font-semibold transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2 rounded-sm',
        isScrolled
          ? isActive
            ? 'text-[#010744]'
            : 'text-gray-600 hover:text-[#010744]'
          : isActive
          ? 'text-white'
          : 'text-white/80 hover:text-white',
      ].join(' ')}
    >
      {label}
      <AnimatePresence>
        {showUnderline && (
          <motion.span
            layoutId="header-nav-underline"
            className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#f2d22e]"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            style={{ originX: 0.5 }}
          />
        )}
      </AnimatePresence>
    </Link>
  )
}

// ── Search trigger (desktop) ──────────────────────────────────────────────────
// Opens CommandPalette; clicking dispatches a synthetic Ctrl+K so the palette's
// own global listener picks it up — keeps a single source of truth for
// open/close logic without prop drilling.

function SearchTrigger({ isScrolled }: { isScrolled: boolean }) {
  function openPalette() {
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        metaKey: false,
        bubbles: true,
        cancelable: true,
      }),
    )
  }

  return (
    <button
      type="button"
      onClick={openPalette}
      aria-label="Abrir busca global (Cmd K)"
      className={[
        'hidden lg:inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-xs font-medium',
        'transition-all duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] focus-visible:ring-offset-2',
        isScrolled
          ? 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 bg-gray-50/60'
          : 'border-white/20 text-white/60 hover:border-white/40 hover:text-white/80 bg-white/5',
      ].join(' ')}
    >
      <Search size={13} aria-hidden="true" />
      <span>Buscar...</span>
      <kbd className="inline-flex items-center justify-center h-4 px-1 rounded border border-current/40 text-[10px] font-mono opacity-70">
        ⌘K
      </kbd>
    </button>
  )
}

// ── Header props ──────────────────────────────────────────────────────────────

interface HeaderProps {
  logoUrl?: string | null
  companyName?: string
  phone?: string
  email?: string
  whatsapp?: string
  businessHours?: string
}

// ── Main component ────────────────────────────────────────────────────────────

export function Header({
  logoUrl,
  companyName,
  phone,
  email,
  whatsapp,
  businessHours,
}: HeaderProps = {}) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  // Hide-on-scroll-down (Linear/Apple pattern) — esconde ao rolar pra baixo,
  // reaparece ao rolar pra cima. Evita o efeito leitoso de header glass
  // sobrepondo seções navy (footer/lançamentos) e libera vertical real estate.
  const [hidden, setHidden] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dragX, setDragX] = useState(0)
  const dragStart = useRef<number | null>(null)
  const lastScrollY = useRef(0)

  // ── Liquid-glass + hide-on-scroll-down via UM scroll listener.
  // Antes usava IntersectionObserver com sentinel `fixed top-[80px]` que
  // ficava ETERNAMENTE no viewport (fixed = não scrolla), então
  // `isIntersecting` era sempre true e `scrolled` nunca virava true. Bug:
  // header nunca virava liquid-glass branco, links de nav ficavam white
  // sobre fundo branco da página = invisíveis.
  // Solução: scroll listener único atualiza scrolled (glass) E hidden
  // (translate). Threshold 6px no delta evita tremor.
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY
      const dy = y - lastScrollY.current
      // Liquid-glass: aplica quando passar de 80px do topo
      setScrolled(y > 80)
      // Hide-on-scroll-down: rolando pra baixo esconde, pra cima reaparece.
      // Sempre visível nos primeiros 80px e quando menu mobile aberto.
      if (mobileOpen || y < 80) {
        setHidden(false)
      } else if (Math.abs(dy) > 6) {
        setHidden(dy > 0)
      }
      lastScrollY.current = y
    }
    // Rodar uma vez na montagem caso a página já esteja scrollada
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [mobileOpen])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Lock body scroll while mobile menu is open + ESC closes
  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen])

  // Swipe-right to close mobile drawer
  function onTouchStart(e: React.TouchEvent) {
    dragStart.current = e.touches[0].clientX
  }
  function onTouchMove(e: React.TouchEvent) {
    if (dragStart.current == null) return
    const dx = e.touches[0].clientX - dragStart.current
    if (dx > 0) setDragX(dx)
  }
  function onTouchEnd() {
    if (dragX > 80) setMobileOpen(false)
    setDragX(0)
    dragStart.current = null
  }

  const whatsappDigits = whatsapp?.replace(/\D/g, '')

  // ── Marquee items ──
  const marqueeItems: MarqueeItem[] = [
    ...(phone
      ? [
          {
            id: 'phone',
            content: (
              <a
                href={`tel:${phone.replace(/\D/g, '')}`}
                className="flex items-center gap-1.5 hover:text-[#f2d22e] transition-colors"
              >
                <Phone size={12} aria-hidden="true" />
                <span>{phone}</span>
              </a>
            ),
          },
        ]
      : []),
    ...(email
      ? [
          {
            id: 'email',
            content: (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-1.5 hover:text-[#f2d22e] transition-colors"
              >
                <Mail size={12} aria-hidden="true" />
                <span>{email}</span>
              </a>
            ),
          },
        ]
      : []),
    ...(businessHours
      ? [
          {
            id: 'hours',
            content: (
              <span className="flex items-center gap-1.5 text-white/70">
                <Clock size={12} aria-hidden="true" />
                <span>{businessHours}</span>
              </span>
            ),
          },
        ]
      : []),
    {
      id: 'creci',
      content: (
        <span className="text-white/60">CRECI · PE</span>
      ),
    },
    {
      id: 'region',
      content: (
        <span className="text-white/60">Atendemos toda Recife/PE</span>
      ),
    },
    {
      id: 'anuncie',
      content: (
        <Link
          href="/avaliar"
          className="font-semibold hover:text-[#f2d22e] transition-colors"
        >
          Anuncie seu imóvel
        </Link>
      ),
    },
  ]

  // Decide if top-bar should render (needs at least one item)
  const hasTopBar = phone || email || businessHours

  return (
    <>
      {/* ── Top bar — marquee (desktop only) ── */}
      {hasTopBar && (
        <div
          className="hidden lg:flex items-center bg-[#010744] text-white/85 text-xs h-9 overflow-hidden"
          aria-label="Informações de contato"
        >
          <div className="container-page flex items-center gap-0 w-full overflow-hidden">
            {/* Reduced-motion fallback: show first 2 static items */}
            <div
              className="hidden motion-reduce:flex items-center gap-5 text-white/85"
              aria-hidden="false"
            >
              {marqueeItems.slice(0, 2).map((item) => (
                <span key={item.id}>{item.content}</span>
              ))}
            </div>
            {/* Animated marquee (hidden when reduce-motion) */}
            <div className="flex-1 overflow-hidden motion-reduce:hidden" aria-hidden="true">
              <TopBarMarquee items={marqueeItems} />
            </div>
          </div>
        </div>
      )}

      {/* ── Main header — liquid-glass + hide-on-scroll-down ── */}
      <header
        className={[
          'sticky top-0 z-50 w-full',
          // Transition específica (não 'all') para evitar que cor/opacity de
          // children como o logo herdem animação na hidratação inicial — antes
          // o logo aparecia "esmaecido" no primeiro carregamento.
          'transition-[transform,background-color,box-shadow,border-color] duration-300 will-change-transform',
          hidden ? '-translate-y-full' : 'translate-y-0',
          scrolled
            ? 'bg-white/80 backdrop-blur-xl shadow-md border-b border-gray-100/60'
            : 'bg-transparent shadow-none border-b border-transparent',
        ].join(' ')}
      >
        <div className="container-page">
          <div
            className={[
              // transition-[height] específica em vez de transition-all para
              // não animar cor/opacity de children no primeiro paint.
              'flex items-center justify-between transition-[height] duration-300',
              scrolled ? 'h-14 sm:h-16' : 'h-16 sm:h-20',
            ].join(' ')}
          >
            {/* Logo */}
            <Link href="/" aria-label={`${companyName ?? 'Morejá'} — Início`}>
              <MoRejaLogo
                variant={scrolled ? 'navy' : 'white'}
                logoUrl={logoUrl}
                companyName={companyName}
              />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-7" aria-label="Navegação principal">
              <HeaderMegaMenu
                label="Comprar"
                href="/comprar"
                columns={COMPRAR_COLUMNS}
                active={pathname.startsWith('/comprar')}
                isScrolled={scrolled}
                highlight={{
                  title: 'Imóveis em Recife',
                  description: 'Apartamentos e casas no coração da capital pernambucana.',
                  href: '/comprar?cidade=recife',
                  image: 'https://images.unsplash.com/photo-1518883529677-4dcae62cf45e?w=600&q=70',
                }}
              />
              <HeaderMegaMenu
                label="Alugar"
                href="/alugar"
                columns={ALUGAR_COLUMNS}
                active={pathname.startsWith('/alugar')}
                isScrolled={scrolled}
                highlight={{
                  title: 'Locação rápida',
                  description: 'Imóveis com aprovação ágil e sem fiador.',
                  href: '/alugar',
                  image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=70',
                }}
              />
              {navLinks
                .filter((l) => l.href !== '/comprar' && l.href !== '/alugar')
                .map((link) => (
                  <DesktopNavLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    isActive={pathname.startsWith(link.href)}
                    isScrolled={scrolled}
                  />
                ))}
            </nav>

            {/* Right-side CTAs */}
            <div className="flex items-center gap-3">
              {/* Search trigger — desktop only, hidden on mobile (has MobileSearchButton) */}
              <SearchTrigger isScrolled={scrolled} />

              <Link
                href="/contato"
                className="hidden md:inline-flex btn-primary btn-sm"
              >
                Fale Conosco
              </Link>

              <MobileSearchButton />

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className={[
                  'lg:hidden inline-flex items-center justify-center w-11 h-11 -mr-2 rounded-md',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2d22e] transition-colors',
                  scrolled
                    ? 'text-gray-600 hover:text-[#010744] hover:bg-gray-100'
                    : 'text-white hover:text-white/80 hover:bg-white/10',
                ].join(' ')}
                aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
              >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Backdrop ── */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
        className={[
          'lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* ── Mobile drawer ── */}
      <aside
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: mobileOpen ? `translateX(${dragX}px)` : 'translateX(100%)',
          transition:
            dragStart.current == null
              ? 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)'
              : 'none',
        }}
        className={[
          'lg:hidden fixed top-0 right-0 z-50 h-full w-[85%] max-w-sm bg-white shadow-2xl flex flex-col',
          mobileOpen ? '' : 'pointer-events-none',
        ].join(' ')}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between h-16 sm:h-20 px-5 border-b border-gray-100 shrink-0">
          <MoRejaLogo variant="navy" logoUrl={logoUrl} companyName={companyName} />
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
            className="inline-flex items-center justify-center w-11 h-11 -mr-2 rounded-md
                       text-gray-600 hover:text-[#010744] hover:bg-gray-100
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#010744] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Pull indicator */}
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-2 -translate-y-1/2 w-1 h-12 rounded-full bg-gray-200"
        />

        {/* Nav list */}
        <nav
          className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-1"
          aria-label="Menu mobile"
        >
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  'flex items-center text-lg font-semibold py-4 border-b border-gray-100 transition-colors',
                  isActive ? 'text-[#010744]' : 'text-gray-700 hover:text-[#010744]',
                ].join(' ')}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="w-1 h-6 rounded-full bg-[#f2d22e] mr-3"
                  />
                )}
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer CTAs */}
        <div
          className="px-5 pt-4 pb-6 border-t border-gray-100 flex flex-col gap-3 shrink-0"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {whatsappDigits && (
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-12 rounded-lg
                         bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold transition-colors"
            >
              <MessageCircle size={18} aria-hidden="true" />
              WhatsApp
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              className="flex items-center justify-center gap-2 h-12 rounded-lg border border-gray-300
                         text-gray-700 hover:border-[#010744] hover:text-[#010744] font-medium transition-colors"
            >
              <Phone size={18} />
              {phone}
            </a>
          )}
          <Link href="/contato" className="btn-primary">
            Fale Conosco
          </Link>
        </div>
      </aside>
    </>
  )
}
