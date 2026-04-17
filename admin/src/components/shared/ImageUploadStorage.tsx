import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Upload, X, ExternalLink, ImageIcon, AlertCircle, CheckCircle2,
  Loader2, Link2, HardDriveUpload,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageCropDialog } from './ImageCropDialog'

// ── Types ──────────────────────────────────────────────────────────────────

export type StorageBucket = 'site' | 'admin'

export interface ImageSpecs {
  width: number
  height: number
  /** 'fit' = preserves ratio; 'cover' = crops to exact size; 'exact' = forces size */
  mode?: 'fit' | 'cover' | 'exact'
  quality?: number
  label?: string
  hint?: string
}

export interface ImageUploadStorageProps {
  value: string
  onChange: (url: string) => void
  bucket: StorageBucket
  folder: string
  specs: ImageSpecs
  label?: string
  className?: string
  required?: boolean
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getPublicUrl(bucket: StorageBucket, path: string): string {
  const url = import.meta.env.VITE_SUPABASE_URL as string
  return `${url}/storage/v1/object/public/${bucket}/${path}`
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Component ──────────────────────────────────────────────────────────────

type InputMode = 'upload' | 'url'

export function ImageUploadStorage({
  value, onChange, bucket, folder, specs, label, className, required,
}: ImageUploadStorageProps) {
  const [mode, setMode] = useState<InputMode>('upload')
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [originalSize, setOriginalSize] = useState<string | null>(null)
  const [resizedSize, setResizedSize] = useState<string | null>(null)
  const [cropOpen, setCropOpen] = useState(false)
  const [cropSrc, setCropSrc] = useState<string>('')
  const [cropFileName, setCropFileName] = useState<string>('')
  const [cropOriginalBytes, setCropOriginalBytes] = useState<number>(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => { if (cropSrc) URL.revokeObjectURL(cropSrc) }
  }, [cropSrc])

  const specsLabel = specs.label || `${specs.width} × ${specs.height} px`
  const modeLabel = specs.mode === 'cover' ? 'recorte e zoom manual'
    : specs.mode === 'exact' ? 'exato' : 'proporcional'

  const uploadBlob = useCallback(async (blob: Blob, originalName: string, originalBytes: number) => {
    setError(null)
    setUploading(true)
    setOriginalSize(formatBytes(originalBytes))
    try {
      setResizedSize(formatBytes(blob.size))
      const timestamp = Date.now()
      const safe = originalName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)
      const path = `${folder}/${safe}_${timestamp}.webp`
      const { error: err } = await supabase.storage.from(bucket).upload(path, blob, {
        contentType: 'image/webp',
        upsert: false,
      })
      if (err) throw err
      onChange(getPublicUrl(bucket, path))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar imagem')
    } finally {
      setUploading(false)
    }
  }, [bucket, folder, onChange])

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Somente imagens são aceitas (JPG, PNG, WebP, GIF, SVG)')
      return
    }
    setError(null)
    // Abre o diálogo de recorte com a imagem local (crop + resize controlado pelo usuário).
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    const objectUrl = URL.createObjectURL(file)
    setCropSrc(objectUrl)
    setCropFileName(file.name)
    setOriginalSize(formatBytes(file.size))
    setCropOriginalBytes(file.size)
    setCropOpen(true)
  }, [cropSrc])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) { setMode('upload'); processFile(file) }
  }

  const handleRemove = async () => {
    if (value.includes('/storage/v1/object/public/')) {
      const m = value.match(/\/storage\/v1\/object\/public\/(?:site|admin)\/(.+)/)
      if (m?.[1]) await supabase.storage.from(bucket).remove([m[1]])
    }
    onChange('')
    setOriginalSize(null)
    setResizedSize(null)
    setUrlInput('')
  }

  const applyUrl = () => {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    if (!trimmed.startsWith('http')) { setError('URL inválida — deve começar com http'); return }
    setError(null)
    onChange(trimmed)
    setUrlInput('')
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label + mode toggle */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Label>
          {label}{required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {/* Toggle between upload and URL */}
        <div className="flex border border-border rounded-lg overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={cn(
              'px-2.5 py-1 flex items-center gap-1 transition-colors',
              mode === 'upload' ? 'bg-[#010744] text-white' : 'bg-background text-muted-foreground hover:bg-muted'
            )}
          >
            <HardDriveUpload className="w-3 h-3" />
            Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={cn(
              'px-2.5 py-1 flex items-center gap-1 transition-colors',
              mode === 'url' ? 'bg-[#010744] text-white' : 'bg-background text-muted-foreground hover:bg-muted'
            )}
          >
            <Link2 className="w-3 h-3" />
            URL
          </button>
        </div>
      </div>

      {/* Specs badge */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 px-2 py-0.5 rounded-full font-medium">
          <ImageIcon className="w-3 h-3" />
          {specsLabel}
        </span>
        <span className="text-muted-foreground">
          {mode === 'upload' ? `Modo resize: ${modeLabel} · Saída: WebP` : 'URL externa'}
          {' · '}
          <code className="font-mono bg-muted px-1 rounded text-[10px]">{bucket}/{folder}</code>
        </span>
      </div>

      {specs.hint && (
        <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md border">
          {specs.hint}
        </p>
      )}

      {/* URL input mode */}
      {mode === 'url' && (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyUrl())}
            placeholder="https://exemplo.com/imagem.jpg"
            className="flex-1 text-sm"
          />
          <Button type="button" size="sm" onClick={applyUrl} className="shrink-0">
            Aplicar
          </Button>
        </div>
      )}

      {/* Drop zone / upload mode */}
      {mode === 'upload' && (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-xl transition-all overflow-hidden',
            dragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border',
            uploading && 'opacity-60 pointer-events-none',
            value ? 'border-solid border-border' : ''
          )}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {value ? (
            <div className="relative group">
              <img
                src={value}
                alt="Preview"
                className="w-full block"
                style={{ aspectRatio: `${specs.width} / ${specs.height}`, objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).src = '' }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                <Button type="button" size="sm" variant="secondary" onClick={() => inputRef.current?.click()} className="h-8">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Trocar
                </Button>
                <Button type="button" size="sm" variant="destructive" onClick={handleRemove} className="h-8">
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  Remover
                </Button>
                <a href={value} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-white/90 text-gray-800 text-xs px-2.5 py-1.5 rounded-md font-medium hover:bg-white transition-colors">
                  <ExternalLink className="w-3 h-3" />
                  Ver
                </a>
              </div>
              {(originalSize || resizedSize) && (
                <div className="absolute bottom-2 left-2 flex gap-2">
                  {originalSize && <span className="text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">Original: {originalSize}</span>}
                  {resizedSize && <span className="text-[10px] bg-green-600/90 text-white px-1.5 py-0.5 rounded">Enviado: {resizedSize}</span>}
                </div>
              )}
            </div>
          ) : (
            <button type="button" onClick={() => inputRef.current?.click()}
              className="w-full h-36 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
              {uploading ? (
                <>
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-sm font-medium text-primary">Processando e enviando...</span>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 opacity-40" />
                  <span className="text-sm font-medium">Clique ou arraste uma imagem</span>
                  <span className="text-xs opacity-70">JPG, PNG, WebP, GIF · Máx. 5 MB</span>
                  <span className="text-xs font-semibold text-primary opacity-80">
                    Redimensionada para {specs.width} × {specs.height} px
                  </span>
                </>
              )}
            </button>
          )}
          {uploading && value && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-sm font-medium">Redimensionando e enviando...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview when in URL mode and value is set */}
      {mode === 'url' && value && (
        <div className="relative group rounded-xl overflow-hidden border">
          <img
            src={value}
            alt="Preview"
            className="w-full block"
            style={{ aspectRatio: `${specs.width} / ${specs.height}`, objectFit: 'cover' }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <Button type="button" size="sm" variant="destructive" onClick={handleRemove} className="h-8">
              <X className="w-3.5 h-3.5 mr-1.5" />
              Remover
            </Button>
            <a href={value} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-white/90 text-gray-800 text-xs px-2.5 py-1.5 rounded-md font-medium hover:bg-white">
              <ExternalLink className="w-3 h-3" />
              Ver original
            </a>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {value && !uploading && !error && (
        <div className="flex items-center gap-2 text-emerald-600 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="font-mono text-[10px] truncate opacity-70 max-w-xs">{value}</span>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
        const f = e.target.files?.[0]
        if (f) processFile(f)
        e.target.value = ''
      }} />

      <ImageCropDialog
        open={cropOpen}
        onOpenChange={setCropOpen}
        imageSrc={cropSrc}
        targetWidth={specs.width}
        targetHeight={specs.height}
        quality={specs.quality ?? 0.88}
        onApply={async (blob) => {
          await uploadBlob(blob, cropFileName || 'image', cropOriginalBytes)
        }}
      />
    </div>
  )
}
