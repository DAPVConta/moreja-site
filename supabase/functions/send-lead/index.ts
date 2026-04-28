import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function sanitize(str: string | undefined): string {
  if (!str) return ''
  return str.trim().slice(0, 1000)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Accept both English (legacy) and Portuguese (current frontend) field names.
  // ContactForm.tsx and LeadFormInline.tsx post: nome, email, telefone, mensagem, origem, imovel_id, imovel_codigo
  const name = sanitize(body.name ?? body.nome)
  const email = sanitize(body.email)
  const phone = sanitize(body.phone ?? body.telefone)
  const message = sanitize(body.message ?? body.mensagem)
  const property_id = sanitize(body.property_id ?? body.imovel_id)
  const property_title = sanitize(body.property_title ?? body.imovel_codigo ?? body.imovel_titulo)
  const source = sanitize(body.source ?? body.origem) || 'contato'

  // Validation
  if (!name) {
    return new Response(
      JSON.stringify({ error: 'Nome é obrigatório' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!email || !isValidEmail(email)) {
    return new Response(
      JSON.stringify({ error: 'E-mail inválido' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data, error } = await supabase
    .from('leads')
    .insert({ name, email, phone, message, property_id, property_title, source })
    .select('id')
    .single()

  if (error) {
    console.error('Lead insert error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao salvar contato. Tente novamente.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, id: data.id }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
