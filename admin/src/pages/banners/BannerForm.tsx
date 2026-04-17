import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Banner } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ImageUploadStorage } from '@/components/shared/ImageUploadStorage'

const schema = z.object({
  page: z.string().min(1, 'Obrigatório'),
  title: z.string().min(1, 'Obrigatório'),
  subtitle: z.string().optional(),
  cta_text: z.string().optional(),
  cta_link: z.string().optional(),
  image_url: z.string().min(1, 'Obrigatório'),
  mobile_image_url: z.string().optional(),
  position: z.coerce.number().int().min(0),
  active: z.boolean(),
})

type BannerFormValues = z.infer<typeof schema>

interface BannerFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  banner?: Banner | null
}

const pages = [
  { value: 'home', label: 'Página Inicial' },
  { value: 'imoveis', label: 'Imóveis' },
  { value: 'sobre', label: 'Sobre' },
  { value: 'contato', label: 'Contato' },
]

export function BannerForm({ open, onOpenChange, banner }: BannerFormProps) {
  const queryClient = useQueryClient()
  const isEditing = !!banner

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      page: 'home',
      title: '',
      subtitle: '',
      cta_text: '',
      cta_link: '',
      image_url: '',
      mobile_image_url: '',
      position: 0,
      active: true,
    },
  })

  useEffect(() => {
    if (banner) {
      form.reset({
        page: banner.page,
        title: banner.title,
        subtitle: banner.subtitle ?? '',
        cta_text: banner.cta_text ?? '',
        cta_link: banner.cta_link ?? '',
        image_url: banner.image_url,
        mobile_image_url: banner.mobile_image_url ?? '',
        position: banner.position,
        active: banner.active,
      })
    } else {
      form.reset({
        page: 'home',
        title: '',
        subtitle: '',
        cta_text: '',
        cta_link: '',
        image_url: '',
        mobile_image_url: '',
        position: 0,
        active: true,
      })
    }
  }, [banner, form, open])

  const mutation = useMutation({
    mutationFn: async (values: BannerFormValues) => {
      const payload = {
        page: values.page,
        title: values.title,
        subtitle: values.subtitle || null,
        cta_text: values.cta_text || null,
        cta_link: values.cta_link || null,
        image_url: values.image_url,
        mobile_image_url: values.mobile_image_url || null,
        position: values.position,
        active: values.active,
      }

      if (isEditing && banner) {
        const { error } = await supabase.from('banners').update(payload).eq('id', banner.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('banners').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] })
      toast.success(isEditing ? 'Banner atualizado!' : 'Banner criado!')
      onOpenChange(false)
    },
    onError: (err: Error) => {
      toast.error(`Erro: ${err.message}`)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Banner' : 'Novo Banner'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="page"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Página</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a página" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {pages.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título do banner" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtítulo</FormLabel>
                  <FormControl>
                    <Input placeholder="Subtítulo opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cta_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto do CTA</FormLabel>
                    <FormControl>
                      <Input placeholder="Saiba mais" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cta_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link do CTA</FormLabel>
                    <FormControl>
                      <Input placeholder="/imoveis" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUploadStorage
                      label="Imagem Desktop"
                      required
                      value={field.value}
                      onChange={field.onChange}
                      bucket="site"
                      folder="banners"
                      specs={{
                        width: 1440,
                        height: 600,
                        mode: 'cover',
                        label: '1440 × 600 px (desktop)',
                        hint: 'Imagem de fundo do banner. Ajuste o enquadramento abaixo após o upload.',
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mobile_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUploadStorage
                      label="Imagem Mobile"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      bucket="site"
                      folder="banners/mobile"
                      specs={{
                        width: 768,
                        height: 512,
                        mode: 'cover',
                        label: '768 × 512 px (mobile)',
                        hint: 'Versão para smartphones. Se não enviada, a imagem desktop será usada.',
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posição</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ativo</FormLabel>
                    <div className="flex items-center pt-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#010744] hover:bg-[#010744]/90 text-white"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
