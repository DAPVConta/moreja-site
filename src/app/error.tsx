'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Portal error:', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h2 className="text-3xl font-black text-[#010744] mb-3">Algo deu errado</h2>
        <p className="text-gray-500 mb-8">
          Ocorreu um erro inesperado. Tente novamente ou volte ao início.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="btn-primary">
            Tentar novamente
          </button>
          <Link href="/" className="btn-outline">
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
}
