import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Clock } from 'lucide-react'
import type { BlogPost } from '@/lib/site-config'

interface BlogPreviewProps {
  posts: BlogPost[]
  title?: string
  subtitle?: string
  ctaLabel?: string
  ctaHref?: string
}

/**
 * RE/MAX-inspired: 3 artigos editoriais mais recentes na home.
 * Lazy-load justificado (abaixo da dobra) — usa next/image priority=false.
 *
 * Se posts[] estiver vazio, renderiza null (nada na home).
 */
export function BlogPreview({
  posts,
  title = 'Mercado imobiliário em pauta',
  subtitle = 'Análises, dicas e tendências para quem quer comprar, vender ou alugar bem.',
  ctaLabel = 'Ver todos os artigos',
  ctaHref = '/blog',
}: BlogPreviewProps) {
  if (posts.length === 0) return null

  return (
    <section className="section bg-white">
      <div className="container-page">
        <div className="mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-[#f2d22e] mb-3">
              Blog Morejá
            </span>
            <h2 className="heading-h2 text-[#010744] mb-2">{title}</h2>
            <p className="lead">{subtitle}</p>
          </div>
          <Link
            href={ctaHref}
            className="hidden sm:inline-flex items-center gap-2 text-[#010744] font-semibold hover:text-[#f2d22e] transition-colors group shrink-0"
          >
            {ctaLabel}
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 text-[#010744] font-semibold hover:text-[#f2d22e]"
          >
            {ctaLabel}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function PostCard({ post }: { post: BlogPost }) {
  const date = post.published_at
    ? new Date(post.published_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block overflow-hidden rounded-2xl bg-[#ededd1]/30
                 transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[#010744]">
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-7xl font-extrabold text-[#f2d22e]/30">
            M
          </div>
        )}
        {post.category && (
          <span className="absolute top-3 left-3 rounded-full bg-[#f2d22e] px-2.5 py-0.5
                           text-[11px] font-bold uppercase tracking-wider text-[#010744]">
            {post.category}
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold leading-tight text-[#010744] line-clamp-2 mb-2 group-hover:text-[#f2d22e] transition-colors">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {date && <time>{date}</time>}
          {date && post.read_minutes && <span aria-hidden="true">·</span>}
          {post.read_minutes && (
            <span className="flex items-center gap-1">
              <Clock size={12} aria-hidden="true" />
              {post.read_minutes} min
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
