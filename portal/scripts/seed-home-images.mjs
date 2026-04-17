/**
 * Baixa imagens externas (Unsplash), redimensiona, envia ao bucket
 * `site` do Supabase e grava as URLs finais em home_sections.config.
 *
 * Seções tratadas:
 *   - hero_search (imagem de fundo do banner principal)
 *   - category_cards (3 cards: Residencial, Comercial, Empreendimentos)
 *   - launches_preview (3 lançamentos fictícios)
 *
 * Rodar: node scripts/seed-home-images.mjs
 * Auto-carrega .env.local para pegar SUPABASE_SERVICE_ROLE_KEY.
 */
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { Client } from 'pg'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

// ── .env.local loader ──────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://yxlepgmlhcnqhwshymup.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('✗ SUPABASE_SERVICE_ROLE_KEY não encontrada em .env.local')
  process.exit(1)
}

const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD
if (!SUPABASE_DB_PASSWORD) {
  console.error('✗ SUPABASE_DB_PASSWORD não encontrada em .env.local')
  process.exit(1)
}
const DB = {
  host: process.env.SUPABASE_DB_HOST ?? 'db.yxlepgmlhcnqhwshymup.supabase.co',
  port: Number(process.env.SUPABASE_DB_PORT ?? 5432),
  database: process.env.SUPABASE_DB_NAME ?? 'postgres',
  user: process.env.SUPABASE_DB_USER ?? 'postgres',
  password: SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
}

const BUCKET = 'site'

// ── 0) Hero background ─────────────────────────────────────────────
const HERO = {
  source: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=2400&q=90',
  filename: 'hero-bg.webp',
}

// ── 1) Category cards ──────────────────────────────────────────────
const CATEGORY_CARDS = [
  {
    title: 'Residencial',
    description: 'Apartamentos, casas e condomínios para sua família',
    href: '/comprar?tipo=Apartamento',
    source: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&q=90',
    filename: 'residencial.webp',
  },
  {
    title: 'Comercial',
    description: 'Salas, galpões e espaços para o seu negócio crescer',
    href: '/comprar?tipo=Comercial',
    source: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=90',
    filename: 'comercial.webp',
  },
  {
    title: 'Empreendimentos',
    description: 'Lançamentos exclusivos e novos empreendimentos',
    href: '/empreendimentos',
    source: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&q=90',
    filename: 'empreendimentos.webp',
  },
]

// ── 2) Launches ────────────────────────────────────────────────────
const LAUNCHES = [
  {
    id: 'aurora-vista',
    name: 'Residencial Aurora Vista',
    developer: 'Construtora Alfa',
    location: 'Tatuapé, São Paulo',
    status: 'Lançamento',
    delivery: 'Entrega 2027',
    priceFrom: 'A partir de R$ 580 mil',
    href: '/empreendimentos/aurora-vista',
    source: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&q=90',
    filename: 'aurora-vista.webp',
  },
  {
    id: 'edificio-horizonte',
    name: 'Edifício Horizonte',
    developer: 'Morejá Empreendimentos',
    location: 'Vila Olímpia, São Paulo',
    status: 'Em obras',
    delivery: 'Entrega 2026',
    priceFrom: 'A partir de R$ 920 mil',
    href: '/empreendimentos/edificio-horizonte',
    source: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=90',
    filename: 'edificio-horizonte.webp',
  },
  {
    id: 'park-residence-club',
    name: 'Park Residence Club',
    developer: 'Construtora Beta',
    location: 'Santana, São Paulo',
    status: 'Pré-lançamento',
    delivery: 'Previsão 2028',
    priceFrom: 'Sob consulta',
    href: '/empreendimentos/park-residence-club',
    source: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1600&q=90',
    filename: 'park-residence-club.webp',
  },
]

// ── Helpers ────────────────────────────────────────────────────────
const publicUrl = (path) =>
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`

async function downloadAndResize(url, w, h, fit = 'cover') {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ao baixar ${url}`)
  const buf = Buffer.from(await resp.arrayBuffer())
  const orig = (buf.length / 1024).toFixed(1)
  const resized = await sharp(buf)
    .resize(w, h, { fit, position: 'center', withoutEnlargement: fit === 'inside' })
    .webp({ quality: 85 })
    .toBuffer()
  const out = (resized.length / 1024).toFixed(1)
  console.log(`    ${orig} KB → ${out} KB (${w}×${h}, ${fit})`)
  return resized
}

