# Morejá — Status do Refactor

> Documento vivo. Atualizado a cada bloco. Branch: `claude/redesign-modern-website-f5ybv` · PR #5

## 📊 Resumo geral

| Bloco | Tema | Status |
|---|---|---|
| 0 | Hotfix segurança + lead form | ✅ |
| 1 | DB foundation (migrations 010-020) | ✅ |
| 2 | Design system (tokens + shadcn + DOMPurify) | ✅ |
| 3 | Refactor visual desktop | ✅ |
| 4 | Mobile polish + PWA | ✅ |
| 5 | SEO avançado | ✅ |
| 6 | Tracking & LGPD Consent Mode v2 | ✅ |
| 7 | Supremo CRM hardening | ✅ código / ⏳ deploy edge fns |
| 8 | Admin refactor + seções RE/MAX | 🔜 próximo |
| 9 | Security hardening pleno | 🔜 |
| 10 | Performance & QA final | 🔜 |
| 11 | Diferenciadores opcionais (AI search, mapa interativo) | 🔜 opcional |

---

## ✅ Já feito (entregue)

### Segurança crítica (Bloco 0)
- `is_admin()` reescrita lendo `admin_users` (era `user_metadata` self-editable)
- Migração de admins existentes preservada
- Drop `public_insert_leads` RLS — só edge function escreve
- CHECK constraints em `leads` (size + email format)
- Lead form quebrado em produção corrigido (mismatch PT/EN field names)

### Database (Bloco 1)
- 11 migrations idempotentes 010-020:
  - `audit_log` + trigger genérico em 10 tabelas CMS
  - Branding dark mode keys + paleta nova como default
  - Tracking extras (GA4, Clarity, Hotjar, CAPI, Consent Mode keys)
  - `tracking_scripts` (slot system head/body_start/body_end)
  - `seo_routes` (SEO por rota não-CMS)
  - Navigation + footer_links (nav configurável)
  - Pages com revisões + status enum
  - UI strings (textos editáveis)
  - Leads UTM/Supremo (14 colunas novas)
  - `favorites`, `saved_searches`, `property_price_history`, `lancamentos_waitlist`, `valuation_requests`, `neighborhood_guides`
  - RLS tightening + indexes parciais

### Design System (Bloco 2)
- Tokens Tailwind v4: `--text-display-xl` (clamp 48-96px), `--shadow-brand-lg`, `--shadow-yellow-glow`, surfaces semânticas
- Dark mode wiring via `[data-theme="dark"]` + bootstrap script anti-flash
- Inter font (body) + Raleway (display)
- 10 primitivos shadcn em `src/components/ui/`: Button, Card, Dialog, Sheet, Input, Select, Tabs, Tooltip, Badge, Skeleton
- `cn()` helper (clsx + tailwind-merge)
- DOMPurify substituiu regex sanitizer

### Visual desktop (Bloco 3)
- HeroSection: display-xl statement (96px), eyebrow, min-h 720px, glow yellow decorativo
- HeroSearch: 4 campos desktop (location/tipo/quartos/preço) + bottom-sheet de Filtros mobile
- PropertyCard: slider de fotos com setas + dots, badges via `<Badge>`, contraste fix
- BannersSection: `next/image`, arrows 48×48 glassmorphism, pause WCAG
- LaunchesPreview: variante DARK Ocean Cavern + dotted overlay
- FeaturedCities: grid asymmetric desktop (1 hero 2×2 + 4 small)
- LaunchesWaitlist (NOVO) — Pré-Lançamento opt-in com LGPD consent

### Mobile + PWA (Bloco 4)
- PWA manifest com SVG icons brandados (any + maskable)
- PwaInstallPrompt deferred (após 3 pageviews, 30 dias dismissal, fallback iOS)
- IdleCallbackPrompt — bottom sheet "Quer que um corretor te ligue?" após 45s
- CarouselDots primitivo + aplicado em FeaturedProperties
- HeroBackdrop LCP otimizado (next/image priority + fetchPriority high)
- Recent searches no MobileSearchButton (já existia)
- Web Share API no ShareButtonClient (já existia)

