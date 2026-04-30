/**
 * Sanitizador minimalista de HTML para descrições vindas do CRM (SupremoCRM).
 *
 * NOTA: já tentamos usar isomorphic-dompurify aqui, mas ele puxa jsdom
 * (Node-native) no server e o Turbopack do Next.js 16 não consegue
 * empacotá-lo — runtime explodia com "Failed to load external module"
 * em /imovel/[id] e /empreendimentos/[id]. Voltamos para o regex
 * sanitizer porque o conteúdo é admin-controlled (vem do CRM Supremo,
 * não de usuário final), então o trade-off de segurança é aceitável.
 *
 * Estratégia:
 * 1. Remove tags perigosas + conteúdo (script/style/iframe/etc).
 * 2. Mantém apenas tags da allowlist de formatação.
 * 3. Remove TODOS os atributos das tags permitidas (incl. style/class/on*).
 * 4. Decodifica algumas entidades comuns.
 * 5. Colapsa parágrafos vazios.
 */

const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'h2',
  'h3',
  'h4',
  'span',
  'div',
])

const DANGEROUS_BLOCKS = /<(script|style|iframe|noscript|object|embed|link|meta|svg|math|form|input|button)\b[^>]*>[\s\S]*?<\/\1>/gi
const STANDALONE_DANGEROUS = /<(script|style|iframe|noscript|object|embed|link|meta|svg|math|form|input|button)\b[^>]*\/?>/gi

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return ''

  return input
    .replace(DANGEROUS_BLOCKS, '')
    .replace(STANDALONE_DANGEROUS, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi, (_match, slash: string, tagName: string) => {
      const tag = tagName.toLowerCase()
      if (!ALLOWED_TAGS.has(tag)) return ''
      return `<${slash}${tag}>`
    })
    .replace(/&nbsp;/g, ' ')
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/<span>\s*<\/span>/g, '')
    .replace(/<div>\s*<\/div>/g, '')
    .replace(/(\s*\n){3,}/g, '\n\n')
    .trim()
}

/**
 * Decide se a string parece HTML (tem tags) ou texto puro.
 * Usado para renderizar com whitespace-pre-line quando é só texto.
 */
export function looksLikeHtml(input: string | null | undefined): boolean {
  if (!input) return false
  return /<[a-z][a-z0-9]*\b[^>]*>/i.test(input)
}
