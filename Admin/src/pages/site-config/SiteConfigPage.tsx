import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, Info } from 'lucide-react'
import { ImageUploadStorage } from '@/components/shared/ImageUploadStorage'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import type { Json } from '@/types/database'

// ── Zod schema ────────────────────────────────────────────────────────────────
const hex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve estar em formato HEX (#RRGGBB)')
  .or(z.literal(''))

const schema = z.object({
  // Identidade
  company_name: z.string().min(1, 'Obrigatório'),
  company_slogan: z.string().optional(),
  logo_url: z.string().url('URL inválida').or(z.literal('')),
  logo_header_url: z.string().url('URL inválida').or(z.literal('')),
  logo_footer_url: z.string().url('URL inválida').or(z.literal('')),
  favicon_url: z.string().url('URL inválida').or(z.literal('')),

  // Cores
  primary_color: hex,
  accent_color: hex,
  tertiary_color: hex,

  // Contato
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  whatsapp_full: z.string().optional(),
  email: z.string().email('Email inválido').or(z.literal('')),
  address: z.string().optional(),
  creci: z.string().optional(),

  // Redes sociais
  instagram: z.string().url('URL inválida').or(z.literal('')),
  facebook: z.string().url('URL inválida').or(z.literal('')),
  youtube: z.string().url('URL inválida').or(z.literal('')),
  linkedin: z.string().url('URL inválida').or(z.literal('')),
  twitter: z.string().url('URL inválida').or(z.literal('')),
  tiktok_url: z.string().url('URL inválida').or(z.literal('')),

  // SEO
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  og_image: z.string().url('URL inválida').or(z.literal('')),

  // Rastreamento
  gtm_id: z.string().optional(),
  fb_pixel_id: z.string().optional(),
  linkedin_partner_id: z.string().optional(),
  linkedin_conversion_id: z.string().optional(),
  tiktok_pixel_id: z.string().optional(),
  google_site_verification: z.string().optional(),
  bing_verification: z.string().optional(),
})

type ConfigForm = z.infer<typeof schema>

const defaultValues: ConfigForm = {
  company_name: 'Morejá Imobiliária',
  company_slogan: '',
  logo_url: '',
  logo_header_url: '',
  logo_footer_url: '',
  favicon_url: '',
  primary_color: '#010744',
  accent_color: '#f2d22e',
  tertiary_color: '#ededd1',
  phone: '',
  whatsapp: '',
  whatsapp_full: '',
  email: '',
  address: '',
  creci: '',
  instagram: '',
  facebook: '',
  youtube: '',
  linkedin: '',
  twitter: '',
  tiktok_url: '',
  meta_title: 'Morejá Imobiliária | Encontre o imóvel dos seus sonhos',
  meta_description: '',
  og_image: '',
  gtm_id: '',
  fb_pixel_id: '',
  linkedin_partner_id: '',
  linkedin_conversion_id: '',
  tiktok_pixel_id: '',
  google_site_verification: '',
  bing_verification: '',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function fetchConfigs(): Promise<ConfigForm> {
  const { data } = await supabase.from('site_config').select('*')
  const map: Record<string, Json> = {}
  ;(data ?? []).forEach((row) => { map[row.key] = row.value })

  const str = (key: keyof ConfigForm) => String(map[key] ?? defaultValues[key] ?? '')

  return {
    company_name:           str('company_name'),
    company_slogan:         str('company_slogan'),
    logo_url:               str('logo_url'),
    logo_header_url:        str('logo_header_url'),
    logo_footer_url:        str('logo_footer_url'),
    favicon_url:            str('favicon_url'),
    primary_color:          str('primary_color') || '#010744',
    accent_color:           str('accent_color') || '#f2d22e',
    tertiary_color:         str('tertiary_color') || '#ededd1',
    phone:                  str('phone'),
    whatsapp:               str('whatsapp'),
    whatsapp_full:          str('whatsapp_full'),
    email:                  str('email'),
    address:                str('address'),
    creci:                  str('creci'),
    instagram:              str('instagram'),
    facebook:               str('facebook'),
    youtube:                str('youtube'),
    linkedin:               str('linkedin'),
    twitter:                str('twitter'),
    tiktok_url:             str('tiktok_url'),
    meta_title:             str('meta_title'),
    meta_description:       str('meta_description'),
    og_image:               str('og_image'),
    gtm_id:                 str('gtm_id'),
    fb_pixel_id:            str('fb_pixel_id'),
    linkedin_partner_id:    str('linkedin_partner_id'),
    linkedin_conversion_id: str('linkedin_conversion_id'),
    tiktok_pixel_id:        str('tiktok_pixel_id'),
    google_site_verification: str('google_site_verification'),
    bing_verification:      str('bing_verification'),
  }
}

async function saveConfigs(data: ConfigForm) {
  const entries = Object.entries(data) as [string, string][]
  // Upsert all keys in parallel
  await Promise.all(
    entries.map(([key, value]) =>
      supabase.from('site_config').upsert(
        { key, value: value as Json, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
    )
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SiteConfigPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['site_config_all'],
    queryFn: fetchConfigs,
  })

  const mutation = useMutation({
    mutationFn: saveConfigs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_config_all'] })
      toast.success('Configurações salvas com sucesso!')
    },
    onError: (err: Error) => toast.error(`Erro ao salvar: ${err.message}`),
  })

  const form = useForm<ConfigForm>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  useEffect(() => {
    if (data) form.reset(data)
  }, [data, form])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6 max-w-3xl">

        {/* ── Identidade ─────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Identidade</CardTitle>
            <CardDescription>Nome da empresa e assets visuais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="company_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa</FormLabel>
                  <FormControl><Input placeholder="Morejá Imobiliária" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="company_slogan" render={({ field }) => (
                <FormItem>
                  <FormLabel>Slogan</FormLabel>
                  <FormControl><Input placeholder="Realize o sonho da casa própria" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="logo_url" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ImageUploadStorage
                    label="Logo Principal (fallback)"
                    value={field.value}
                    onChange={field.onChange}
                    bucket="site"
                    folder="logos"
                    specs={{
                      width: 400,
                      height: 140,
                      mode: 'fit',
                      label: '400 × 140 px',
                      hint: 'Logo genérico usado como fallback se não houver versão específica de header ou footer.',
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="logo_header_url" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUploadStorage
                      label="Logo — Header"
                      value={field.value}
                      onChange={field.onChange}
                      bucket="site"
                      folder="logos/header"
                      specs={{
                        width: 400,
                        height: 140,
                        mode: 'fit',
                        label: '400 × 140 px (header)',
                        hint: 'Versão exibida no topo do site (fundo claro). Use logo navy/escuro.',
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="logo_footer_url" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUploadStorage
                      label="Logo — Footer"
                      value={field.value}
                      onChange={field.onChange}
                      bucket="site"
                      folder="logos/footer"
                      specs={{
                        width: 400,
                        height: 140,
                        mode: 'fit',
                        label: '400 × 140 px (footer)',
                        hint: 'Versão exibida no rodapé (fundo escuro). Use logo amarela ou branca.',
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="favicon_url" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUploadStorage
                      label="Favicon"
                      value={field.value}
                      onChange={field.onChange}
                      bucket="site"
                      folder="logos"
                      specs={{
                        width: 64,
                        height: 64,
                        mode: 'cover',
                        label: '64 × 64 px (favicon)',
                        hint: 'Ícone da aba do navegador. Use PNG com fundo transparente.',
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* ── Contato ───────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
            <CardDescription>Informações de contato exibidas no site</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl><Input placeholder="(11) 3000-0000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="whatsapp" render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp (exibição)</FormLabel>
                  <FormControl><Input placeholder="(11) 9 9999-9999" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="whatsapp_full" render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp (DDI + número para link)</FormLabel>
                <FormControl><Input placeholder="5511999999999" {...field} /></FormControl>
                <FormDescription>
                  Usado no link wa.me/ — somente dígitos, com DDI (ex: 5511999999999)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl><Input placeholder="contato@moreja.com.br" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl><Input placeholder="Rua..., Bairro, Cidade - SP" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="creci" render={({ field }) => (
              <FormItem>
                <FormLabel>CRECI</FormLabel>
                <FormControl><Input placeholder="CRECI-SP 00000-J" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* ── Redes Sociais ─────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Redes Sociais</CardTitle>
            <CardDescription>Links completos (https://...) das redes da empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(
                [
                  { name: 'instagram',  label: 'Instagram',  ph: 'https://instagram.com/usuario' },
                  { name: 'facebook',   label: 'Facebook',   ph: 'https://facebook.com/pagina' },
                  { name: 'youtube',    label: 'YouTube',    ph: 'https://youtube.com/@canal' },
                  { name: 'linkedin',   label: 'LinkedIn',   ph: 'https://linkedin.com/company/...' },
                  { name: 'twitter',    label: 'Twitter / X', ph: 'https://x.com/usuario' },
                  { name: 'tiktok_url', label: 'TikTok',     ph: 'https://tiktok.com/@usuario' },
                ] as { name: keyof ConfigForm; label: string; ph: string }[]
              ).map(({ name, label, ph }) => (
                <FormField key={name} control={form.control} name={name} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl><Input placeholder={ph} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── SEO ───────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>SEO</CardTitle>
            <CardDescription>Título, descrição e imagem padrão para redes sociais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="meta_title" render={({ field }) => (
              <FormItem>
                <FormLabel>Título do Site (meta title)</FormLabel>
                <FormControl><Input placeholder="Morejá Imobiliária | Encontre seu imóvel" {...field} /></FormControl>
                <FormDescription>Ideal: até 60 caracteres</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="meta_description" render={({ field }) => (
              <FormItem>
                <FormLabel>Meta Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descrição do site para Google e redes sociais..."
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>Ideal: 120–160 caracteres</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="og_image" render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ImageUploadStorage
                    label="Imagem Open Graph (og:image)"
                    value={field.value}
                    onChange={field.onChange}
                    bucket="site"
                    folder="og"
                    specs={{
                      width: 1200,
                      height: 630,
                      mode: 'cover',
                      label: '1200 × 630 px (og:image)',
                      hint: 'Exibida ao compartilhar o site no WhatsApp, Facebook, LinkedIn e Twitter/X.',
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        {/* ── Rastreamento & Analytics ───────────────────────────────── */}
        <Card className="border-orange-200">
          <CardHeader>
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <CardTitle>Rastreamento & Analytics</CardTitle>
                <CardDescription>
                  IDs de pixels e tags de rastreamento — carregados automaticamente no portal.
                  Deixe em branco para desativar.
                </CardDescription>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-700 flex items-center gap-1.5 shrink-0">
                <Info className="w-3.5 h-3.5" />
                Apenas admins podem editar
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* GTM */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-800">Google Tag Manager</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Recomendado</span>
              </div>
              <FormField control={form.control} name="gtm_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>GTM ID</FormLabel>
                  <FormControl><Input placeholder="GTM-XXXXXXX" {...field} /></FormControl>
                  <FormDescription>
                    Encontre em <strong>tagmanager.google.com</strong> → seu container.
                    Permite gerenciar todos os outros pixels de dentro do GTM também.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Google Search Console */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <span className="text-sm font-semibold text-gray-800">Google Search Console</span>
              <FormField control={form.control} name="google_site_verification" render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Verificação</FormLabel>
                  <FormControl><Input placeholder="abc123xyz..." {...field} /></FormControl>
                  <FormDescription>
                    Cole apenas o valor do atributo <code>content</code> da meta tag de verificação
                    (ex: <code>abc123xyz</code>, não a tag inteira).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Bing */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <span className="text-sm font-semibold text-gray-800">Bing Webmaster Tools</span>
              <FormField control={form.control} name="bing_verification" render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Verificação Bing</FormLabel>
                  <FormControl><Input placeholder="ABC123..." {...field} /></FormControl>
                  <FormDescription>Valor do atributo <code>content</code> da meta tag msvalidate.01</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Meta Pixel */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <span className="text-sm font-semibold text-gray-800">Meta (Facebook) Pixel</span>
              <FormField control={form.control} name="fb_pixel_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Pixel ID</FormLabel>
                  <FormControl><Input placeholder="123456789012345" {...field} /></FormControl>
                  <FormDescription>
                    <strong>business.facebook.com</strong> → Events Manager → Connect Data Source → Web
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* LinkedIn */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <span className="text-sm font-semibold text-gray-800">LinkedIn Insight Tag</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="linkedin_partner_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partner ID</FormLabel>
                    <FormControl><Input placeholder="1234567" {...field} /></FormControl>
                    <FormDescription>
                      <strong>linkedin.com/campaignmanager</strong> → Assets → Insight Tag
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="linkedin_conversion_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conversion ID (opcional)</FormLabel>
                    <FormControl><Input placeholder="7654321" {...field} /></FormControl>
                    <FormDescription>Dispara no evento de lead/formulário</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* TikTok */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <span className="text-sm font-semibold text-gray-800">TikTok Pixel</span>
              <FormField control={form.control} name="tiktok_pixel_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Pixel ID</FormLabel>
                  <FormControl><Input placeholder="ABCDEF123456789" {...field} /></FormControl>
                  <FormDescription>
                    <strong>ads.tiktok.com</strong> → Assets → Events → Manage → Set Up Web Events
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

          </CardContent>
        </Card>

        {/* ── Cores da Marca (editáveis) ────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Cores da Marca</CardTitle>
            <CardDescription>
              Paleta aplicada no portal. As cores são injetadas como variáveis CSS
              (<code>--brand-primary</code>, <code>--brand-accent</code>, <code>--brand-tertiary</code>).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(
                [
                  { name: 'primary_color',  label: 'Primária (Navy)',   help: 'Fundos escuros, header, footer, botões primários' },
                  { name: 'accent_color',   label: 'Destaque (Amarelo)', help: 'CTAs, hover, elementos de realce' },
                  { name: 'tertiary_color', label: 'Terciária (Creme)',  help: 'Backgrounds secundários, seções claras' },
                ] as { name: 'primary_color' | 'accent_color' | 'tertiary_color'; label: string; help: string }[]
              ).map(({ name, label, help }) => (
                <FormField key={name} control={form.control} name={name} render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-12 h-10 rounded-md border shadow-sm shrink-0"
                        style={{ background: field.value || '#ffffff' }}
                        aria-hidden="true"
                      />
                      <FormControl>
                        <input
                          type="color"
                          className="h-10 w-14 rounded-md border cursor-pointer"
                          value={field.value || '#000000'}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <Input
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        placeholder="#010744"
                        className="font-mono text-sm"
                      />
                    </div>
                    <FormDescription className="text-xs">{help}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              ))}
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end pb-8">
          <Button
            type="submit"
            className="bg-[#010744] hover:bg-[#010744]/90 text-white min-w-40"
            disabled={mutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {mutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>

      </form>
    </Form>
  )
}
