# Morejá — Plano de Melhorias de Design (refactor em pedaços)

> Auditoria do leiaute atual + roadmap de modernização. Cada item é um
> "pedaço" pequeno, independente, com escopo curto (≤ 200 linhas / 1 arquivo
> principal por PR). Use as labels `mobile`, `desktop`, `ambos` para escolher
> o agente especializado.

---

## 1. Sistema de design (fundação)

Refatorar a base antes de tocar componentes — multiplica o ganho.

### Pedaço 1.1 — Tokens de design centralizados `[ambos]`
- Criar `src/styles/tokens.css` (ou expandir `globals.css`) com escala completa: cores (navy 50–900 ✓ existe no Tailwind, mas não no CSS), spacing semântico (`--space-section: 5rem`), radius (`--radius-card: 1rem`), shadows (3 níveis), durações (`--motion-fast: 150ms`).
- Migrar valores hard-coded `#010744`, `#f2d22e`, `#ededd1` para `var(--brand-*)` em todos os componentes.
- **Arquivos:** `src/app/globals.css`, varredura em `src/components/**`.

### Pedaço 1.2 — Tipografia escalonável `[ambos]`
- Adicionar fluid typography com `clamp()` para H1/H2 (substitui muito `text-3xl md:text-4xl lg:text-5xl` repetitivo).
- Definir 6 níveis: `--text-display`, `--text-h1`, `--text-h2`, `--text-h3`, `--text-body`, `--text-caption`.
- Aplicar `text-balance` em headings de até 2 linhas.
- **Arquivos:** `globals.css` + criar `Typography.tsx` opcional.

### Pedaço 1.3 — Botões com variantes consistentes `[ambos]`
- Hoje há `.btn-primary/.btn-secondary/.btn-outline`. Adicionar `.btn-ghost` (sem fundo) e tamanhos (`--sm`, `--md`, `--lg`).
- Padronizar `min-h-[44px]` em todos (tap target mobile).
- Loading state com spinner inline.
- **Arquivo:** `globals.css` + opcional `components/ui/Button.tsx`.

