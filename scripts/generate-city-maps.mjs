// Baixa GeoJSON do IBGE de cada cidade e gera SVG com o contorno
// Uso: node scripts/generate-city-maps.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '../public/maps')
mkdirSync(OUT_DIR, { recursive: true })

const CITIES = [
  { slug: 'sao-paulo',    code: 3550308 },
  { slug: 'guarulhos',    code: 3518800 },
  { slug: 'santo-andre',  code: 3547809 },
  { slug: 'sao-bernardo', code: 3548708 },
  { slug: 'osasco',       code: 3534401 },
  { slug: 'diadema',      code: 3513801 },
]

const IBGE = (code) =>
  `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${code}?formato=application/vnd.geo+json&qualidade=maxima`

// Flatten all rings from Polygon | MultiPolygon | GeometryCollection
function extractRings(geom) {
  if (!geom) return []
  if (geom.type === 'Polygon') return geom.coordinates
  if (geom.type === 'MultiPolygon') return geom.coordinates.flat()
  if (geom.type === 'GeometryCollection') return geom.geometries.flatMap(extractRings)
  return []
}

function ringsToPath(rings, bbox, size) {
  const [minX, minY, maxX, maxY] = bbox
  const w = maxX - minX
  const h = maxY - minY
  const scale = Math.min(size / w, size / h)
  const offX = (size - w * scale) / 2
  const offY = (size - h * scale) / 2

  // SVG y invertido (lat cresce pra cima, pixel y pra baixo)
  const tx = (x) => offX + (x - minX) * scale
  const ty = (y) => size - offY - (y - minY) * scale

  return rings
    .map((ring) => {
      const pts = ring.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${tx(x).toFixed(2)},${ty(y).toFixed(2)}`)
      return pts.join(' ') + ' Z'
    })
    .join(' ')
}

function computeBBox(rings) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const ring of rings) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  return [minX, minY, maxX, maxY]
}

async function run() {
  for (const city of CITIES) {
    process.stdout.write(`→ ${city.slug}... `)
    const res = await fetch(IBGE(city.code))
    if (!res.ok) {
      console.error(`HTTP ${res.status}`)
      continue
    }
    const gj = await res.json()
    const features = gj.features ?? [{ geometry: gj.geometry ?? gj }]
    const rings = features.flatMap((f) => extractRings(f.geometry ?? f))
    if (rings.length === 0) {
      console.error('sem geometria')
      continue
    }
    const bbox = computeBBox(rings)
    const size = 400
    const d = ringsToPath(rings, bbox, size)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none">
  <path d="${d}" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="currentColor" fill-opacity="0.15"/>
</svg>
`
    writeFileSync(resolve(OUT_DIR, `${city.slug}.svg`), svg, 'utf8')
    console.log(`ok (${(svg.length / 1024).toFixed(1)}kB)`)
  }
}

run().catch((e) => { console.error(e); process.exit(1) })
