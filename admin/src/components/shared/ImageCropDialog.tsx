import { useCallback, useEffect, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { RotateCcw, Check, X, ZoomIn, ZoomOut } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface ImageCropDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  /** Target output width in pixels */
  targetWidth: number
  /** Target output height in pixels */
  targetHeight: number
  /** Output quality 0..1 (default 0.88) */
  quality?: number
  /** Called with the cropped+resized WebP blob */
  onApply: (blob: Blob) => void
}

async function createCroppedWebp(
  imageSrc: string,
  pixelCrop: Area,
  outW: number,
  outH: number,
  quality: number,
): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.crossOrigin = 'anonymous'
    el.onload = () => resolve(el)
    el.onerror = reject
    el.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Preenche o fundo com branco — cobre casos de zoom < 1 onde o crop é maior que a imagem.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, outW, outH)

  // Intersecção entre o retângulo de crop (pode estar fora da imagem) e a imagem real.
  const sxRaw = pixelCrop.x
  const syRaw = pixelCrop.y
  const scale = outW / pixelCrop.width // px de saída por px de origem

  const sx = Math.max(0, sxRaw)
  const sy = Math.max(0, syRaw)
  const sRight = Math.min(img.naturalWidth, sxRaw + pixelCrop.width)
  const sBottom = Math.min(img.naturalHeight, syRaw + pixelCrop.height)
  const sw = sRight - sx
  const sh = sBottom - sy

  if (sw > 0 && sh > 0) {
    const dx = (sx - sxRaw) * scale
    const dy = (sy - syRaw) * scale
    const dw = sw * scale
    const dh = sh * scale
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Encode failed')),
      'image/webp',
      quality,
    )
  })
}

export function ImageCropDialog({
  open, onOpenChange, imageSrc, targetWidth, targetHeight,
  quality = 0.88, onApply,
}: ImageCropDialogProps) {
  const aspect = targetWidth / targetHeight

  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedArea(null)
    }
  }, [open, imageSrc])

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels)
  }, [])

  const handleApply = async () => {
    if (!croppedArea) return
    setBusy(true)
    try {
      const blob = await createCroppedWebp(
        imageSrc, croppedArea, targetWidth, targetHeight, quality,
      )
      onApply(blob)
      onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ajustar recorte e enquadramento</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Arraste para reposicionar · role o mouse (ou pinch) para zoom · saída: {targetWidth} × {targetHeight} px
          </div>

          <div className="relative w-full h-[55vh] bg-gray-900 rounded-lg overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                showGrid
                objectFit="contain"
                minZoom={0.2}
                maxZoom={5}
                zoomSpeed={0.3}
                restrictPosition={false}
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="range"
              min={0.2}
              max={5}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-[#010744]"
              aria-label="Zoom"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
            <Label className="text-xs font-mono text-muted-foreground w-12 text-right">
              {zoom.toFixed(2)}x
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1) }}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Resetar
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            <X className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-[#010744] hover:bg-[#010744]/90 text-white"
            onClick={handleApply}
            disabled={busy || !croppedArea}
          >
            <Check className="w-4 h-4 mr-1" />
            {busy ? 'Processando...' : 'Aplicar recorte'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
