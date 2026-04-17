import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Testimonial } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ImageUploadStorage } from '@/components/shared/ImageUploadStorage'
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

const schema = z.object({
  name: z.string().min(1, 'Obrigatório'),
  role: z.string().optional(),
  text: z.string().min(10, 'Mínimo de 10 caracteres'),
  rating: z.number().int().min(1).max(5),
  photo_url: z.string().optional(),
  active: z.boolean(),
})

type TestimonialFormValues = z.infer<typeof schema>

interface TestimonialFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  testimonial?: Testimonial | null
}

export function TestimonialForm({ open, onOpenChange, testimonial }: TestimonialFormProps) {
  const queryClient = useQueryClient()
  const isEditing = !!testimonial

  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      role: '',
      text: '',
      rating: 5,
      photo_url: '',
      active: true,
    },
  })

  useEffect(() => {
    if (testimonial) {
      form.reset({
        name: testimonial.name,
        role: testimonial.role ?? '',
        text: testimonial.text,
        rating: testimonial.rating,
        photo_url: testimonial.photo_url ?? '',
        active: testimonial.active,
      })
    } else {
      form.reset({ name: '', role: '', text: '', rating: 5, photo_url: '', active: true })
    }
  }, [testimonial, form, open])

  const mutation = useMutation({
    mutationFn: async (values: TestimonialFormValues) => {
      const payload = {
        name: values.name,
        role: values.role || null,
        text: values.text,
        rating: values.rating,
        photo_url: values.photo_url || null,
        active: values.active,
      }
      if (isEditing && testimonial) {
        const { error } = await supabase.from('testimonials').update(payload).eq('id', testimonial.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('testimonials').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] })
      toast.success(isEditing ? 'Depoimento atualizado!' : 'Depoimento criado!')
      onOpenChange(false)
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  })

  const watchRating = form.watch('rating')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Depoimento' : 'Novo Depoimento'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="João Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo / Função</FormLabel>
                    <FormControl>
                      <Input placeholder="Comprador" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Depoimento *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Texto do depoimento..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avaliação</FormLabel>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => field.onChange(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            star <= watchRating
                              ? 'fill-[#f2d22e] text-[#f2d22e]'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {watchRating}/5
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="photo_url"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUploadStorage
                      label="Foto"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      bucket="site"
                      folder="testimonials"
                      specs={{
                        width: 400,
                        height: 400,
                        mode: 'cover',
                        label: '400 × 400 px (quadrado)',
                        hint: 'Foto do cliente. Ajuste o enquadramento e zoom antes de salvar.',
                      }}
                    />
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
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Ativo (exibir no site)</FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

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
