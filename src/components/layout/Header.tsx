'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, MapPin, Phone } from 'lucide-react'

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
        className={`h-12 w-auto max-w-[220px] object-contain ${className ?? ''}`}
      />
    )
  }

  const color =
    variant === 'yellow' ? '#f2d22e' : variant === 'white' ? '#ffffff' : '#010744'

  return (
    <span className="flex items-center gap-1 font-black text-2xl tracking-tight" style={{ color }}>
      M
      <span className="relative inline-flex items-center justify-center">
        <MapPin
          size={28}
          fill={color}
          strokeWidth={0}
          className="absolute"
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
}

export function Header({ logoUrl, companyName, phone }: HeaderProps = {}) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full bg-white transition-shadow duration-300 ${
          scrolled ? 'shadow-md' : 'shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`flex items-center justify-between transition-all duration-300 ${
              scrolled ? 'h-16' : 'h-20'
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
                className="hidden md:inline-flex items-center btn-primary text-sm py-2 px-5"
              >
                Fale Conosco
              </Link>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-[#010744] hover:bg-gray-100 transition-colors"
                aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-white pt-20">
          <nav className="flex flex-col px-6 pt-6 gap-2" aria-label="Menu mobile">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-lg font-semibold py-3 border-b border-gray-100 transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'text-[#010744]'
                    : 'text-gray-700 hover:text-[#010744]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-6 flex flex-col gap-3">
              {phone && (
                <a
                  href={`tel:${phone.replace(/\D/g, '')}`}
                  className="flex items-center gap-2 text-gray-600"
                >
                  <Phone size={16} />
                  {phone}
                </a>
              )}
              <Link href="/contato" className="btn-primary text-center">
                Fale Conosco
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
