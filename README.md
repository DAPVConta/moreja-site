# teste
# Morejá — Portal + Admin

Site institucional + CMS da **Morejá Imobiliária** no mesmo repositório.

| Caminho | Stack | Descrição |
| --- | --- | --- |
| `/` (raiz) | Next.js 16 (App Router) | Site público — home, busca, detalhe de imóvel |
| `/admin` | Vite + React + shadcn/ui | CMS interno — layout de home, imóveis, leads |

Ambas as aplicações usam o mesmo projeto Supabase (banco, storage e edge
functions) e integram com o **SupremoCRM** (fonte dos imóveis) via proxy.

## Primeiro setup

```bash
# Site público (na raiz)
cp .env.example .env.local       # preencher chaves
npm install
npm run dev                      # http://localhost:3000

# Admin (em /admin)
cd admin
cp .env.example .env             # preencher chaves
npm install
npm run dev                      # http://localhost:5173
```

## Estrutura

```
/                        ← Next.js (portal público)
├── src/
│   ├── app/             Rotas (App Router)
│   ├── components/home/ HeroSection, CategoryCards, ...
│   ├── components/properties/
│   ├── lib/             properties.ts, site-config.ts, supabase-*.ts
│   └── types/
├── supabase/
│   ├── migrations/      001..008 — schema, seed, home_sections
│   └── functions/
│       ├── supremo-proxy/   Edge function que intermedia a API do Supremo
│       └── send-lead/       Captação de leads
├── scripts/
│   ├── run-migrations.mjs    Aplica migrações localmente
│   ├── seed-home-images.mjs  Popula home_sections com imagens no bucket
│   └── seed-properties.mjs   Popula properties_cache com imóveis fictícios
└── admin/               ← Vite + React (CMS)
    ├── src/pages/
    │   └── home-layout/      Editor visual da home (drag-and-drop)
    └── src/components/shared/  ImageUploadStorage, FocalPointPicker
```

## Scripts de banco

Todos lêem `SUPABASE_DB_PASSWORD` (e demais vars `SUPABASE_DB_*`) de
`.env.local` na raiz:

```bash
node scripts/run-migrations.mjs    # aplica migrações em ordem
node scripts/seed-home-images.mjs  # hero + category cards + launches
node scripts/seed-properties.mjs   # 12 imóveis fictícios + 3 corretores
```

## Deploy na Vercel

Dois projetos separados apontando para o mesmo repositório:

| Projeto | Root Directory | Framework | Domínio |
| --- | --- | --- | --- |
| `moreja-site` | *(raiz)* | Next.js | moreja.com.br |
| `moreja-admin` | `admin` | Vite | admin.moreja.com.br |

Cada projeto rebuilda automaticamente a cada push em `main`, mas apenas se
houver mudanças dentro do seu próprio Root Directory.

## Integração com SupremoCRM

O site consome imóveis via `functions/v1/supremo-proxy` (edge function), que:
1. Adiciona cache de 2h em `properties_cache` para detalhes
2. Faz rate limit por IP
3. Protege o JWT do Supremo (nunca exposto ao browser)

Se o proxy retornar vazio (em dev), `src/lib/properties.ts` cai automaticamente
para os imóveis seedados em `properties_cache`.

## teste
