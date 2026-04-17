import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Page } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'

const schema = z.object({
  title: z.string().min(1, 'Obrigatório'),
  slug: z.string().min(1, 'Obrigatório').regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
  content_text: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  og_image: z.string().url('URL inválida').or(z.literal('')),
  og_description: z.string().optional(),
  canonical_url: z.string().url('URL inválida').or(z.literal('')),
  published: z.boolean(),
})

type PageFormValues = z.infer<typeof schema>

export default function PageEditorPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'nova'
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: page, isLoading } = useQuery({
    queryKey: ['page', id],
    queryFn: async () => {
      if (isNew) return null
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Page
    },
    enabled: !isNew,
  })

  const form = useForm<PageFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      slug: '',
      content_text: '',
      meta_title: '',
      meta_description: '',
      og_image: '',
      og_description: '',
      canonical_url: '',
      published: false,
    },
  })

  useEffect(() => {
    if (page) {
      const content = page.content as { text?: string } | null
      form.reset({
        title: page.title,
        slug: page.slug,
        content_text: content?.text ?? '',
        meta_title: page.meta_title ?? '',
        meta_description: page.meta_description ?? '',
        og_image: page.og_image ?? '',
        og_description: page.og_description ?? '',
        canonical_url: page.canonical_url ?? '',
        published: page.published,
      })
    }
  }, [page, form])

  const mutation = useMutation({
    mutationFn: async (values: PageFormValues) => {
      const payload = {
        title: values.title,
        slug: values.slug,
        content: { text: values.content_text ?? '' },
        meta_title: values.meta_title || null,
        meta_description: values.meta_description || null,
        og_image: values.og_image || null,
        og_description: values.og_description || null,
        canonical_url: values.canonical_url || null,
        published: values.published,
        updated_at: new Date().toISOString(),
      }

      if (isNew) {
        const { error } = await supabase.from('pages').insert(payload)
        if (error) throw error
      } else {
        const { error } = await supabase.from('pages').update(payload).eq('id', id!)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      toast.success(isNew ? 'Página criada!' : 'Página atualizada!')
      navigate('/paginas')
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/paginas')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-semibold">
          {isNew ? 'Nova Página' : `Editando: ${page?.title}`}
        </h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Título da página" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug (URL) *</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="px-3 h-10 flex items-center border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm">
                          /
                        </span>
                        <Input
                          className="rounded-l-none"
                          placeholder="minha-pagina"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>Apenas letras minúsculas, números e hífens.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conteúdo</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Conteúdo da página..."
                        rows={8}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="published"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="cursor-pointer">Publicada</FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">SEO & Meta Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="meta_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Título para SEO (opcional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="meta_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição para SEO..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="og_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OG Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canonical_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canonical URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="og_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OG Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descrição para redes sociais..." rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/paginas')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#010744] hover:bg-[#010744]/90 text-white"
              disabled={mutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {mutation.isPending ? 'Salvando...' : 'Salvar Página'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