### Pedaço 1.4 — Container e ritmo vertical `[ambos]`
- Criar `.container-page` (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`) e `.section` (`py-14 sm:py-20 lg:py-24`) — eliminar repetição em ~12 componentes.
- **Arquivos:** `globals.css`, varredura.

---

## 2. Header `[ambos]`

### Pedaço 2.1 — Top bar com contatos rápidos `[desktop]`
- Adicionar barra fina h-9 acima do header com telefone, e-mail e horários — separa "informacional" do "navegação".
- Visível só em `lg:`.

### Pedaço 2.2 — Mega-menu para Comprar/Alugar `[desktop]`
- Hover (delay 150ms) abre painel com 4 colunas: tipos, faixas de preço, cidades em destaque, CTA.
- Chevron animado em label do menu pai.
- ESC fecha; foco volta ao trigger.

### Pedaço 2.3 — Atalho de busca `Cmd+K` / `/` `[desktop]`
- `<dialog>` central (Radix opcional) com input grande + categorias de sugestões (cidades, bairros, IDs de imóveis).
- Indexar dados leves (cidades + tipos) em build; chamar API só se digitar > 2 chars.

### Pedaço 2.4 — Drawer mobile com gestos `[mobile]`
- Adicionar swipe-right para fechar; backdrop com tap-to-close.
- Animação slide-in da direita (em vez de fade).
- Adicionar mini-CTA WhatsApp ao final do drawer.

### Pedaço 2.5 — Ícone de busca persistente `[mobile]`
- Botão de lupa no header < lg que abre overlay full-screen com input focado.
- Histórico de últimas buscas armazenado em `localStorage`.

---

## 3. Hero & busca `[ambos]`

### Pedaço 3.1 — Tabs como segmented control `[ambos]`
- Pill amarela cobrindo a tab ativa com `transform: translateX()` animado.
- Substituir o atual visual (top corners arredondados na ativa, bg/20 nas inativas) por algo mais moderno.
- **Arquivo:** `home/HeroSearch.tsx`.

### Pedaço 3.2 — Busca com chips e autocomplete `[ambos]`
- Input de localização com sugestões (cidades + bairros) — keyboard navigable.
- Chips visíveis dos filtros já aplicados acima do input (ex.: "Recife ✕").

### Pedaço 3.3 — Filtros avançados expansíveis `[ambos]`
- Desktop: linha "Filtros avançados ▾" inline embaixo do form.
- Mobile: bottom sheet com snap-points 50/90% — `<dialog>` com transform-y.
- Faixa de preço com range slider (custom, sem libs pesadas; `<input type="range">` duplo).

### Pedaço 3.4 — Hero com vídeo/parallax leve `[desktop]`
- Suportar `bg_video_url` em `home_sections.config` além de `bg_image`.
- Parallax 5–10% no scroll usando `transform: translateY(scroll * 0.1)` com `will-change`. Desativar em `prefers-reduced-motion`.
- **Arquivo:** `home/HeroSection.tsx`.

### Pedaço 3.5 — Geolocalização "imóveis perto" `[mobile]`
- Botão pin discreto dentro do input que solicita `navigator.geolocation.getCurrentPosition` e busca em raio de 5km.

---

## 4. Property cards e listagens `[ambos]`

### Pedaço 4.1 — Slider de fotos no card (desktop) `[desktop]`
- Hover revela 3 thumbnails + setas; arquivo único, lazy.
- Swipe nativo no card mobile com `scroll-snap`.
- **Arquivo:** `properties/PropertyCard.tsx`.

### Pedaço 4.2 — Botão Salvar (favoritos) `[ambos]`
- Heart icon top-right, persistência em `localStorage` inicialmente; preparar interface para integrar com Supabase Auth depois.

### Pedaço 4.3 — Quick-view modal `[desktop]`
- Botão "Visualização rápida" no hover abre `<dialog>` com galeria + dados-chave + WhatsApp, sem sair da listagem.

### Pedaço 4.4 — Comparador de imóveis `[desktop]`
- Checkbox sutil em até 3 cards; barra fixa inferior aparece com botão "Comparar (2)"; abre página `/comparar?ids=…`.

### Pedaço 4.5 — Carrosséis horizontais nas seções de destaque `[mobile]`
- "Imóveis em destaque", "Lançamentos", "Onde atuamos" viram carrosséis snap-x com peek (1.1 cards visíveis).
- **Arquivos:** `FeaturedProperties.tsx`, `LaunchesPreview.tsx`, `FeaturedCities.tsx`.

### Pedaço 4.6 — Skeleton consistente `[ambos]`
- Toda seção que pode estar carregando passa a renderizar 3–6 `PropertyCardSkeleton`.

---

## 5. Página de listagem (`/comprar`, `/alugar`) `[desktop]`

### Pedaço 5.1 — Sidebar de filtros sticky `[desktop]`
- Layout `lg:grid-cols-[280px_1fr]` com sidebar `sticky top-20`.
- Categorias colapsáveis (Preço, Quartos, Características, Bairro).
- **Arquivo:** revisar `properties/PropertyFiltersClient.tsx` + página.

### Pedaço 5.2 — Toolbar de resultados `[ambos]`
- Linha com contador ("84 imóveis encontrados"), select de ordenação, toggle Grid/Lista/Mapa.

### Pedaço 5.3 — Visualização Mapa `[ambos]`
- Toggle abre layout 50/50 (mobile: full mapa com lista inferior swipeable).
- Pinos coloridos por faixa de preço; cluster ao zoom-out.
- Lib leve: Leaflet + OpenStreetMap (sem API key).

### Pedaço 5.4 — Chips de filtro removíveis `[ambos]`
- Topo da grid mostra todos os filtros aplicados como chips clicáveis para remoção; "Limpar tudo" à direita.

---

## 6. Detalhe do imóvel `[ambos]`

### Pedaço 6.1 — Hero da página com mosaico de fotos `[desktop]`
- Foto principal `col-span-2` + 4 miniaturas 2×2 + botão "Ver todas as 12 fotos".

### Pedaço 6.2 — Lightbox fullscreen `[ambos]`
- Setas, contador "3/12", swipe mobile, esc fecha, miniaturas no rodapé.

### Pedaço 6.3 — Sidebar lead sticky (desktop) `[desktop]`
- Card com foto do corretor, CRECI, telefone, WhatsApp, formulário inline curto.

### Pedaço 6.4 — Bottom action bar (mobile) `[mobile]`
- Sticky bottom com 3 botões iguais: WhatsApp, Ligar, Enviar mensagem.
- Respeita `env(safe-area-inset-bottom)`.

### Pedaço 6.5 — Tour virtual / 360º (placeholder) `[ambos]`
- Estrutura para receber URL de tour 360 (Matterport, Kuula). Botão dedicado abre iframe em modal.

---

## 7. Stats, TrustStats e "Sobre" `[ambos]`

### Pedaço 7.1 — Counter animado `[ambos]`
- Stats animam de 0 ao valor quando entram no viewport (`IntersectionObserver`). Respeitar reduced-motion.
- **Arquivos:** `StatsSection.tsx`, `TrustStats.tsx`.

### Pedaço 7.2 — Selos e logos de parceiros `[desktop]`
- Linha discreta com logos: CRECI, Reclame Aqui, Google Reviews, principais construtoras parceiras. Grayscale → color no hover.

### Pedaço 7.3 — ValueProposition mais rico `[desktop]`
- Adicionar mini-card com foto + nome do CEO/diretor abaixo do CTA "Conheça a Morejá".
- Imagem com mask gradiente em vez de retângulo simples.

---

## 8. Testimonials `[ambos]`

### Pedaço 8.1 — Carrossel mobile com swipe `[mobile]`
- Em `< md` virar carrossel snap-x; mostrar dots de paginação.
- **Arquivo:** `home/TestimonialsSection.tsx`.

### Pedaço 8.2 — Vídeos curtos `[ambos]`
- Suportar `video_url` em testimonial; thumbnail com play button.

### Pedaço 8.3 — Schema.org `Review` `[ambos]`
- Adicionar JSON-LD em testimonials para SEO.

---

## 9. Footer `[ambos]`

### Pedaço 9.1 — Newsletter `[ambos]`
- Bloco com input + "Assinar" — integrar com Supabase (tabela `newsletter_subscribers`).
- Texto convidativo: "Receba lançamentos antes de todo mundo."

### Pedaço 9.2 — Mapa estático do escritório `[desktop]`
- Imagem do mapa (estática Mapbox/OSM) + endereço + horários.

### Pedaço 9.3 — Selos de confiança `[ambos]`
- Linha com CRECI, Reclame Aqui, Google Reviews, ABRA, etc.

### Pedaço 9.4 — Botão flutuante WhatsApp `[mobile + desktop]`
- FAB sticky bottom-right (visível em todas as páginas exceto detalhe que tem bottom bar).
- Animação pulse sutil.

---

## 10. Microinterações & motion `[ambos]`

### Pedaço 10.1 — Reveal animations on scroll `[ambos]`
- Sections fazem fade-in + slide-up ao entrar (já existe `animate-fade-in` no Tailwind config).
- Usar `IntersectionObserver` em vez de libs.

### Pedaço 10.2 — Cursor companion (opcional) `[desktop]`
- Pequeno círculo amarelo que segue o cursor em CTAs primários e em galerias. Não adicionar se prejudicar performance.

### Pedaço 10.3 — Loading spinner unificado `[ambos]`
- Um único componente `<Spinner size />` com animação suave; substituir variações ad-hoc.

---

## 11. Performance & SEO `[ambos]`

### Pedaço 11.1 — Audit de imagens `[ambos]`
- Garantir `next/image` em 100% das imagens; remover `<img>` direto onde possível.
- Definir `sizes` corretos por componente.

### Pedaço 11.2 — Lazy load abaixo do fold `[ambos]`
- `dynamic(() => import())` com `ssr: false` em Banners, Testimonials, FeaturedCities.

### Pedaço 11.3 — Bundle split admin/site `[ambos]`
- Garantir que o admin (Vite) não vaze para o build do site.

### Pedaço 11.4 — Schema.org rico `[ambos]`
- `Product`/`RealEstateListing` no detalhe do imóvel.
- `BreadcrumbList` em listagens.
- `FAQPage` em "Sobre" se aplicável.

---

## 12. Acessibilidade `[ambos]`

### Pedaço 12.1 — Skip link `[ambos]`
- "Pular para conteúdo" no topo, focável só via Tab.

### Pedaço 12.2 — Focus-visible padronizado `[ambos]`
- Auditoria global: todo elemento interativo deve ter ring amarelo offset 2 visível em focus-visible.

### Pedaço 12.3 — Alt text auditoria `[ambos]`
- Substituir `alt=""` em fotos que não são decorativas.

### Pedaço 12.4 — Modo alto contraste / dark `[ambos]`
- Suporte opcional a `prefers-color-scheme: dark` — começar pelo header e footer.

---

## Ordem sugerida de execução

```
Fase A (fundações, 1–2 dias):  1.1 → 1.2 → 1.3 → 1.4
Fase B (header + hero):         2.1 → 2.4 → 3.1 → 3.3 → 2.2 → 2.3
Fase C (cards & listagens):     4.1 → 4.2 → 4.5 → 4.6 → 5.1 → 5.4
Fase D (detalhe do imóvel):     6.4 → 6.1 → 6.2 → 6.3
Fase E (confiança & motion):    7.1 → 8.1 → 9.1 → 9.4 → 10.1
Fase F (perf, SEO, A11y):       11.1 → 11.4 → 12.1 → 12.2
```

Cada pedaço:
1. Branch dedicada com nome `design/<seção>-<id>`.
2. PR com print do antes/depois (mobile + desktop) e checklist do agente correspondente.
3. Sem misturar alterações de "fundação" (fase A) com refatorações de componentes — quebra a revisão.

---

## Convenções para os PRs

- Não introduzir libs novas sem justificativa explícita (motion libs, UI kits).
- Se um pedaço tocar `globals.css` ou o tema do Tailwind, **anote no PR**: pode impactar mais do que parece.
- Quando o pedaço afeta mobile e desktop, peça revisão dos dois agentes (`ui-ux-mobile` e `ui-ux-desktop`).
- Sempre rodar `npm run lint` e `npm run build` antes de pedir revisão.
- Capturar Lighthouse antes/depois nos PRs de fase A, B e F.
