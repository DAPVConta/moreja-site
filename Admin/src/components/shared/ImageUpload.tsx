import { useState } from 'react'
import { ImageIcon, ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
  placeholder?: string
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  label = 'URL da Imagem',
  placeholder = 'https://...',
  className,
}: ImageUploadProps) {
  const [preview, setPreview] = useState(value)

  const handleChange = (url: string) => {
    onChange(url)
    setPreview(url)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}
      <Input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
      />
      {preview && (
        <div className="relative mt-2 rounded-md overflow-hidden border bg-muted h-32 flex items-center justify-center">
          <img
            src={preview}
            alt="Preview"
            className="h-full w-full object-cover"
            onError={() => setPreview('')}
          />
          <a
            href={preview}
            target="_blank"
            rel="noreferrer"
            className="absolute top-2 right-2 bg-black/50 text-white rounded p-1 hover:bg-black/70 transition"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
      {!preview && (
        <div className="rounded-md border bg-muted h-32 flex items-center justify-center">
          <div className="text-muted-foreground flex flex-col items-center gap-1">
            <ImageIcon className="w-8 h-8 opacity-40" />
            <span className="text-xs">Nenhuma imagem</span>
          </div>
        </div>
      )}
    </div>
  )
}
