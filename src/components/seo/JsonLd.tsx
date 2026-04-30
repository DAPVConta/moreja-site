export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; url: string }>
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
  return <JsonLd data={schema} />
}

interface PropertyJsonLdInput {
  titulo: string
  descricao: string
  preco: number
  cidade: string
  estado: string
  endereco?: string
  bairro?: string
  cep?: string
  area_total: number
  area_util?: number
  quartos: number
  banheiros: number
  vagas?: number
  suites?: number
  fotos: string[]
  finalidade: string
  tipo?: string
  codigo?: string
  ano_construcao?: number | string
  data_publicacao?: string
  pet_friendly?: boolean
  latitude?: number | string
  longitude?: number | string
  iptu?: number
  condominio?: number
}

/**
 * RealEstateListing schema enriquecido.
 * Cobertura adicional vs versão anterior:
 *   • image[] (galeria completa, antes só primeira foto)
 *   • geo (GeoCoordinates de latitude/longitude quando disponíveis)
 *   • numberOfBedrooms, numberOfBathroomsTotal, numberOfRooms
 *   • yearBuilt, datePosted, petsAllowed
 *   • mainEntityOfPage, productID (código do imóvel)
 *   • additionalProperty (IPTU, condomínio, suítes, área útil)
 *   • PriceSpecification com unitCode 'MON' p/ aluguel
 *
 * Resultado: melhor elegibilidade para rich-results de imóveis no Google,
 * incluindo "preço a partir", carrossel de propriedades, e knowledge panel.
 */
export function PropertyJsonLd({
  property,
  url,
}: {
  property: PropertyJsonLdInput
  url: string
}) {
  const isRent = property.finalidade === 'Locação' || property.finalidade === 'aluguel'
  const lat = property.latitude != null ? Number(property.latitude) : null
  const lon = property.longitude != null ? Number(property.longitude) : null
  const hasGeo = lat != null && !isNaN(lat) && lon != null && !isNaN(lon)

  // additionalProperty para campos não cobertos pelo schema base
  const additionalProperty: Array<Record<string, unknown>> = []
  if (property.area_util) {
    additionalProperty.push({
      '@type': 'PropertyValue',
      name: 'Área útil',
      value: property.area_util,
      unitCode: 'MTK',
    })
  }
  if (property.suites) {
    additionalProperty.push({
      '@type': 'PropertyValue',
      name: 'Suítes',
      value: property.suites,
    })
  }
  if (property.vagas != null) {
    additionalProperty.push({
      '@type': 'PropertyValue',
      name: 'Vagas de garagem',
      value: property.vagas,
    })
  }
  if (property.iptu) {
    additionalProperty.push({
      '@type': 'PropertyValue',
      name: 'IPTU mensal',
      value: property.iptu,
      unitCode: 'BRL',
    })
  }
  if (property.condominio) {
    additionalProperty.push({
      '@type': 'PropertyValue',
      name: 'Condomínio mensal',
      value: property.condominio,
      unitCode: 'BRL',
    })
  }
  if (property.tipo) {
    additionalProperty.push({
      '@type': 'PropertyValue',
      name: 'Tipo de imóvel',
      value: property.tipo,
    })
  }

  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    price: property.preco,
    priceCurrency: 'BRL',
    availability:
      property.finalidade === 'Venda'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/LimitedAvailability',
    url,
  }

  if (isRent) {
    // Para aluguel, usa PriceSpecification com unidade mensal
    offer.priceSpecification = {
      '@type': 'UnitPriceSpecification',
      price: property.preco,
      priceCurrency: 'BRL',
      unitCode: 'MON',
      unitText: 'mês',
    }
  }

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.titulo,
    description: property.descricao,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: (property.fotos ?? []).slice(0, 10), // até 10 imagens (recomendação Google)
    offers: offer,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.endereco ?? '',
      addressLocality: property.cidade,
      addressRegion: property.estado,
      addressCountry: 'BR',
      ...(property.bairro ? { addressNeighborhood: property.bairro } : {}),
      ...(property.cep ? { postalCode: property.cep } : {}),
    },
    floorSize: {
      '@type': 'QuantitativeValue',
      value: property.area_total,
      unitCode: 'MTK',
    },
    numberOfRooms: property.quartos,
    numberOfBedrooms: property.quartos,
    numberOfBathroomsTotal: property.banheiros,
  }

  if (hasGeo) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: lat,
      longitude: lon,
    }
    schema.hasMap = `https://www.google.com/maps/?q=${lat},${lon}`
  }

  if (property.ano_construcao) {
    schema.yearBuilt = property.ano_construcao
  }
  if (property.data_publicacao) {
    schema.datePosted = property.data_publicacao
  }
  if (property.pet_friendly != null) {
    schema.petsAllowed = property.pet_friendly
  }
  if (property.codigo) {
    schema.productID = property.codigo
  }
  if (additionalProperty.length > 0) {
    schema.additionalProperty = additionalProperty
  }

  return <JsonLd data={schema} />
}

/**
 * FAQPage — útil em rotas tipo /sobre, /contato, /bairros/[slug] que tenham
 * perguntas frequentes. Aceita lista de pares Q/A.
 */
export function FaqJsonLd({
  faqs,
}: {
  faqs: Array<{ question: string; answer: string }>
}) {
  if (faqs.length === 0) return null
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
  return <JsonLd data={schema} />
}

/**
 * Person schema — corretores listados com CRECI, sameAs (redes sociais).
 * Usado em /sobre e idealmente em cada profile page de corretor.
 */
export function PersonJsonLd({
  broker,
  url,
}: {
  broker: {
    name: string
    creci?: string | null
    photo_url?: string | null
    email?: string | null
    phone?: string | null
    bio?: string | null
  }
  url?: string
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: broker.name,
    jobTitle: 'Corretor de imóveis',
  }
  if (url) schema.url = url
  if (broker.photo_url) schema.image = broker.photo_url
  if (broker.email) schema.email = broker.email
  if (broker.phone) schema.telephone = broker.phone
  if (broker.bio) schema.description = broker.bio
  if (broker.creci) {
    schema.identifier = { '@type': 'PropertyValue', name: 'CRECI', value: broker.creci }
  }
  return <JsonLd data={schema} />
}
