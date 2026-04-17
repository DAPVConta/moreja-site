import { useRef, useCallback, useState, useEffect } from 'react'
import { Target, Maximize2 } from 'lucide-react'

interface FocalPointPickerProps {
  src: string
  /** Focal X (0–100, % from left) */
  x: number
  /** Focal Y (0–100, % from top) */
  y: number
  onChange: (x: number, y: number) => void
  /** Aspect ratio of the target crop area (width / height). Default 16/9 */
  aspect?: number
  label?: string
}

export function FocalPointPicker({
  src,
  x,
  y,
  onChange,
  aspect = 16 / 9,
  label = 'Posicione o ponto focal',
}: FocalPointPickerProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const fullRef = useRef<HTMLDivElement>(null)
  const [dragTarget, setDragTarget] = useState<'preview' | 'full' | null>(null)
  const [naturalRatio, setNaturalRatio] = useState<number | null>(null)

  // Measure the natural aspect ratio of the image so the "full image" pane
  // can show it without letterboxing.
  useEffect(() => {
    if (!src) return
    const img = new Image()
    img.onload = () => setNaturalRatio(img.naturalWidth / img.naturalHeight)
    img.src = src
  }, [src])

  const applyFromEvent = useCallback(
    (el: HTMLElement, clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect()
      const nx = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
      const ny = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100))
      onChange(Math.round(nx * 10) / 10, Math.round(ny * 10) / 10)
    },
    [onChange],
  )

  const handlePointerDown = (which: 'preview' | 'full') => (e: React.PointerEvent) => {
    e.preventDefault()
    const el = which === 'preview' ? previewRef.current : fullRef.current
    if (!el) return
    el.setPointerCapture(e.pointerId)
    setDragTarget(which)
    applyFromEvent(el, e.clientX, e.clientY)
  }

  const handlePointerMove = (which: 'preview' | 'full') => (e: React.PointerEvent) => {
    if (dragTarget !== which) return
    const el = which === 'preview' ? previewRef.current : fullRef.current
    if (!el) return
    applyFromEvent(el, e.clientX, e.clientY)
  }

  const handlePointerUp = (which: 'preview' | 'full') => (e: React.PointerEvent) => {
    if (dragTarget !== which) return
    const el = which === 'preview' ? previewRef.current : fullRef.current
    el?.releasePointerCapture(e.pointerId)
    setDragTarget(null)
  }

  if (!src) {
    return (
      <div className="text-xs text-muted-foreground bg-muted/30 border border-dashed rounded-lg p-4 text-center">
        Envie uma imagem acima para habilitar o reposicionamento.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#010744] flex items-center gap-1.5">
          <Target className="w-4 h-4" />
          {label}
        </p>
        <button
          type="button"
          onClick={() => onChange(50, 50)}
          className="text-xs text-muted-foreground hover:text-[#010744] underline underline-offset-2"
        >
          Centralizar
        </button>
      </div>

      {/* Pane 1 — cropped preview (what the site will show) */}
      <div>
        <p className="text-[11px] text-muted-foreground mb-1.5 flex items-center gap-1">
          <Maximize2 className="w-3 h-3" />
          Resultado final no site (proporção {aspect === 16 / 9 ? '16:9' : aspect.toFixed(2)})
        </p>
        <div
          ref={previewRef}
          className="relative w-full rounded-lg overflow-hidden bg-gray-900 cursor-crosshair select-none touch-none border border-gray-200 shadow-inner"
          style={{ aspectRatio: String(aspect) }}
          onPointerDown={handlePointerDown('preview')}
          onPointerMove={handlePointerMove('preview')}
          onPointerUp={handlePointerUp('preview')}
          onPointerCancel={handlePointerUp('preview')}
        >
          <div
            className="absolute inset-0 bg-cover bg-no-repeat transition-[background-position] duration-75"
            style={{
              backgroundImage: `url('${src}')`,
              backgroundPosition: `${x}% ${y}%`,
            }}
            aria-hidden="true"
          />
          {/* Rule of thirds overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute inset-y-0 left-1/3 w-px bg-white" />
            <div className="absolute inset-y-0 left-2/3 w-px bg-white" />
            <div className="absolute inset-x-0 top-1/3 h-px bg-white" />
            <div className="absolute inset-x-0 top-2/3 h-px bg-white" />
          </div>
          {/* Crosshair marker */}
          <FocalMarker x={x} y={y} />
        </div>
      </div>

      {/* Pane 2 — full image (shows what's being cut) */}
      <div>
        <p className="text-[11px] text-muted-foreground mb-1.5">
          Imagem completa (clique para escolher o ponto de destaque)
        </p>
        <div
          ref={fullRef}
          className="relative w-full rounded-lg overflow-hidden bg-gray-50 cursor-crosshair select-none touch-none border border-gray-200"
          style={{ aspectRatio: naturalRatio ? String(naturalRatio) : '16/9' }}
          onPointerDown={handlePointerDown('full')}
          onPointerMove={handlePointerMove('full')}
          onPointerUp={handlePointerUp('full')}
          onPointerCancel={handlePointerUp('full')}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
          <FocalMarker x={x} y={y} />
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
        <span>
          <strong className="text-[#010744]">X:</strong> {x.toFixed(1)}%
        </span>
        <span>
          <strong className="text-[#010744]">Y:</strong> {y.toFixed(1)}%
        </span>
        <span className="ml-auto text-[10px] opacity-80">
          Clique e arraste em qualquer um dos painéis para reposicionar
        </span>
      </div>
    </div>
  )
}

function FocalMarker({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="absolute pointer-events-none transition-[left,top] duration-75"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
      aria-hidden="true"
    >
      {/* Outer pulse */}
      <div className="absolute inset-0 w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f2d22e]/25 animate-ping" />
      {/* Ring */}
      <div className="relative w-8 h-8 rounded-full border-[3px] border-[#f2d22e] bg-[#010744]/40 shadow-xl flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-[#f2d22e]" />
      </div>
    </div>
  )
}
