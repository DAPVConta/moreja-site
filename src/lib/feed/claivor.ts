import type { Property } from '@/types/property'

/**
 * Feed JSON do ClaivorCRM (https://claivorcrm.com.br).
 * Formato observado em /api/feeds/moreja/json:
 *
 * {
 *   imobiliaria: "MoreJá",
 *   contato: { nome, email, telefone },
 *   total: 18,
 *   gerado_em: "2026-07-02T01:52:57.268Z",
 *   imoveis: [{ codigo, titulo, tipo, operacao, ... }],
 *   empreendimentos?: [...]   // reservado — o feed pode passar a enviar
 * }
 */
export interface ClaivorFeedItem {
  codigo: string
  titulo: string | null
  tipo: string | null // apartamento | casa | comercial | ...
  operacao: string | null // venda | locacao | venda_locacao
  destaque: boolean | null
  preco_venda: number | null
  preco_locacao: number | null
  condominio: number | null
  iptu_anual: number | null
  area_util: number | null
  area_total: number | null
  quartos: number | null
  suites: number | null
  banheiros: number | null
  vagas: number | null
  bairro: string | null
  cidade: string | null
  uf: string | null
  endereco: string | null
  descricao: string | null
  foto_capa: string | null
  fotos: string[] | null
  link: string | null
}

export interface ClaivorFeed {
  imobiliaria?: string
  contato?: { nome?: string | null; email?: string | null; telefone?: string | null }
  total?: number
  gerado_em?: string
  imoveis?: ClaivorFeedItem[]
  empreendimentos?: ClaivorFeedItem[]
}

/** Mapeia o `tipo` do Claivor para o par tipo/subtipo usado pela interface Property. */
const TIPO_MAP: Record<string, { tipo: string; subtipo: string }> = {
  apartamento: { tipo: 'Residencial', subtipo: 'Apartamento' },
  casa: { tipo: 'Residencial', subtipo: 'Casa' },
  casa_condominio: { tipo: 'Residencial', subtipo: 'Casa de Condomínio' },
  cobertura: { tipo: 'Residencial', subtipo: 'Cobertura' },
  flat: { tipo: 'Residencial', subtipo: 'Flat' },
  kitnet: { tipo: 'Residencial', subtipo: 'Kitnet' },
  terreno: { tipo: 'Residencial', subtipo: 'Terreno' },
  comercial: { tipo: 'Comercial', subtipo: 'Comercial' },
  sala_comercial: { tipo: 'Comercial', subtipo: 'Sala Comercial' },
  loja: { tipo: 'Comercial', subtipo: 'Loja' },
  galpao: { tipo: 'Comercial', subtipo: 'Galpão' },
  rural: { tipo: 'Rural', subtipo: 'Rural' },
  sitio: { tipo: 'Rural', subtipo: 'Sítio' },
  fazenda: { tipo: 'Rural', subtipo: 'Fazenda' },
  chacara: { tipo: 'Rural', subtipo: 'Chácara' },
  empreendimento: { tipo: 'Empreendimento', subtipo: 'Empreendimento' },
}

function mapTipo(raw: string | null): { tipo: string; subtipo: string } {
  const key = (raw ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')
  if (TIPO_MAP[key]) return TIPO_MAP[key]
  // Desconhecido: preserva o valor original capitalizado como subtipo.
  const label = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Imóvel'
  return { tipo: 'Residencial', subtipo: label }
}

function mapFinalidade(item: ClaivorFeedItem): Property['finalidade'] {
  const op = (item.operacao ?? '').toLowerCase()
  const temVenda = typeof item.preco_venda === 'number' && item.preco_venda > 0
  const temLocacao = typeof item.preco_locacao === 'number' && item.preco_locacao > 0
  if ((op.includes('venda') && op.includes('loca')) || (temVenda && temLocacao)) {
    return 'Venda e Locação'
  }
  if (op.includes('loca') || op.includes('alug')) return 'Locação'
  if (op.includes('venda')) return 'Venda'
  return temLocacao && !temVenda ? 'Locação' : 'Venda'
}

/**
 * O feed manda descrição em texto puro com quebras de linha; as páginas de
 * detalhe renderizam `descricao` como HTML (sanitizado). Se não houver tags,
 * escapamos entidades e convertemos \n em <br /> para preservar os parágrafos.
 */
function toHtmlDescription(text: string | null): string {
  if (!text) return ''
  if (/<[a-z][\s\S]*>/i.test(text)) return text
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br />')
}

function normalizePhotos(item: ClaivorFeedItem): string[] {
  const all = [item.foto_capa, ...(item.fotos ?? [])]
  const seen = new Set<string>()
  const out: string[] = []
  for (const url of all) {
    if (typeof url !== 'string' || !/^https?:\/\//.test(url)) continue
    if (seen.has(url)) continue
    seen.add(url)
    out.push(url)
  }
  return out
}

export type ClaivorItemKind = 'imovel' | 'empreendimento'

export function detectKind(item: ClaivorFeedItem, source: ClaivorItemKind): ClaivorItemKind {
  const tipo = (item.tipo ?? '').toLowerCase()
  return tipo.includes('empreendimento') || tipo.includes('lancamento') || tipo.includes('lançamento')
    ? 'empreendimento'
    : source
}

/**
 * Normaliza um item do feed Claivor para a interface `Property` consumida
 * pelo front (mesmo contrato produzido pelo supremo-proxy e pelo seed).
 */
export function normalizeClaivorItem(
  item: ClaivorFeedItem,
  kind: ClaivorItemKind,
  geradoEm?: string,
): Property {
  const finalidade = mapFinalidade(item)
  const { tipo, subtipo } =
    kind === 'empreendimento'
      ? { tipo: 'Empreendimento', subtipo: mapTipo(item.tipo).subtipo }
      : mapTipo(item.tipo)

  const preco =
    finalidade === 'Locação'
      ? item.preco_locacao ?? item.preco_venda ?? 0
      : item.preco_venda ?? item.preco_locacao ?? 0

  return {
    id: item.codigo,
    codigo: item.codigo,
    titulo: item.titulo ?? item.codigo,
    tipo,
    subtipo,
    finalidade,
    preco: preco ?? 0,
    preco_condominio: item.condominio ?? undefined,
    preco_iptu: item.iptu_anual ?? undefined,
    bairro: item.bairro ?? '',
    cidade: item.cidade ?? '',
    estado: item.uf ?? '',
    endereco: item.endereco ?? undefined,
    area_total: item.area_total ?? item.area_util ?? 0,
    area_util: item.area_util ?? undefined,
    quartos: item.quartos ?? 0,
    suites: item.suites ?? undefined,
    banheiros: item.banheiros ?? 0,
    vagas: item.vagas ?? undefined,
    descricao: toHtmlDescription(item.descricao),
    fotos: normalizePhotos(item),
    destaque: item.destaque === true,
    publicado_em: geradoEm,
    atualizado_em: geradoEm,
  }
}
