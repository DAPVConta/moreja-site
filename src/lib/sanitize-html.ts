/**
 * Sanitizador de HTML para descrições vindas do CRM (SupremoCRM).
 *
 * Histórico:
 *  - v1: regex (substituível, vulnerável a `<svg/onload=...>`)
 *  - v2: isomorphic-dompurify (DOMPurify + jsdom no server) — abandonado
 *    porque jsdom é dep transitiva pesada com binários nativos (canvas)
 *    que o Turbopack do Next.js 16 falha em empacotar pro runtime
 *    serverless da Vercel ("Error: Failed to load external module").
 *    `serverExternalPackages` não resolve porque jsdom é dep transitiva,
 *    não importada diretamente. Sintoma: /imovel/[id] e
 *    /empreendimentos/[id] retornavam 500 em produção.
 *  - v3 (este arquivo): sanitize-html — parser real (htmlparser2) e
 *    allow-list de tags/atributos, 100% JS puro sem jsdom. Equivalente
 *    em segurança ao DOMPurify para o caso de uso aqui (HTML de
 *    descrições, sem scripts/iframes/event handlers).
 */
import sanitize from 'sanitize-html'

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u',
  'ul', 'ol', 'li',
  'h2', 'h3', 'h4',
  'span', 'div',
]

const SANITIZE_OPTIONS: sanitize.IOptions = {
  allowedTags: ALLOWED_TAGS,
  // Sem `style`/`class`/`href`/`src` — descrições do CRM nunca devem
  // carregar links/scripts/imagens externas.
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
  // Por baixo do capô, sanitize-html já remove <script>, <style>, <iframe>,
  // event handlers (on*) e protocolos perigosos (javascript:). A allow-list
  // acima atua como segunda barreira: tag não listada vira texto.
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
}

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return ''

  const cleaned = sanitize(input, SANITIZE_OPTIONS)

  // Cleanup pós-sanitize específico do CRM:
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