### SEO (Bloco 5)
- `generateMetadata` async em /comprar /alugar /empreendimentos /sobre /contato lendo `seo_routes`
- Filter pages auto `noindex` quando query string presente (UTMs whitelisted)
- Sitemap split via `generateSitemaps` em /sitemap/0..2.xml
- Image sitemap (`<image:image>`) embedado nas listings
- PropertyJsonLd enriquecido: geo, image[], yearBuilt, datePosted, petsAllowed, additionalProperty[]
- Helpers FaqJsonLd + PersonJsonLd
- Dynamic OG images via `next/og` ImageResponse (imovel + empreendimentos)
- robots.ts: disallow /admin, GPTBot/CCBot, query strings
- next.config.ts security headers (CSP, HSTS, X-Frame-Options, etc.)
- `/bairros` index + `/bairros/[slug]` (SEO moat — neighborhood guides)
- MortgageSimulatorCTA (Caixa + BB deep-link) no detalhe Venda

### Tracking & LGPD (Bloco 6)
- `lib/consent.ts` + CookieConsent banner granular (Aceitar / Recusar / Personalizar Sheet)
- ConsentModeInit script `beforeInteractive` (defaults denied)
- GA4 standalone + cookie_flags Secure/SameSite
- Microsoft Clarity + Hotjar gateados por analytics consent
- Meta Pixel + TikTok gateados por marketing consent
- `tracking_scripts` slot system (admin pode colar scripts arbitrários)
- `/api/meta-capi` server-side (SHA-256 hash PII, IP/UA/cookies auto, dedup via event_id)
- PixelEvents extendido com event_id + sendBeacon CAPI
- PropertyViewTracker plugado em /imovel e /empreendimentos
- ManageConsentLink no Footer

### Supremo hardening (Bloco 7)
- send-lead **agora empurra leads pro Supremo** via POST `/oportunidades` (era só Supabase)
- fetch retry/backoff (250ms · 500ms · 1.5s) + timeout 8s + circuit breaker via stale-on-error
- Stale-on-error fallback (serve cache até 24h se Supremo cair)
- Cache de listas (10min TTL) — eliminou N+1 de fotos
- Detail TTL bug fix (30min → 2h)
- fetchEmpreendimentos com filtros completos (era só 4 de 11)
- fetchUnits(empId) — endpoint novo p/ tipologias
- supremo-retry edge function + pg_cron schedule (5min) — migration 021
- IP/UA hashed (LGPD) em leads
- Tracking enrichment client-side (lib/lead-tracking.ts) com sticky UTMs first-touch

---

## ⏳ Pendente

### Você precisa fazer manualmente
1. **Aplicar migrations 009-021 no Supabase** — colar `supabase/EXECUTE_BLOCK_1.sql` (Bloco 0+1) e `supabase/migrations/021_*.sql` (Bloco 7) no SQL Editor
2. **Deploy edge functions** — `supremo-proxy`, `send-lead`, `supremo-retry` precisam ser deployadas (Supabase CLI: `supabase functions deploy`)
3. **Configurar GUCs** para o cron Supremo (ver header do `021_*.sql`):
   ```sql
   ALTER DATABASE postgres SET app.settings.supabase_url = '...';
   ALTER DATABASE postgres SET app.settings.service_role_key = '...';
   SELECT pg_reload_conf();
   ```
4. **Preencher tracking IDs em site_config** — ga4_measurement_id, fb_pixel_id, meta_capi_access_token, clarity_id, hotjar_id (opcional, pixels só disparam se preenchido)
5. **Inserir admin owner** em `admin_users` se não houver — `INSERT INTO admin_users (user_id, role) SELECT id, 'owner' FROM auth.users WHERE email='...'`
6. **Desligar email signup** (Supabase Auth → Providers → Email)
7. **Rotacionar segredos** (decisão sua para o final): SUPABASE_SERVICE_ROLE_KEY, SUPREMO_JWT, DB password
8. **Popular conteúdo** opcional: `neighborhood_guides`, `lancamentos_waitlist` ativar a seção, banners, testimonials, etc

