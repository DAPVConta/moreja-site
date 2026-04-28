/**
 * Helper client-side p/ verificar token Turnstile via /api/turnstile-verify
 * antes de submeter lead. Chamado no handleSubmit dos forms.
 */
export async function verifyTurnstileToken(
  token: string,
  action: string
): Promise<{ ok: boolean; error?: string }> {
  if (!token) return { ok: false, error: 'missing_token' }

  try {
    const res = await fetch('/api/turnstile-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action }),
    })
    const json = (await res.json()) as {
      success: boolean
      skipped?: string
      errors?: string[]
    }
    if (json.skipped === 'turnstile_not_configured') {
      // Graceful degradation — admin não configurou Turnstile ainda
      return { ok: true }
    }
    if (json.success) return { ok: true }
    return { ok: false, error: json.errors?.join(',') || 'verify_failed' }
  } catch {
    return { ok: false, error: 'network_error' }
  }
}

/**
 * Min-time-to-submit anti-bot: bots tendem a submeter forms em &lt; 1s.
 * Humanos levam alguns segundos pra ler+preencher. Retorna false se
 * submissão veio cedo demais (suspeita).
 */
export function passedMinTimeToSubmit(formMountedAt: number, minSeconds = 2): boolean {
  return Date.now() - formMountedAt >= minSeconds * 1000
}
