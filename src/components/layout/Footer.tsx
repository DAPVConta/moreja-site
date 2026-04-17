import Link from 'next/link'
import { MapPin, Phone, Mail, ChevronDown, MessageCircle } from 'lucide-react'
import { MoRejaLogo } from './Header'

// Social media SVG icons (lucide-react doesn't have brand icons)
function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function IconYoutube() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
      <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
    </svg>
  )
}

const buyLinks = [
  { href: '/comprar?tipo=Apartamento', label: 'Apartamentos' },
  { href: '/comprar?tipo=Casa', label: 'Casas' },
  { href: '/comprar?tipo=Terreno', label: 'Terrenos' },
  { href: '/comprar?tipo=Comercial', label: 'Comercial' },
]

const rentLinks = [
  { href: '/alugar?tipo=Apartamento', label: 'Apartamentos' },
  { href: '/alugar?tipo=Casa', label: 'Casas' },
  { href: '/alugar?tipo=Comercial', label: 'Comercial' },
]

const companyLinks = [
  { href: '/sobre', label: 'Quem Somos' },
  { href: '/empreendimentos', label: 'Empreendimentos' },
  { href: '/contato', label: 'Contato' },
]

const accordionSections = [
  { title: 'Empresa', links: companyLinks },
  { title: 'Comprar', links: buyLinks },
  { title: 'Alugar', links: rentLinks },
]

interface FooterProps {
  logoUrl?: string | null
  companyName?: string
}

