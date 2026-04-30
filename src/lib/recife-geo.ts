/**
 * Geocoding offline para bairros do Recife metropolitano.
 *
 * Por que existe: o Supremo CRM não retorna latitude/longitude no payload
 * de empreendimentos (verificado nas migrations 026+ — campos sempre null).
 * Sem isso, pins de empreendimento nunca apareceriam no mapa.
 *
 * Solução: tabela estática mapeando "<bairro> | <cidade>" → [lat, lng]
 * (centro aproximado). É menos precisa que coords reais, mas suficiente
 * para o pin aparecer na vizinhança certa do mapa. Quando o CRM passar
 * a fornecer coords, elas são usadas em prioridade — esta tabela é só
 * fallback.
 */

type LatLng = [number, number]

function key(bairro: string | undefined, cidade: string | undefined): string {
  return `${(bairro ?? '').trim().toLowerCase()}|${(cidade ?? '').trim().toLowerCase()}`
}

// Centro aproximado de cada bairro. Coordenadas conferidas no Google Maps /
// OSM para os bairros mais comuns do portfólio. Adicionar entradas aqui
// quando a tabela ficar incompleta.
const BAIRRO_COORDS: Record<string, LatLng> = {
  // ── Recife ────────────────────────────────────────────────────
  'boa viagem|recife':       [-8.1175, -34.9003],
  'pina|recife':             [-8.0902, -34.8848],
  'imbiribeira|recife':      [-8.1158, -34.9251],
  'setúbal|recife':          [-8.1305, -34.9012],
  'setubal|recife':          [-8.1305, -34.9012],
  'ipsep|recife':            [-8.1207, -34.9234],
  'aflitos|recife':          [-8.0420, -34.8980],
  'espinheiro|recife':       [-8.0445, -34.8959],
  'graças|recife':           [-8.0405, -34.9024],
  'gracas|recife':           [-8.0405, -34.9024],
  'casa forte|recife':       [-8.0316, -34.9143],
  'parnamirim|recife':       [-8.0357, -34.9079],
  'rosarinho|recife':        [-8.0467, -34.8907],
  'madalena|recife':         [-8.0508, -34.9156],
  'torre|recife':            [-8.0468, -34.9081],
  'tamarineira|recife':      [-8.0241, -34.9070],
  'casa amarela|recife':     [-8.0258, -34.9181],
  'várzea|recife':           [-8.0402, -34.9484],
  'varzea|recife':           [-8.0402, -34.9484],
  'caxangá|recife':          [-8.0245, -34.9522],
  'caxanga|recife':          [-8.0245, -34.9522],
  'cordeiro|recife':         [-8.0469, -34.9223],
  'derby|recife':            [-8.0577, -34.8959],
  'ilha do leite|recife':    [-8.0610, -34.8893],
  'paissandu|recife':        [-8.0529, -34.8983],
  'soledade|recife':         [-8.0545, -34.8927],
  'são josé|recife':         [-8.0681, -34.8773],
  'sao jose|recife':         [-8.0681, -34.8773],
  'santo antônio|recife':    [-8.0635, -34.8755],
  'santo antonio|recife':    [-8.0635, -34.8755],
  'recife|recife':           [-8.0631, -34.8711],
  'boa vista|recife':        [-8.0593, -34.8862],
  'cabanga|recife':          [-8.0833, -34.8847],
  'iputinga|recife':         [-8.0359, -34.9362],
  'cidade universitária|recife': [-8.0500, -34.9500],
  'engenho do meio|recife':  [-8.0524, -34.9418],
  'zumbi|recife':            [-8.0541, -34.9354],
  'jaqueira|recife':         [-8.0388, -34.9032],
  'apipucos|recife':         [-8.0185, -34.9290],
  'monteiro|recife':         [-8.0189, -34.9195],
  'poço da panela|recife':   [-8.0240, -34.9220],
  'poco da panela|recife':   [-8.0240, -34.9220],
  'beberibe|recife':         [-7.9980, -34.8915],
  'arruda|recife':           [-8.0255, -34.8878],
  'campo grande|recife':     [-8.0124, -34.8988],
  'água fria|recife':        [-8.0094, -34.9095],
  'agua fria|recife':        [-8.0094, -34.9095],
  'fundão|recife':           [-7.9890, -34.8950],
  'fundao|recife':           [-7.9890, -34.8950],
  'morro da conceição|recife': [-8.0203, -34.9218],
  'macaxeira|recife':        [-8.0036, -34.9215],
  'brasilia teimosa|recife': [-8.0879, -34.8748],
  'brasília teimosa|recife': [-8.0879, -34.8748],

  // ── Olinda ────────────────────────────────────────────────────
  'casa caiada|olinda':      [-7.9817, -34.8366],
  'bairro novo|olinda':      [-7.9892, -34.8388],
  'rio doce|olinda':         [-7.9614, -34.8345],
  'jardim atlântico|olinda': [-7.9712, -34.8332],
  'jardim atlantico|olinda': [-7.9712, -34.8332],
  'carmo|olinda':            [-8.0094, -34.8403],
  'varadouro|olinda':        [-8.0107, -34.8462],
  'fragoso|olinda':          [-7.9520, -34.8498],
  'jardim brasil|olinda':    [-7.9930, -34.8506],
  'olinda|olinda':           [-7.9966, -34.8456],

  // ── Jaboatão dos Guararapes ───────────────────────────────────
  'piedade|jaboatão dos guararapes':   [-8.1762, -34.9125],
  'piedade|jaboatao dos guararapes':   [-8.1762, -34.9125],
  'candeias|jaboatão dos guararapes':  [-8.1908, -34.9197],
  'candeias|jaboatao dos guararapes':  [-8.1908, -34.9197],
  'barra de jangada|jaboatão dos guararapes': [-8.2138, -34.9319],
  'barra de jangada|jaboatao dos guararapes': [-8.2138, -34.9319],
  'prazeres|jaboatão dos guararapes':  [-8.1748, -34.9476],
  'prazeres|jaboatao dos guararapes':  [-8.1748, -34.9476],

  // ── Paulista ──────────────────────────────────────────────────
  'pau amarelo|paulista':    [-7.9398, -34.8388],
  'janga|paulista':          [-7.9462, -34.8421],
  'maranguape i|paulista':   [-7.9241, -34.8830],
  'maranguape ii|paulista':  [-7.9296, -34.8917],
  'engenho maranguape|paulista': [-7.9230, -34.8782],
  'paulista|paulista':       [-7.9407, -34.8730],

  // ── Camaragibe ────────────────────────────────────────────────
  'aldeia|camaragibe':       [-8.0040, -35.0090],
  'tabatinga|camaragibe':    [-8.0244, -34.9747],
  'camaragibe|camaragibe':   [-8.0227, -34.9810],
}

