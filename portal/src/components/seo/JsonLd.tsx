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

export function PropertyJsonLd({
  property,
  url,
}: {
  property: {
    titulo: string
    descricao: string
    preco: number
    cidade: string
    estado: string
    endereco?: string
    area_total: number
    quartos: number
    banheiros: number
    fotos: string[]
    finalidade: string
  }
  url: string
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.titulo,
    description: property.descricao,
    url,
    image: property.fotos[0] ?? '',
    offers: {
      '@type': 'Offer',
      price: property.preco,
      priceCurrency: 'BRL',
      availability:
        property.finalidade === 'Venda'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/LimitedAvailability',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.endereco ?? '',
      addressLocality: property.cidade,
      addressRegion: property.estado,
      addressCountry: 'BR',
    },
    floorSize: {
      '@type': 'QuantitativeValue',
      value: property.area_total,
      unitCode: 'MTK',
    },
    numberOfRooms: property.quartos,
    numberOfBathroomsTotal: property.banheiros,
  }
  return <JsonLd data={schema} />
}
