/**
 * Sanitizador robusto de HTML para descrições vindas do CRM (SupremoCRM).
 * Usa isomorphic-dompurify (DOMPurify + jsdom no server, DOMPurify no client).
 *
 * Substitui o sanitizer regex anterior. Motivo: regex parsing de HTML é
 * inerentemente bypassable (ex: `<svg/onload=...>`, namespaced tags,
 * atributos malformados). DOMPurify usa um parser real e é o padrão
 * da indústria para defesa contra XSS.
 */

import DOMPurify from 'isomorphic-dompurify'

type PurifyConfig = Parameters<typeof DOMPurify.sanitize>[1]

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u',
  'ul', 'ol', 'li',
  'h2', 'h3', 'h4',
  'span', 'div',
]

// Sem `style`/`class`/`on*`/`href` — descrições do CRM nunca devem carregar links/scripts.
const ALLOWED_ATTR: string[] = []

const FORBID_TAGS = [
  'script', 'style', 'iframe', 'noscript', 'object', 'embed',
  'link', 'meta', 'svg', 'math', 'form', 'input', 'button',
]

const FORBID_ATTR = [
  'style', 'class', 'id', 'href', 'src', 'srcset', 'formaction',
  'xlink:href', 'data',
]

const PURIFY_CONFIG: PurifyConfig = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  FORBID_TAGS,
  FORBID_ATTR,
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  USE_PROFILES: { html: true },
}

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return ''

  const cleaned = DOMPurify.sanitize(input, PURIFY_CONFIG) as unknown as string

  // Cleanup pós-DOMPurify específico do CRM:
  //  - colapsa parágrafos vazios produzidos por <p style="...">&nbsp;</p>
  //  - colapsa <br><br> excessivo (tratamento visual fica em prose-property css)
  return cleaned
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
