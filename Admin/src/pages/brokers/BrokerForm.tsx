import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Broker } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
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
import { ImageUploadStorage } from '@/components/shared/ImageUploadStorage'

const schema = z.object({
  name: z.string().min(1, 'Obrigatório'),
  email: z.string().email('Email inválido').or(z.literal('')),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  creci: z.string().optional(),
  photo_url: z.string().url('URL inválida').or(z.literal('')),
  bio: z.string().optional(),
  specialties: z.string().optional(),
  sort_order: z.coerce.number().int().min(0),
  active: z.boolean(),
})

type BrokerFormValues = z.infer<typeof schema>

interface BrokerFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  broker?: Broker | null
}

export function BrokerForm({ open, onOpenChange, broker }: BrokerFormProps) {
  const queryClient = useQueryClient()
  const isEditing = !!broker

  const form = useForm<BrokerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      whatsapp: '',
      creci: '',
      photo_url: '',
      bio: '',
      specialties: '',
      sort_order: 0,
      active: true,
    },
  })

  useEffect(() => {
    if (broker) {
      form.reset({
        name: broker.name,
        email: broker.email ?? '',
        phone: broker.phone ?? '',
        whatsapp: broker.whatsapp ?? '',
        creci: broker.creci ?? '',
        photo_url: broker.photo_url ?? '',
        bio: broker.bio ?? '',
        specialties: (broker.specialties ?? []).join(', '),
        sort_order: broker.sort_order,
        active: broker.active,
      })
    } else {
      form.reset({
        name: '', email: '', phone: '', whatsapp: '', creci: '',
        photo_url: '', bio: '', specialties: '', sort_order: 0, active: true,
      })
    }
  }, [broker, form, open])

  const mutation = useMutation({
    mutationFn: async (values: BrokerFormValues) => {
      const specialtiesArr = values.specialties
        ? values.specialties.split(',').map((s) => s.trim()).filter(Boolean)
        : []

      const payload = {
        name: values.name,
        email: values.email || null,
        phone: values.phone || null,
        whatsapp: values.whatsapp || null,
        creci: values.creci || null,
        photo_url: values.photo_url || null,
        bio: values.bio || null,
        specialties: specialtiesArr,
        sort_order: values.sort_order,
        active: values.active,
      }

      if (isEditing && broker) {
        const { error } = await supabase.from('brokers').update(payload).eq('id', broker.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('brokers').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brokers'] })
      toast.success(isEditing ? 'Corretor atualizado!' : 'Corretor criado!')
      onOpenChange(false)
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Corretor' : 'Novo Corretor'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="joao@moreja.com.br" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="creci"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CRECI</FormLabel>
                    <FormControl>
                      <Input placeholder="12345-F" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 3000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 9 9999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="photo_url"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUploadStorage
                      label="Foto do Corretor"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      bucket="admin"
                      folder="brokers"
                      specs={{
                        width: 400,
                        height: 400,
                        mode: 'cover',
                        label: '400 × 400 px (quadrado)',
                        hint: 'Foto profissional. Será recortada centralmente em formato quadrado.',
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio / Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descrição sobre o corretor..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialties"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidades (separadas por vírgula)</FormLabel>
                  <FormControl>
                    <Input placeholder="Apartamentos, Casas, Comercial" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sort_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem de exibição</FormLabel>
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
