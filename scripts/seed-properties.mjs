/**
 * Popula `properties_cache` com imóveis fictícios para testar o site sem
 * depender do SupremoCRM.
 *
 * - Baixa fotos do Unsplash, redimensiona e envia ao bucket `site`.
 * - Grava cada imóvel como JSON completo no formato `Property`.
 * - Usa external_id `imovel_mock-NN` e expires_at daqui a 10 anos
 *   (nunca "expira" em dev).
 *
 * Rodar: node scripts/seed-properties.mjs
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

// ── Corretores ──────────────────────────────────────────────────────
const CORRETORES = [
  {
    id: 'c-001',
    nome: 'Ana Beatriz Souza',
    creci: 'CRECI-SP 123456-J',
    whatsapp: '5511987654321',
    foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=85',
  },
  {
    id: 'c-002',
    nome: 'Rafael Monteiro',
    creci: 'CRECI-SP 234567-F',
    whatsapp: '5511987650000',
    foto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=85',
  },
  {
    id: 'c-003',
    nome: 'Juliana Tavares',
    creci: 'CRECI-SP 345678-F',
    whatsapp: '5511987654000',
    foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=85',
  },
]

// ── Imóveis ─────────────────────────────────────────────────────────
// Cada foto será baixada, redimensionada e re-hospedada no bucket.
const IMOVEIS = [
  {
    codigo: 'MJ-001',
    titulo: 'Apartamento moderno com vista panorâmica em Moema',
    tipo: 'Residencial',
    subtipo: 'Apartamento',
    finalidade: 'Venda',
    preco: 1850000,
    preco_condominio: 1850,
    preco_iptu: 420,
    bairro: 'Moema',
    cidade: 'São Paulo',
    estado: 'SP',
    area_total: 142,
    area_util: 118,
    quartos: 3,
    suites: 1,
    banheiros: 3,
    vagas: 2,
    destaque: true,
    descricao:
      'Apartamento alto padrão com acabamento impecável, varanda gourmet e vista para o Parque Ibirapuera. Prédio com lazer completo e 24h de segurança.',
    fotos: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=85',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=85',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=85',
    ],
    corretor: 'c-001',
  },
  {
    codigo: 'MJ-002',
    titulo: 'Cobertura duplex com terraço privativo na Vila Nova Conceição',
    tipo: 'Residencial',
    subtipo: 'Apartamento',
    finalidade: 'Venda',
    preco: 4200000,
    preco_condominio: 3200,
    preco_iptu: 950,
    bairro: 'Vila Nova Conceição',
    cidade: 'São Paulo',
    estado: 'SP',
    area_total: 280,
    area_util: 210,
    quartos: 4,
    suites: 3,
    banheiros: 5,
    vagas: 4,
    destaque: true,
    descricao:
      'Cobertura exclusiva com piscina privativa, churrasqueira, spa e vista 360º da cidade. Projeto arquitetônico premiado e automação completa.',
    fotos: [
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=1600&q=85',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=1600&q=85',
    ],
    corretor: 'c-002',
  },
  {
    codigo: 'MJ-003',
    titulo: 'Apartamento arejado de 2 dormitórios em Pinheiros',
    tipo: 'Residencial',
    subtipo: 'Apartamento',
    finalidade: 'Venda',
    preco: 780000,
    preco_condominio: 890,
    preco_iptu: 180,
    bairro: 'Pinheiros',
    cidade: 'São Paulo',
    estado: 'SP',
    area_total: 68,
    area_util: 62,
    quartos: 2,
    suites: 1,
    banheiros: 2,
    vagas: 1,
    destaque: true,
    descricao:
      'Unidade com planta inteligente, próxima ao metrô Faria Lima e ao polo gastronômico de Pinheiros. Condomínio com academia e coworking.',
    fotos: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1600&q=85',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=85',
    ],
    corretor: 'c-003',
  },
  {
    codigo: 'MJ-004',
    titulo: 'Apartamento charmoso para locação na Vila Mariana',
    tipo: 'Residencial',
    subtipo: 'Apartamento',
    finalidade: 'Locação',
    preco: 4800,
    preco_condominio: 760,
    preco_iptu: 120,
    bairro: 'Vila Mariana',
    cidade: 'São Paulo',
    estado: 'SP',
    area_total: 75,
    area_util: 70,
    quartos: 2,
    suites: 1,
    banheiros: 2,
    vagas: 1,
    destaque: true,
    descricao:
      'Apartamento reformado, com cozinha americana e sala integrada. Bairro arborizado, próximo ao Parque da Aclimação e estações de metrô.',
    fotos: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=85',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&q=85',
    ],
    corretor: 'c-001',
  },
  {
    codigo: 'MJ-005',
    titulo: 'Casa em condomínio fechado na Granja Viana',
    tipo: 'Residencial',
    subtipo: 'Casa de Condomínio',
    finalidade: 'Venda',
    preco: 2950000,
    preco_condominio: 1600,
    preco_iptu: 380,
    bairro: 'Granja Viana',
    cidade: 'Cotia',
    estado: 'SP',
    area_total: 420,
    area_util: 320,
    area_terreno: 600,
    quartos: 4,
    suites: 3,
    banheiros: 5,
    vagas: 4,
    destaque: true,
    descricao:
      'Casa contemporânea com amplos jardins, piscina aquecida, espaço gourmet e home office. Condomínio com segurança 24h e quadras esportivas.',
    fotos: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&q=85',
      'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=1600&q=85',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1600&q=85',
    ],
    corretor: 'c-002',
  },
  {
    codigo: 'MJ-006',
    titulo: 'Sobrado espaçoso em Alphaville com quintal amplo',
    tipo: 'Residencial',
    subtipo: 'Casa',
    finalidade: 'Venda',
    preco: 1690000,
    preco_condominio: 950,
    preco_iptu: 290,
    bairro: 'Alphaville',
    cidade: 'Barueri',
    estado: 'SP',
    area_total: 260,
    area_util: 210,
    area_terreno: 360,
    quartos: 3,
    suites: 2,
    banheiros: 4,
    vagas: 3,
    destaque: true,
    descricao:
      'Sobrado com iluminação natural em todos os cômodos, churrasqueira, piscina e jardim planejado. Localização privilegiada em Alphaville.',
    fotos: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&q=85',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=85',
    ],
    corretor: 'c-003',
  },
  {
    codigo: 'MJ-007',
    titulo: 'Sala comercial pronta para uso em Vila Olímpia',
    tipo: 'Comercial',
    subtipo: 'Sala Comercial',
    finalidade: 'Locação',
    preco: 7200,
    preco_condominio: 1450,
    preco_iptu: 320,
    bairro: 'Vila Olímpia',
    cidade: 'São Paulo',
    estado: 'SP',
    area_total: 68,
    area_util: 60,
    quartos: 0,
    banheiros: 2,
    vagas: 2,
    destaque: true,
    descricao:
      'Sala corporativa em edifício comercial AAA, com infraestrutura completa, recepção 24h e vista da Ponte Estaiada. Pronta para mudança.',
    fotos: [
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1600&q=85',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1600&q=85',
    ],
    corretor: 'c-001',
  },
  {
    codigo: 'MJ-008',
    titulo: 'Galpão logístico em Barueri próximo à Castelo Branco',
    tipo: 'Comercial',
    subtipo: 'Galpão',
    finalidade: 'Locação',
    preco: 38000,
    preco_iptu: 1800,
    bairro: 'Centro Industrial',
    cidade: 'Barueri',
    estado: 'SP',
    area_total: 2200,
    area_util: 2000,
    area_terreno: 2800,
    quartos: 0,
    banheiros: 4,
    vagas: 20,
    destaque: false,
    descricao:
      'Galpão modular com pé-direito de 10m, doca nivelada, escritórios anexos e pátio de manobras. Acesso direto à rodovia Castelo Branco.',
    fotos: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=85',
    ],
    corretor: 'c-002',
  },
  {
    codigo: 'MJ-009',
    titulo: 'Studio compacto e elegante em Itaim Bibi',
    tipo: 'Residencial',
    subtipo: 'Apartamento',
    finalidade: 'Locação',
    preco: 3200,
    preco_condominio: 680,
    preco_iptu: 95,
    bairro: 'Itaim Bibi',
    cidade: 'São Paulo',
    estado: 'SP',
    area_total: 32,
    area_util: 30,
    quartos: 1,
    banheiros: 1,
    vagas: 1,
    destaque: false,
    descricao:
      'Studio moderno com mobília planejada, coworking e lavanderia coletiva. Perfeito para profissionais que valorizam localização e praticidade.',
    fotos: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=85',
    ],
    corretor: 'c-003',
  },
  {
    codigo: 'MJ-010',
    titulo: 'Terreno em condomínio de alto padrão em Campos do Jordão',
    tipo: 'Residencial',
    subtipo: 'Terreno',
    finalidade: 'Venda',
    preco: 690000,
    preco_iptu: 210,
    bairro: 'Capivari',
    cidade: 'Campos do Jordão',
    estado: 'SP',
    area_total: 1200,
    area_terreno: 1200,
    quartos: 0,
    banheiros: 0,
    destaque: false,
    descricao:
      'Terreno plano em condomínio fechado com infraestrutura completa, vista para a serra e acesso a trilhas. Pronto para construção.',
    fotos: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=85',
    ],
    corretor: 'c-001',
  },
  {
    codigo: 'MJ-011',
    titulo: 'Apartamento garden com jardim privativo no Tatuapé',
    tipo: 'Residencial',
    subtipo: 'Apartamento',
    finalidade: 'Venda',
    preco: 920000,
    preco_condominio: 980,
    preco_iptu: 210,
    bairro: 'Tatuapé',
    cidade: 'São Paulo',
    estado: 'SP',
    area_total: 115,
    area_util: 92,
    quartos: 3,
    suites: 1,
    banheiros: 2,
    vagas: 2,
    destaque: false,
    descricao:
      'Unidade térrea com jardim privativo de 40m², churrasqueira própria e 3 dormitórios. Lazer completo no condomínio.',
    fotos: [
      'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=1600&q=85',
    ],
    corretor: 'c-002',
  },
  {
    codigo: 'MJ-012',
    titulo: 'Loja de rua com alto fluxo na Rua Augusta',
    tipo: 'Comercial',
    subtipo: 'Comercial',
    finalidade: 'Locação',
    preco: 12500,
    preco_iptu: 480,
    bairro: 'Consolação',
    cidade: 'São Paulo',
    estado: 'SP',
    area_total: 180,
    area_util: 150,
    quartos: 0,
    banheiros: 3,
    vagas: 0,
    destaque: false,
    descricao:
      'Loja com duas vitrines para a Rua Augusta, mezanino, copa e depósito. Excelente para varejo, gastronomia ou showroom.',
    fotos: [
      'https://images.unsplash.com/photo-1582037928769-351935b7f29b?w=1600&q=85',
    ],
    corretor: 'c-003',
  },
]

// ── Helpers ────────────────────────────────────────────────────────
const publicUrl = (path) =>
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`

async function downloadAndResize(url, w, h) {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ao baixar ${url}`)
  const buf = Buffer.from(await resp.arrayBuffer())
  return sharp(buf)
    .resize(w, h, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toBuffer()
}

// URL de fallback quando uma foto do Unsplash retornar 404
const FALLBACK_PHOTO =
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=85'

async function downloadWithFallback(url, w, h) {
  try {
    return await downloadAndResize(url, w, h)
  } catch (err) {
    console.warn(`    ⚠ ${err.message} — usando fallback`)
    return downloadAndResize(FALLBACK_PHOTO, w, h)
  }
}

async function upload(supabase, path, buffer) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: 'image/webp',
    upsert: true,
    cacheControl: '31536000',
  })
  if (error) throw error
}

function buildCorretorMap() {
  const map = new Map()
  for (const c of CORRETORES) map.set(c.id, c)
  return map
}

// ── Main ───────────────────────────────────────────────────────────
async function run() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const pg = new Client(DB)
  await pg.connect()
  console.log('✓ Conectado ao banco\n')

  // Fotos dos corretores
  console.log('=== Corretores ===')
  const corretorFotos = new Map()
  for (const c of CORRETORES) {
    console.log(`→ ${c.nome}`)
    const buf = await downloadAndResize(c.foto, 400, 400)
    const path = `corretores/${c.id}.webp`
    await upload(supabase, path, buf)
    corretorFotos.set(c.id, publicUrl(path))
  }
  console.log()

  const corretores = buildCorretorMap()
  const farFuture = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString()

  console.log('=== Imóveis ===')
  for (const [idx, imovel] of IMOVEIS.entries()) {
    console.log(`→ [${idx + 1}/${IMOVEIS.length}] ${imovel.codigo} — ${imovel.titulo}`)

    // Baixa e envia fotos
    const fotosPublicas = []
    for (const [i, fotoUrl] of imovel.fotos.entries()) {
      const buf = await downloadWithFallback(fotoUrl, 1600, 1067)
      const path = `properties/${imovel.codigo.toLowerCase()}/foto-${i + 1}.webp`
      await upload(supabase, path, buf)
      fotosPublicas.push(publicUrl(path))
    }

    const corretor = corretores.get(imovel.corretor)
    const property = {
      id: `mock-${imovel.codigo}`,
      codigo: imovel.codigo,
      titulo: imovel.titulo,
      tipo: imovel.tipo,
      subtipo: imovel.subtipo,
      finalidade: imovel.finalidade,
      preco: imovel.preco,
      preco_condominio: imovel.preco_condominio,
      preco_iptu: imovel.preco_iptu,
      bairro: imovel.bairro,
      cidade: imovel.cidade,
      estado: imovel.estado,
      area_total: imovel.area_total,
      area_util: imovel.area_util,
      area_terreno: imovel.area_terreno,
      quartos: imovel.quartos,
      suites: imovel.suites,
      banheiros: imovel.banheiros,
      vagas: imovel.vagas,
      descricao: imovel.descricao,
      fotos: fotosPublicas,
      destaque: imovel.destaque,
      publicado_em: new Date(
        Date.now() - (idx + 1) * 24 * 60 * 60 * 1000,
      ).toISOString(),
      atualizado_em: new Date().toISOString(),
      corretor_id: corretor?.id,
      corretor_nome: corretor?.nome,
      corretor_foto: corretor ? corretorFotos.get(corretor.id) : undefined,
      corretor_creci: corretor?.creci,
      corretor_whatsapp: corretor?.whatsapp,
    }

    const externalId = `imovel_mock-${imovel.codigo}`
    await pg.query(
      `INSERT INTO properties_cache (external_id, type, data, cached_at, expires_at)
       VALUES ($1, 'imovel', $2::jsonb, now(), $3)
       ON CONFLICT (external_id) DO UPDATE
         SET data = EXCLUDED.data,
             cached_at = now(),
             expires_at = EXCLUDED.expires_at`,
      [externalId, JSON.stringify(property), farFuture],
    )
  }

  await pg.end()
  console.log(`\n✓ ${IMOVEIS.length} imóveis seedados em properties_cache.`)
  console.log(`  (${IMOVEIS.filter((i) => i.destaque).length} em destaque)`)
}

run().catch((err) => {
  console.error('\n✗ Fatal:', err.message)
  if (err.cause) console.error('   cause:', err.cause.message)
  process.exit(1)
})