async function upload(supabase, path, buffer) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: 'image/webp',
    upsert: true,
    cacheControl: '31536000',
  })
  if (error) throw error
  console.log(`    ↑ ${BUCKET}/${path}`)
}

// ── Main ───────────────────────────────────────────────────────────
async function run() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const pg = new Client(DB)
  await pg.connect()
  console.log('✓ Conectado ao Supabase\n')

  // ── Hero: imagem completa preservada (admin escolhe foco) ───────
  console.log('=== Hero ===')
  {
    const buf = await downloadAndResize(HERO.source, 2400, 1600, 'inside')
    const path = `home/hero/${HERO.filename}`
    await upload(supabase, path, buf)
    const heroConfig = {
      title: 'Encontre o imóvel',
      highlight: 'dos seus sonhos',
      subtitle:
        'A Morejá Imobiliária oferece os melhores imóveis residenciais e comerciais. Compre, alugue ou invista com segurança e qualidade.',
      bg_image: publicUrl(path),
      bg_focal_x: 50,
      bg_focal_y: 50,
      overlay_opacity: 0.6,
    }
    await pg.query(
      `UPDATE home_sections
          SET config = $1::jsonb, updated_at = now()
        WHERE section_type = 'hero_search'`,
      [JSON.stringify(heroConfig)],
    )
    console.log('✓ home_sections.config atualizado para hero_search\n')
  }

  // ── Category cards: 800×1000 (4:5) ───────────────────────────────
  console.log('=== Category Cards ===')
  const cardsOut = []
  for (const card of CATEGORY_CARDS) {
    console.log(`→ ${card.title}`)
    const buf = await downloadAndResize(card.source, 800, 1000)
    const path = `home/category-cards/${card.filename}`
    await upload(supabase, path, buf)
    cardsOut.push({
      title: card.title,
      description: card.description,
      href: card.href,
      bg: publicUrl(path),
    })
  }

  const cardsConfig = {
    title: 'O que você procura?',
    subtitle: 'Encontre o imóvel ideal para cada momento da sua vida',
    cards: cardsOut,
  }

  await pg.query(
    `UPDATE home_sections
        SET config = $1::jsonb, updated_at = now()
      WHERE section_type = 'category_cards'`,
    [JSON.stringify(cardsConfig)],
  )
  console.log('✓ home_sections.config atualizado para category_cards\n')

  // ── Launches: 1000×750 (4:3) ─────────────────────────────────────
  console.log('=== Lançamentos ===')
  const launchesOut = []
  for (const l of LAUNCHES) {
    console.log(`→ ${l.name}`)
    const buf = await downloadAndResize(l.source, 1000, 750)
    const path = `home/launches/${l.filename}`
    await upload(supabase, path, buf)
    launchesOut.push({
      id: l.id,
      name: l.name,
      developer: l.developer,
      location: l.location,
      status: l.status,
      delivery: l.delivery,
      priceFrom: l.priceFrom,
      href: l.href,
      image: publicUrl(path),
    })
  }

  const launchesConfig = {
    title: 'Lançamentos exclusivos',
    subtitle: 'Empreendimentos com condições especiais direto da construtora',
    href_all: '/empreendimentos',
    launches: launchesOut,
  }

  // Também ativa a seção já que agora tem conteúdo real
  await pg.query(
    `UPDATE home_sections
        SET config = $1::jsonb,
            active = true,
            updated_at = now()
      WHERE section_type = 'launches_preview'`,
    [JSON.stringify(launchesConfig)],
  )
  console.log('✓ home_sections.config atualizado para launches_preview\n')

  await pg.end()

  console.log('URLs dos cards:')
  cardsOut.forEach((c) => console.log(`  ${c.title}: ${c.bg}`))
  console.log('\nURLs dos lançamentos:')
  launchesOut.forEach((l) => console.log(`  ${l.name}: ${l.image}`))
  console.log('\nHero: ' + publicUrl(`home/hero/${HERO.filename}`))
  console.log('\n✓ Seed concluído.')
}

run().catch((err) => {
  console.error('\n✗ Fatal:', err.message)
  if (err.cause) console.error('   cause:', err.cause.message)
  process.exit(1)
})
