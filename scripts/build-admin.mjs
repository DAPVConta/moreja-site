#!/usr/bin/env node
// Builda o admin (Vite) e copia o dist para public/admin/ do portal.
// Rodado automaticamente pelo `npm run build` antes de `next build`.

import { spawnSync } from 'node:child_process'
import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const adminDir = path.join(root, 'admin')
const distDir = path.join(adminDir, 'dist')
const publicAdmin = path.join(root, 'public', 'admin')

function run(cmd, args, cwd) {
  console.log(`\n→ ${cmd} ${args.join(' ')}  (cwd: ${path.relative(root, cwd) || '.'})`)
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) {
    console.error(`✗ "${cmd} ${args.join(' ')}" falhou com status ${result.status}`)
    process.exit(result.status ?? 1)
  }
}

console.log('▶ Build do admin CMS iniciado')

// 1. Instala deps do admin (node_modules separado)
run('npm', ['install', '--no-audit', '--no-fund'], adminDir)

// 2. Builda o admin (gera admin/dist/)
run('npm', ['run', 'build'], adminDir)

// 3. Copia dist → public/admin (sobrescreve)
if (!existsSync(distDir)) {
  console.error(`✗ ${distDir} não foi gerado pelo build`)
  process.exit(1)
}
if (existsSync(publicAdmin)) {
  rmSync(publicAdmin, { recursive: true, force: true })
}
mkdirSync(publicAdmin, { recursive: true })
cpSync(distDir, publicAdmin, { recursive: true })

console.log(`\n✓ Admin buildado e copiado para public/admin/`)