### Bloco 8 — Admin refactor + seções RE/MAX (🔜 próximo)
- shadcn pass nas páginas admin (Dashboard, banners, brokers, leads, etc.)
- Image-crop moderno (react-easy-crop + FocalPointPicker existente)
- Branding panel light/dark (lê migration 011)
- SEO Control Center (edita seo_routes + pages.meta_*)
- Navigation editor (header + drawer + footer — usa migrations 014/015)
- UI strings editor (migration 017)
- Audit log viewer (migration 010)
- Admin users + roles UI (migration 009)
- Pages CMS com draft/publish/archive + revisões (migration 016)
- MFA + idle timeout
- 🆕 RE/MAX-inspired sections (do brief do agente):
  - **TeamSection.tsx** "Encontre um Corretor" (lê `brokers`)
  - **PropertyValuationCTA + /avaliar** wizard 4-step (`valuation_requests`)
  - **BlogPreview + /blog** — exige nova migration `posts`
  - **TopBar.tsx** institucional acima do header
  - **Badge "Morejá Premium"** auto-aplicada acima de threshold
  - **CoverageMap.tsx** SVG das regiões atendidas
  - Contagem ao vivo de imóveis nas FeaturedCities

### Bloco 9 — Security hardening pleno
- CSP com nonce per-request
- Cloudflare Turnstile + honeypot nos forms
- RLS gaps remanescentes (audit do agente)
- Privatizar storage buckets (signed URLs, drop SVG MIME)
- DOMPurify para HTML do Supremo
- CORS allowlist (não wildcard) nas edge functions
- Audit log triggers viewer + retention policy
- File upload validation (MIME sniff + size + virus scan async)

### Bloco 10 — Performance & QA
- Lighthouse audit final (mobile + desktop)
- ISR per resource (revalidate strategy)
- Cross-device QA (iPhone, Android, iPad, desktop 1440 + 1920)
- Vercel deploy verification
- Bundle analyzer review

### Bloco 11 — Diferenciadores opcionais (pós-launch)
- 🅓 AI natural-language search (OpenAI function-calling → filtros)
- 🅓 Drawn-area map search (Mapbox Draw)
- 🅓 List/Map toggle nos resultados
- 🅓 Quick-view modal (Compass/Zillow pattern)
- 🅓 Comparador de imóveis (até 3, /comparar)
- 🅓 Sub-nav sticky pós hero
- 🅓 CMD+K busca global (Linear-style)
- 🅓 FAQ dinâmico
- 🅓 Push notifications VAPID
- 🅓 Calculadora aluguel vs compra
- 🅓 Saved-search alerts (cron WhatsApp/email)
- 🅓 Imóveis vistos recentemente
- 🅓 Heart animation no SaveButton
- 🅓 Top bar institucional com link "Anuncie seu imóvel"

### Recomendações dos agentes (parcialmente endereçadas)
- ✅ Top 12 features pesquisa desktop (luxury/lançamentos): 7 feitas, 5 nos blocos 8/11
- ✅ Top 10 features pesquisa mobile: 8 feitas, 2 deferidas (list/map toggle, scroll restoration)
- ⏳ Top 8 features RE/MAX BR: 1 feita (badge), 7 no Bloco 8

---

## 📁 Arquivos relevantes

| Tema | Caminho |
|---|---|
| Sumário e progresso | `STATUS.md` (este arquivo) |
| Migrations | `supabase/migrations/001-021_*.sql` |
| Aplicar migrations Bloco 0+1 | `supabase/EXECUTE_BLOCK_1.sql` (paste no SQL Editor) |
| Edge functions | `supabase/functions/{supremo-proxy,send-lead,supremo-retry}/index.ts` |
| Hotfix docs | `docs/SECURITY_HOTFIX_009.md` |
| Site público | `src/app/`, `src/components/{home,layout,properties,seo,ui}` |
| Admin SPA | `admin/` (Vite + React + shadcn/ui) |
