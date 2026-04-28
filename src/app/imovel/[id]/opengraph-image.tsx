import { ImageResponse } from 'next/og'
import { fetchProperty, formatPrice } from '@/lib/properties'

export const alt = 'Imóvel — Morejá Imobiliária'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * OG image dinâmico por imóvel.
 *  • Foto do imóvel ocupa metade esquerda
 *  • Painel direito com brand (Ocean Cavern + accent yellow):
 *      - Eyebrow "Morejá Imobiliária"
 *      - Título do imóvel
 *      - Bairro/cidade
 *      - Preço destacado
 *
 * Performance: usa Edge Runtime + cache por imóvel (revalidate via Next).
 */
export default async function OpengraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const property = await fetchProperty(id).catch(() => null)

  if (!property) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #010744 0%, #1a1f6e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 64,
            fontWeight: 800,
          }}
        >
          Morejá Imobiliária
        </div>
      ),
      { ...size }
    )
  }

  const photo = property.fotos[0]
  const title = property.titulo.slice(0, 90)
  const location = `${property.bairro ?? ''}${property.bairro && property.cidade ? ', ' : ''}${property.cidade ?? ''}`.trim()
  const isRent = property.finalidade === 'Locação'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#010744',
        }}
      >
        {/* Lado esquerdo: foto */}
        <div
          style={{
            width: '50%',
            height: '100%',
            display: 'flex',
            position: 'relative',
            background: '#0a1a6e',
          }}
        >
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt=""
              width={600}
              height={630}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>

        {/* Lado direito: brand + title + price */}
        <div
          style={{
            width: '50%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '60px 56px',
            background: '#010744',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative blob */}
          <div
            style={{
              position: 'absolute',
              top: -120,
              right: -120,
              width: 320,
              height: 320,
              borderRadius: 9999,
              background: 'rgba(242, 210, 46, 0.15)',
              filter: 'blur(60px)',
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                color: '#f2d22e',
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: 4,
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              Morejá Imobiliária
            </div>
            <div
              style={{
                fontSize: 44,
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: -0.5,
                marginBottom: 18,
                display: 'flex',
                flexWrap: 'wrap',
              }}
            >
              {title}
            </div>
            {location && (
              <div style={{ fontSize: 22, color: '#cbd0e4', display: 'flex' }}>
                📍 {location}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              style={{
                fontSize: 16,
                color: '#9aa0c4',
                textTransform: 'uppercase',
                letterSpacing: 2,
                fontWeight: 600,
              }}
            >
              {isRent ? 'Aluguel a partir de' : 'À venda por'}
            </div>
            <div
              style={{
                fontSize: 56,
                fontWeight: 900,
                color: '#f2d22e',
                letterSpacing: -1,
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
              }}
            >
              {formatPrice(property.preco)}
              {isRent && (
                <span style={{ fontSize: 22, color: '#cbd0e4', fontWeight: 500 }}>/mês</span>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
