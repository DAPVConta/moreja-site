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
| 8a | Seções RE/MAX no público | ✅ |
| 8b | Admin SPA refactor (parcial) | ✅ páginas-chave / 🔜 polish |
| 9 | Security hardening pleno | ✅ CSP nonce + Turnstile + CORS allowlist + retention |
| 10 | Performance & QA | ✅ ISR strategy + next/image migration final |
| 11a | Diferenciadores parte 1 | ✅ Recently viewed + Comparador + FAQ |
| 11b | Diferenciadores remanescentes (AI search, mapa interativo, push) | 🔜 opcional |

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

### Diferenciadores parte 1 (Bloco 11a)
- **Recently Viewed** — `lib/recently-viewed.ts` com localStorage (até 12 imóveis), `RecentlyViewedTracker` plug em /imovel/[id] e /empreendimentos/[id], `RecentlyViewedSection` na home (renderiza nada se vazio — SSR-safe via mount-after-hydration)
- **Comparador** — `lib/compare.ts` com sessionStorage (até 3 imóveis), `CompareToggle` no PropertyCard (botão flutuante sobre foto), `CompareFloatingBar` global no layout (só aparece com 1+ items) com link para /comparar
- **`/comparar`** — tabela side-by-side com Tipo · Finalidade · Área · Quartos · Banheiros · Vagas · Condomínio · IPTU · Preço m² + destaque automático do "vencedor" por linha (max para área/quartos/banheiros/vagas; min para condomínio/IPTU/preço m²) com badge ✓ verde
- **FAQ Accordion** — componente server-side com `<details>`/`<summary>` nativo (zero JS, acessível via teclado), schema FAQPage embed para rich snippet do Google, 6 FAQs default (avaliação, comissão, documentos, simulação, cobertura, segmentos), 1ª aberta por default
- 2 entradas novas no `sectionMap` da home: `recently_viewed`, `faq` — admin pode ativar/reordenar via `home_sections`

### Performance & QA (Bloco 10)
- **ISR strategy** declarada por rota:
  - `/` (home) — `revalidate = 300` (5min)
  - `/sobre` — `revalidate = 3600` (1h, conteúdo raramente muda)
  - `/comprar`, `/alugar`, `/empreendimentos` — listas dinâmicas, dependem de Supremo proxy (que tem cache 10min)
  - `/imovel/[id]`, `/empreendimentos/[id]` — SSG via generateStaticParams
- **proxyFetch** com revalidate dinâmico por tipo de resource: lists 5min, detail 30min, units 1h (camada extra além do cache do edge function)
- **bg-image → next/image** migration completa:
  - `CategoryCards.tsx` — usava `style={{ backgroundImage: ... }}`, agora `<Image fill sizes>`
  - `ValueProposition.tsx` — mesmo tratamento
  - HeroBackdrop, BannersSection, FeaturedCities, LaunchesPreview, BlogPreview, TeamSection já estavam usando next/image desde os blocos anteriores
- Build final: 18 rotas, middleware ativo, CSP nonce funcionando, todos os pixels gateados por consent

### Security hardening pleno (Bloco 9)
- **Middleware CSP com nonce per-request** — `src/middleware.ts` gera nonce hex base64 por request, propaga via header `x-nonce`, layout/scripts inline lêem via next/headers e aplicam nonce em `<script>` e `<style>` inline. CSP tem `script-src 'strict-dynamic' 'nonce-XXX'` + allowlist de hosts (Supremo, Supabase, GA4, Meta, Clarity, Hotjar, etc.)
- **Cloudflare Turnstile** — bot detection sem PII (free, alternativa ao reCAPTCHA). Migration 024 adiciona `turnstile_site_key/secret_key`. Componente `TurnstileWidget` lazy-load do script global. `/api/turnstile-verify` route SHA validation server-side com IP correlation. Plugado em ContactForm + LeadFormInline (imovel + empreendimentos)
- **Honeypot field** — campo invisível "website" que humanos não preenchem; submissão silenciosa para bots
- **Min-time-to-submit** — bloqueia submissão em < 2s desde mount (humano leva mais)
- **CORS allowlist** nas edge functions — substituiu `*` por origin-based (env `ALLOWED_ORIGINS` + regex p/ *.vercel.app previews)
- **Migration 023 rate_limit_buckets** — tabela persistente substituindo Map em memória das edge functions; pg_cron cleanup hourly
- **Migration 023 audit retention** — pg_cron daily 03h limpa `audit_log` > 90 dias