export function Footer({ logoUrl, companyName }: FooterProps = {}) {
  return (
    <footer className="text-white" style={{ background: 'var(--brand-primary, #010744)' }}>
      {/* ═══════════════════════ MOBILE LAYOUT ═══════════════════════ */}
      <div className="lg:hidden">
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-6">
          {/* 1. Quick CTAs */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href="tel:+5511999999999"
              className="flex items-center justify-center gap-2 h-12 rounded-xl bg-white/10 active:bg-white/15 text-sm font-semibold transition-colors"
              aria-label="Ligar para a Morejá"
            >
              <Phone size={18} className="text-[#f2d22e]" aria-hidden="true" />
              Ligar
            </a>
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-12 rounded-xl bg-green-500 active:bg-green-600 text-sm font-semibold transition-colors"
              aria-label="WhatsApp da Morejá"
            >
              <MessageCircle size={18} aria-hidden="true" />
              WhatsApp
            </a>
          </div>

          {/* 2. Brand */}
          <div className="mt-8 text-center">
            <div className="inline-block">
              <MoRejaLogo variant="yellow" logoUrl={logoUrl} companyName={companyName} />
            </div>
            <p className="mt-3 text-sm text-gray-300 leading-relaxed max-w-[18rem] mx-auto">
              Realizando o sonho da casa própria com qualidade, transparência e o atendimento que você merece.
            </p>
          </div>

          {/* 3. Contato - actionable info cards */}
          <div className="mt-7 grid grid-cols-1 gap-2">
            <a
              href="https://maps.google.com/?q=Rua+Exemplo+123+São+Paulo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl bg-white/5 active:bg-white/10 px-4 py-3 transition-colors"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#f2d22e]/15 text-[#f2d22e] shrink-0">
                <MapPin size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0 text-sm">
                <p className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold">Endereço</p>
                <p className="text-white">Rua Exemplo, 123 — São Paulo/SP</p>
              </div>
            </a>
            <a
              href="tel:+5511999999999"
              className="flex items-center gap-3 rounded-xl bg-white/5 active:bg-white/10 px-4 py-3 transition-colors"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#f2d22e]/15 text-[#f2d22e] shrink-0">
                <Phone size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0 text-sm">
                <p className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold">Telefone</p>
                <p className="text-white">(11) 9 9999-9999</p>
              </div>
            </a>
            <a
              href="mailto:contato@moreja.com.br"
              className="flex items-center gap-3 rounded-xl bg-white/5 active:bg-white/10 px-4 py-3 transition-colors"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#f2d22e]/15 text-[#f2d22e] shrink-0">
                <Mail size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0 text-sm">
                <p className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold">E-mail</p>
                <p className="text-white truncate">contato@moreja.com.br</p>
              </div>
            </a>
          </div>

          {/* 4. Navegação - accordions */}
          <nav className="mt-7 border-y border-white/10 divide-y divide-white/10" aria-label="Navegação do rodapé">
            {accordionSections.map((section) => (
              <details key={section.title} className="group">
                <summary className="flex items-center justify-between py-4 cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
                  <span className="font-bold text-[#f2d22e] uppercase tracking-wider text-xs">
                    {section.title}
                  </span>
                  <ChevronDown
                    size={18}
                    className="text-[#f2d22e] transition-transform duration-200 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <ul className="pb-3 -mt-1">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="block py-2.5 pl-1 text-sm text-gray-300 active:text-[#f2d22e] transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </nav>

          {/* 5. Social */}
          <div className="mt-7">
            <p className="text-center text-gray-400 text-[11px] uppercase tracking-wider font-semibold mb-3">
              Siga-nos
            </p>
            <div className="flex justify-center gap-3">
              <a
                href="https://instagram.com/morejaimoveis"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram da Morejá"
                className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/10 active:bg-[#f2d22e] active:text-[#010744] transition-colors"
              >
                <IconInstagram />
              </a>
              <a
                href="https://facebook.com/morejaimoveis"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook da Morejá"
                className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/10 active:bg-[#f2d22e] active:text-[#010744] transition-colors"
              >
                <IconFacebook />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube da Morejá"
                className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/10 active:bg-[#f2d22e] active:text-[#010744] transition-colors"
              >
                <IconYoutube />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ DESKTOP LAYOUT ═══════════════════════ */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-4 gap-10">
            {/* Brand */}
            <div>
              <MoRejaLogo variant="yellow" logoUrl={logoUrl} companyName={companyName} />
              <p className="mt-4 text-sm text-gray-300 leading-relaxed">
                Realizando o sonho da casa própria com qualidade, transparência e o atendimento que você merece.
              </p>
              <div className="flex gap-3 mt-6">
                <a
                  href="https://instagram.com/morejaimoveis"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram da Morejá"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-[#f2d22e] hover:text-[#010744] transition-colors"
                >
                  <IconInstagram />
                </a>
                <a
                  href="https://facebook.com/morejaimoveis"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook da Morejá"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-[#f2d22e] hover:text-[#010744] transition-colors"
                >
                  <IconFacebook />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube da Morejá"
                  className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-[#f2d22e] hover:text-[#010744] transition-colors"
                >
                  <IconYoutube />
                </a>
              </div>
            </div>

            {/* Empresa */}
            <div>
              <h3 className="font-bold text-[#f2d22e] uppercase tracking-wider text-xs mb-5">Empresa</h3>
              <ul className="space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="inline-block py-1 text-sm text-gray-300 hover:text-[#f2d22e] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Comprar / Alugar */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-[#f2d22e] uppercase tracking-wider text-xs mb-5">Comprar</h3>
                <ul className="space-y-3">
                  {buyLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="inline-block py-1 text-sm text-gray-300 hover:text-[#f2d22e] transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-[#f2d22e] uppercase tracking-wider text-xs mb-5">Alugar</h3>
                <ul className="space-y-3">
                  {rentLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="inline-block py-1 text-sm text-gray-300 hover:text-[#f2d22e] transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Contato */}
            <div>
              <h3 className="font-bold text-[#f2d22e] uppercase tracking-wider text-xs mb-5">Contato</h3>
              <ul className="space-y-4">
                <li className="flex gap-3 text-sm text-gray-300">
                  <MapPin size={16} className="text-[#f2d22e] shrink-0 mt-0.5" />
                  <span>Rua Exemplo, 123<br />São Paulo — SP</span>
                </li>
                <li>
                  <a href="tel:+5511999999999" className="flex gap-3 text-sm text-gray-300 hover:text-[#f2d22e] transition-colors">
                    <Phone size={16} className="text-[#f2d22e] shrink-0 mt-0.5" />
                    (11) 9 9999-9999
                  </a>
                </li>
                <li>
                  <a href="mailto:contato@moreja.com.br" className="flex gap-3 text-sm text-gray-300 hover:text-[#f2d22e] transition-colors">
                    <Mail size={16} className="text-[#f2d22e] shrink-0 mt-0.5" />
                    contato@moreja.com.br
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ BOTTOM BAR (shared) ═══════════════════════ */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3 text-xs text-gray-400 text-center sm:text-left">
          <p>© {new Date().getFullYear()} Morejá Imobiliária. Todos os direitos reservados.</p>
          <p>CRECI-SP 00000-J</p>
        </div>
      </div>
    </footer>
  )
}
