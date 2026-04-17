# Morejá — Portal + Admin

Monorepo contendo as duas aplicações do site institucional da **Morejá
Imobiliária**:

| Pasta    | Stack                    | Descrição                                         |
| -------- | ------------------------ | ------------------------------------------------- |
| `portal` | Next.js 16 (App Router)  | Site público — home, busca, detalhe de imóvel     |
| `Admin`  | Vite + React + shadcn/ui | CMS interno — layout de home, imóveis, leads, etc |

Ambas as aplicações compartilham o mesmo projeto Supabase (banco, storage e
edge functions) e integram com o **SupremoCRM** (fonte dos imóveis) via proxy.

## Primeiro setup

```bash
# Portal público
cd portal
cp .env.example .env.local       # preencher chaves
npm install
npm run dev                      # http://localhost:3000

# Admin
cd ../Admin
cp .env.example .env             # preencher chaves
npm install
npm run dev                      # http://localhost:5173
```

## Estrutura

```
portal/
  src/app/                 # Rotas Next.js (App Router)
  src/components/home/     # Seções da home (HeroSection, CategoryCards, ...)
  src/components/properties/
  src/lib/                 # properties.ts, site-config.ts, supabase-*.ts
  src/types/
  supabase/
    migrations/            # 001..008 — schema, seed, home_sections
    functions/
      supremo-proxy/       # Edge function que intermedia a API do Supremo
      send-lead/           # Edge function de captação de leads
  scripts/
    run-migrations.mjs     # Executa migrações localmente
    seed-home-images.mjs   # Popula home_sections com imagens no bucket
    seed-properties.mjs    # Popula properties_cache com imóveis fictícios
Admin/
  src/pages/
    home-layout/           # Editor visual da home (drag-and-drop + editors)
  src/components/shared/   # ImageUploadStorage, FocalPointPicker
```

## Scripts de banco

Todos lêem `SUPABASE_DB_PASSWORD` (e demais vars `SUPABASE_DB_*`) de
`portal/.env.local`:

```bash
cd portal
node scripts/run-migrations.mjs    # aplica migrações em ordem
node scripts/seed-home-images.mjs  # hero + category cards + launches
node scripts/seed-properties.mjs   # 12 imóveis fictícios + 3 corretores
```

## Integração com SupremoCRM

O site consome imóveis via `functions/v1/supremo-proxy` (edge function), que:
1. Adiciona cache de 2h em `properties_cache` para detalhes
2. Faz rate limit por IP
3. Protege o JWT do Supremo (nunca exposto ao browser)

Se o proxy retornar vazio (em dev), `lib/properties.ts` cai automaticamente
para os imóveis seedados em `properties_cache`.
