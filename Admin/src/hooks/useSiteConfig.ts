import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Json } from '@/types/database'
import { toast } from 'sonner'

export function useSiteConfig(key: string) {
  return useQuery({
    queryKey: ['site_config', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_config')
        .select('*')
        .eq('key', key)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return data
    },
    staleTime: 1000 * 60 * 10, // 10 minutes - config rarely changes
  })
}

export function useAllSiteConfigs() {
  return useQuery({
    queryKey: ['site_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_config')
        .select('*')
        .order('key')
      if (error) throw error
      return data ?? []
    },
    staleTime: 1000 * 60 * 10,
  })
}

export function useUpdateSiteConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Json }) => {
      const { data: existing } = await supabase
        .from('site_config')
        .select('id')
        .eq('key', key)
        .single()

      if (existing) {
        const { error } = await supabase
          .from('site_config')
          .update({ value, updated_at: new Date().toISOString() })
          .eq('key', key)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('site_config')
          .insert({ key, value })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_config'] })
      toast.success('Configuração salva com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar: ${error.message}`)
    },
  })
}
