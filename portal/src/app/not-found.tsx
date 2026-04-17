import Link from 'next/link'
import { MapPin } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <MapPin size={80} className="text-[#ededd1]" />
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-[#010744]">
              404
            </span>
          </div>
        </div>
        <h1 className="text-3xl font-black text-[#010744] mb-3">Página não encontrada</h1>
        <p className="text-gray-500 mb-8">
          O imóvel ou página que você procurou não existe ou foi removido.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary">
            Voltar ao início
          </Link>
          <Link href="/comprar" className="btn-outline">
            Ver imóveis
          </Link>
        </div>
      </div>
    </div>
  )
}