### Admin SPA — páginas-chave (Bloco 8b)
- **Sidebar** reorganizada em 4 grupos: Conteúdo / Leads / Configuração / Sistema
- **`/usuarios-admin`** — lista admin_users, troca de role inline (owner/admin/editor/viewer), remoção; convite gera SQL snippet (Supabase Auth não permite convite via anon)
- **`/auditoria`** — viewer do `audit_log` com filtros por tabela e ação, expand-on-click pra ver diff JSON formatado
- **`/tracking`** — CRUD de `tracking_scripts` agrupado por placement (head / body_start / body_end), com toggle ativo, notas, modal pra colar código
- **`/seo`** — CRUD de `seo_routes` (title/description/og_image/canonical/robots por rota)
- **`/blog`** — CRUD de posts (drafts/published/archived) com title/slug/excerpt/cover/categoria/conteúdo Markdown + meta SEO
- **`/avaliacoes`** — inbox de `valuation_requests` com cards (filtro de status + dropdown contextual), todos os dados do wizard /avaliar
- **`/lista-espera`** — inbox de `lancamentos_waitlist` em tabela com export CSV

### Seções RE/MAX no público (Bloco 8a)
- TopBar institucional com "Anuncie seu imóvel" + "Equipe" no Header (desktop)
- `TeamSection.tsx` — "Encontre um Corretor" lendo `brokers` table (foto, CRECI, especialidades, WhatsApp/Phone/Email CTAs)
- `PropertyValuationCTA.tsx` — seção home pitch + benefits para vendedor
- `/avaliar` — wizard 4-step (Tipo+Finalidade · Localização+Área · Detalhes · Contato) com progress bar, grava em `valuation_requests` E dispara send-lead → Supremo
- `BlogPreview.tsx` — 3 artigos da home lendo `posts` table (migration 022)
- `CoverageMap.tsx` — mapa de cobertura por bairros sem JS de mapa (zero deps), dotted overlay + grid de regiões com contagem
- Badge "Morejá Premium" auto-aplicada em PropertyCard quando preço > threshold (default R$ 1MM, configurável)
- Migration 022 — `posts` table com status enum + RLS + audit trigger
- 4 entradas novas no sectionMap da home: `team`, `valuation_cta`, `blog_preview`, `coverage_map` (admin pode reordenar/ativar)

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

### Bloco 8b — Admin polish (🔜 não-urgente, pra depois do Bloco 9)
- Branding panel light/dark separado em SiteConfigPage (migration 011)
- Pages CMS com revisions (migration 016) — UI de drafts/publish/archive
- Navigation editor (migrations 014/015) — header/drawer/footer drag-and-drop
- UI strings editor (migration 017) — textos editáveis
- Brokers editor enriquecido (especialidades chip, foto crop, drag-order)
- MFA + idle timeout (Supabase Auth + react-idle-timer)
- Image upload com FocalPointPicker já existe — refinar UX

### Pendente Bloco 8a (você popular conteúdo)
- Inserir corretores em `brokers` (admin SPA já edita, mas verifique RLS funciona após migrations 009)
- Criar artigos em `posts` (migration 022 ativa quando rodar; admin SPA do 8b vai ter editor)
- Configurar `coverage_map` config jsonb no home_sections com regions array
- Considerar custom `premium_price_threshold` em site_config se R$ 1MM não fizer sentido pro mercado de Recife

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
