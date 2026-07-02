// Simulador de financiamento da Morejá (app externo).
// Fonte única do link — usado no menu, no CTA das páginas de imóvel e no
// botão do hero. Sobrescrevível via NEXT_PUBLIC_SIMULATOR_URL.
export const SIMULATOR_URL =
  process.env.NEXT_PUBLIC_SIMULATOR_URL ||
  'https://simulacao.srv1577302.hstgr.cloud/simulacao-financiamento'