/**
 * Procura coordenadas aproximadas do bairro. Retorna `null` quando o
 * bairro não está mapeado — o caller decide se descarta o pin ou tenta
 * fallback adicional (ex: centro da cidade).
 */
export function lookupBairroCoords(
  bairro: string | undefined,
  cidade: string | undefined,
): LatLng | null {
  if (!bairro && !cidade) return null
  const direct = BAIRRO_COORDS[key(bairro, cidade)]
  if (direct) return direct
  // Fallback: tentar só pelo bairro (qualquer cidade) — ajuda quando o
  // CRM tem `cidade: 'Pernambuco'` (estado) em vez do município real.
  if (bairro) {
    const onlyBairro = (bairro ?? '').trim().toLowerCase()
    for (const [k, coord] of Object.entries(BAIRRO_COORDS)) {
      if (k.startsWith(`${onlyBairro}|`)) return coord
    }
  }
  return null
}

/**
 * Último recurso quando o CRM nem `bairro` preenche: extrai o primeiro
 * nome de bairro conhecido que aparece no texto livre (ex: título do
 * imóvel "Casa teste em Boa Viagem"). Bairros cujo nome casa com
 * substring de outro são checados primeiro pelo mais longo, senão "Casa
 * Forte" sempre perderia para "Casa Amarela" via prefixo "casa ".
 */
export function extractBairroFromText(text: string | undefined | null): LatLng | null {
  if (!text) return null
  const normalized = text.toLowerCase()
  // Conjunto único de bairros (parte antes do `|`).
  const bairros = new Set<string>()
  for (const k of Object.keys(BAIRRO_COORDS)) {
    bairros.add(k.split('|')[0])
  }
  // Ordena por tamanho desc para preferir match mais específico.
  const sorted = Array.from(bairros).sort((a, b) => b.length - a.length)
  for (const bairro of sorted) {
    // Boundary tosca: garante que estamos casando palavra inteira (não
    // pega "ipsep" dentro de outra palavra qualquer).
    const re = new RegExp(`(^|[^a-záéíóúâêôãõç])${escapeRegExp(bairro)}([^a-záéíóúâêôãõç]|$)`, 'i')
    if (re.test(normalized)) {
      const coords = lookupBairroCoords(bairro, undefined)
      if (coords) return coords
    }
  }
  return null
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Hash determinístico de uma string → número [0, 1). Usado para gerar
 * jitter consistente: o mesmo empreendimento sempre cai no mesmo offset
 * dentro do bairro, evitando pins empilhados sem ficar pulando entre
 * builds/rerenders.
 */
function hash01(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  // unsigned + normaliza
  return ((h >>> 0) % 100000) / 100000
}

/**
 * Adiciona um deslocamento determinístico (~150m) para que múltiplos
 * empreendimentos no mesmo bairro não caiam no mesmo ponto.
 */
export function jitterCoords(coords: [number, number], seed: string): [number, number] {
  const r1 = hash01(seed) - 0.5
  const r2 = hash01(seed + ':y') - 0.5
  // ~0.0015° lat ≈ 167m; lng ≈ 165m (próximo ao Equador)
  return [coords[0] + r1 * 0.0030, coords[1] + r2 * 0.0030]
}
