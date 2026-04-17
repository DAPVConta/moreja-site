export interface Property {
  id: string
  codigo: string
  titulo: string
  tipo: string // Residencial, Comercial, Rural
  subtipo?: string // Apartamento, Casa, Terreno, etc.
  finalidade: 'Venda' | 'Locação' | 'Venda e Locação'
  preco: number
  preco_condominio?: number
  preco_iptu?: number
  bairro: string
  cidade: string
  estado: string
  cep?: string
  endereco?: string
  numero?: string
  complemento?: string
  area_total: number
  area_util?: number
  area_terreno?: number
  quartos: number
  suites?: number
  banheiros: number
  vagas?: number
  descricao: string
  fotos: string[]
  video_url?: string
  tour_virtual?: string
  latitude?: number
  longitude?: number
  destaque?: boolean
  publicado_em?: string
  atualizado_em?: string
  corretor_id?: string
  corretor_nome?: string
  corretor_foto?: string
  corretor_creci?: string
  corretor_whatsapp?: string
}

export interface PropertyFilters {
  finalidade?: 'Venda' | 'Locação'
  tipo?: string
  subtipo?: string
  bairro?: string
  cidade?: string
  estado?: string
  preco_min?: number
  preco_max?: number
  area_min?: number
  area_max?: number
  quartos?: number
  q?: string
  destaque?: boolean
  order?: 'preco_asc' | 'preco_desc' | 'data_desc' | 'relevancia'
  page?: number
  limit?: number
}

export interface PropertyListResponse {
  data: Property[]
  total: number
  page: number
  limit: number
  pages: number
}

export const PROPERTY_TYPES = [
  'Apartamento',
  'Casa',
  'Casa de Condomínio',
  'Terreno',
  'Comercial',
  'Galpão',
  'Sala Comercial',
  'Rural',
  'Sítio',
  'Fazenda',
] as const

export const PRICE_RANGES_VENDA = [
  { label: 'Até R$ 200 mil', min: 0, max: 200000 },
  { label: 'R$ 200 mil - R$ 400 mil', min: 200000, max: 400000 },
  { label: 'R$ 400 mil - R$ 700 mil', min: 400000, max: 700000 },
  { label: 'R$ 700 mil - R$ 1 milhão', min: 700000, max: 1000000 },
  { label: 'R$ 1 milhão - R$ 2 milhões', min: 1000000, max: 2000000 },
  { label: 'Acima de R$ 2 milhões', min: 2000000, max: 0 },
] as const

export const PRICE_RANGES_LOCACAO = [
  { label: 'Até R$ 1.500/mês', min: 0, max: 1500 },
  { label: 'R$ 1.500 - R$ 3.000/mês', min: 1500, max: 3000 },
  { label: 'R$ 3.000 - R$ 5.000/mês', min: 3000, max: 5000 },
  { label: 'R$ 5.000 - R$ 10.000/mês', min: 5000, max: 10000 },
  { label: 'Acima de R$ 10.000/mês', min: 10000, max: 0 },
] as const
