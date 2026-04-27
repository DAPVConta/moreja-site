'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react'
import { MobileSearchButton } from './MobileSearchButton'

const navLinks = [
  { href: '/comprar', label: 'Comprar' },
  { href: '/alugar', label: 'Alugar' },
  { href: '/empreendimentos', label: 'Empreendimentos' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/contato', label: 'Contato' },
]

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

  const color =
    variant === 'yellow' ? '#f2d22e' : variant === 'white' ? '#ffffff' : '#010744'

  return (
    <span
      className={`flex items-center gap-0.5 md:gap-1 font-black text-sm md:text-2xl tracking-tight ${className ?? ''}`}
      style={{ color }}
    >
      M
      <span className="relative inline-flex items-center justify-center">
        <MapPin
          fill={color}
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

interface HeaderProps {
  logoUrl?: string | null
  companyName?: string
  phone?: string
  email?: string
  whatsapp?: string
  businessHours?: string
}

export function Header({
  logoUrl,
  companyName,
  phone,
  email,
  whatsapp,
  businessHours = 'Seg–Sex 8h–18h · Sáb 8h–12h',
}: HeaderProps = {}) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dragX, setDragX] = useState(0) // px deslocamento durante swipe
  const dragStart = useRef<number | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false)
  }, [pathname])

  // Lock body scroll while mobile menu is open + ESC fecha
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

  // Handlers de swipe-right para fechar
  function onTouchStart(e: React.TouchEvent) {
    dragStart.current = e.touches[0].clientX
  }
  function onTouchMove(e: React.TouchEvent) {
    if (dragStart.current == null) return
    const dx = e.touches[0].clientX - dragStart.current
    if (dx > 0) setDragX(dx) // só permite arrastar para a direita
  }
  function onTouchEnd() {
    // Fechar se arrastou > 80px; senão volta ao lugar
    if (dragX > 80) setMobileOpen(false)
    setDragX(0)
    dragStart.current = null
  }

  const whatsappDigits = whatsapp?.replace(/\D/g, '')

  return (
    <>
      {/* ── Top bar (desktop) ───────────────────────────────────────── */}
      {(phone || email) && (
        <div
          className="hidden lg:block bg-[#010744] text-white/85 text-xs"
          aria-label="Informações de contato"
        >
          <div className="container-page flex items-center justify-between h-9">
            <div className="flex items-center gap-5">
              {phone && (
                <a
                  href={`tel:${phone.replace(/\D/g, '')}`}
                  className="flex items-center gap-1.5 hover:text-[#f2d22e] transition-colors"
                >
                  <Phone size={13} aria-hidden="true" />
                  <span>{phone}</span>
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-1.5 hover:text-[#f2d22e] transition-colors"
                >
                  <Mail size={13} aria-hidden="true" />
                  <span>{email}</span>
                </a>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-white/70">
              <Clock size={13} aria-hidden="true" />
              <span>{businessHours}</span>
            </div>
          </div>
        </div>
      )}

      <header
        className={`sticky top-0 z-50 w-full bg-white transition-shadow duration-300 ${
          scrolled ? 'shadow-md' : 'shadow-sm'
        }`}
      >
        <div className="container-page">
          <div
            className={`flex items-center justify-between transition-all duration-300 ${
              scrolled ? 'h-14 sm:h-16' : 'h-16 sm:h-20'
            }`}
          >
            {/* Logo */}
            <Link href="/" aria-label={`${companyName ?? 'Morejá'} — Início`}>
              <MoRejaLogo variant="navy" logoUrl={logoUrl} companyName={companyName} />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8" aria-label="Navegação principal">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-semibold transition-colors duration-200 hover:text-[#f2d22e] ${
                    pathname.startsWith(link.href)
                      ? 'text-[#010744] border-b-2 border-[#f2d22e] pb-0.5'
                      : 'text-gray-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA + hamburger */}
            <div className="flex items-center gap-3">
              {phone && (
                <a
                  href={`tel:${phone.replace(/\D/g, '')}`}
                  className="hidden md:flex items-center gap-2 text-sm text-gray-600 hover:text-[#010744] transition-colors"
                  aria-label={`Ligar para a ${companyName ?? 'Morejá'}`}
                >
                  <Phone size={15} />
                  <span className="font-medium">{phone}</span>
                </a>
              )}

              <Link
                href="/contato"
                className="hidden md:inline-flex btn-primary btn-sm"
              >
                Fale Conosco
              </Link>

              <MobileSearchButton />

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden inline-flex items-center justify-center w-11 h-11 -mr-2 rounded-md text-gray-600 hover:text-[#010744] hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#010744] transition-colors"
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

      {/* ── Backdrop ─────────────────────────────────────────────────
          Sempre montado (com pointer-events-none) para suportar fade
          sem depender de mount/unmount. */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
        className={`lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* ── Drawer mobile ─ slide-in da direita ─────────────────────
          translateX(100%) quando fechado; quando abre, translateX(0).
          Durante touchmove, dragX adiciona offset positivo (segue o
          dedo). */}
      <aside
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: mobileOpen
            ? `translateX(${dragX}px)`
            : 'translateX(100%)',
          transition: dragStart.current == null
            ? 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)'
            : 'none',
        }}
        className={`lg:hidden fixed top-0 right-0 z-50 h-full w-[85%] max-w-sm bg-white shadow-2xl flex flex-col ${
          mobileOpen ? '' : 'pointer-events-none'
        }`}
      >
        {/* Header do drawer */}
        <div className="flex items-center justify-between h-16 sm:h-20 px-5 border-b border-gray-100 shrink-0">
          <MoRejaLogo variant="navy" logoUrl={logoUrl} companyName={companyName} />
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
            className="inline-flex items-center justify-center w-11 h-11 -mr-2 rounded-md text-gray-600 hover:text-[#010744] hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#010744] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Pull indicator (visual hint pra swipe) */}
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-2 -translate-y-1/2 w-1 h-12 rounded-full bg-gray-200"
        />

        {/* Lista de navegação */}
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
                className={`flex items-center text-lg font-semibold py-4 border-b border-gray-100 transition-colors ${
                  isActive ? 'text-[#010744]' : 'text-gray-700 hover:text-[#010744]'
                }`}
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

        {/* Rodapé com ações primárias */}
        <div
          className="px-5 pt-4 pb-6 border-t border-gray-100 flex flex-col gap-3 shrink-0"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {whatsappDigits && (
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-12 rounded-lg bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold transition-colors"
            >
              <MessageCircle size={18} aria-hidden="true" />
              WhatsApp
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              className="flex items-center justify-center gap-2 h-12 rounded-lg border border-gray-300 text-gray-700 hover:border-[#010744] hover:text-[#010744] font-medium transition-colors"
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
