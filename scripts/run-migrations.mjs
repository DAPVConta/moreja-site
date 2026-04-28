import { readFileSync, existsSync } from 'fs'
import { Client } from 'pg'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, '..', 'supabase', 'migrations')

// Carrega .env.local para pegar SUPABASE_DB_PASSWORD
const envPath = join(__dirname, '..', '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
}

const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD
if (!SUPABASE_DB_PASSWORD) {
  console.error('✗ SUPABASE_DB_PASSWORD não encontrada em .env.local')
  process.exit(1)
}

const MIGRATIONS = [
  '001_initial_schema.sql',
  '002_rls_policies.sql',
  '003_seed.sql',
  '004_tracking_config.sql',
  '005_storage_buckets.sql',
  '006_home_sections.sql',
  '007_branding_extensions.sql',
  '008_home_sections_remax.sql',
  '009_admin_users_and_security_hotfix.sql',
  '010_audit_log.sql',
  '011_branding_dark_mode.sql',
  '012_tracking_extras.sql',
  '013_seo_routes.sql',
  '014_navigation.sql',
  '015_footer_links.sql',
  '016_pages_revisions.sql',
  '017_ui_strings.sql',
  '018_leads_supremo_utm.sql',
  '019_engagement_features.sql',
  '020_rls_tightening_and_indexes.sql',
]

const client = new Client({
  host: process.env.SUPABASE_DB_HOST ?? 'db.yxlepgmlhcnqhwshymup.supabase.co',
  port: Number(process.env.SUPABASE_DB_PORT ?? 5432),
  database: process.env.SUPABASE_DB_NAME ?? 'postgres',
  user: process.env.SUPABASE_DB_USER ?? 'postgres',
  password: SUPABASE_DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
})

async function run() {
  await client.connect()
  console.log('✓ Connected to Supabase PostgreSQL')

  for (const file of MIGRATIONS) {
    const path = join(migrationsDir, file)
    const sql = readFileSync(path, 'utf-8')
    console.log(`\n→ Running ${file}...`)
    try {
      await client.query(sql)
      console.log(`  ✓ ${file} — OK`)
    } catch (err) {
      const msg = err.message || ''
      if (
        msg.includes('already exists') ||
        msg.includes('duplicate key') ||
        msg.includes('multiple primary keys') ||
        msg.includes('already enabled')
      ) {
        console.log(`  ℹ ${file} — já aplicado, pulando`)
      } else {
        console.error(`  ✗ ${file} — ERRO:`, msg.split('\n')[0])
      }
    }
  }

  await client.end()
  console.log('\n✓ Migrations concluídas.')
}

run().catch((err) => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
