# Importação de imóveis — feed ClaivorCRM

Integração que importa imóveis e empreendimentos do feed JSON do ClaivorCRM
para a tabela `properties_cache` do Supabase, no mesmo contrato `Property`
(`src/types/property.ts`) que o restante do site já consome.

## Arquitetura

```
ClaivorCRM (feed JSON)
      │  GET CLAIVOR_FEED_URL
      ▼
/api/import-feed  (route handler, service role)
      │  upsert external_id=claivor_<codigo> · type=imovel|empreendimento
      ▼
properties_cache ──► src/lib/properties.ts ──► /comprar · /alugar · /imovel/[id] · /empreendimentos
```

- **Normalização**: `src/lib/feed/claivor.ts` mapeia os campos do feed
  (`preco_venda`, `condominio`, `iptu_anual`, `uf`, `foto_capa`…) para a
  interface `Property` (`preco`, `preco_condominio`, `preco_iptu`, `estado`,
  `fotos[0]`…).
- **Escrita**: `src/app/api/import-feed/route.ts` faz upsert em lote
  (`ON CONFLICT external_id`), remove itens que saíram do feed, registra
  mudanças de preço em `property_price_history` e revalida as páginas ISR.
- **`expires_at`** é gravado 10 anos no futuro: a RLS
  `public_read_active_cache` (migration 020) esconde linhas expiradas, e o
  feed é fonte de verdade — não um cache com TTL.

## Configuração (Vercel → Environment Variables)

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `CLAIVOR_FEED_URL` | sim | URL completa do feed, com token: `https://claivorcrm.com.br/api/feeds/<conta>/json?token=<token>` |
| `FEED_IMPORT_SECRET` | sim* | Segredo aceito em `Authorization: Bearer …` para disparar a importação manualmente |
| `CRON_SECRET` | sim* | Injetado automaticamente pelo Vercel Cron nas chamadas agendadas (também aceito como Bearer) |
| `SUPABASE_SERVICE_ROLE_KEY` | sim | Já usada pelo projeto; a RLS de `properties_cache` só permite escrita ao service role |
| `PROPERTIES_SOURCE` | não | Default = `local`: o site serve **exclusivamente** o feed Claivor importado (`external_id claivor_*`); `supremo` reativa o supremo-proxy como fonte primária |

\* pelo menos uma das duas precisa estar definida, senão a rota responde 401.

## Agendamento

`vercel.json` define um cron diário (06:00 UTC) chamando `GET /api/import-feed`.
O Vercel envia `Authorization: Bearer $CRON_SECRET` automaticamente quando a
env `CRON_SECRET` existe no projeto. Planos Pro podem aumentar a frequência
(ex.: `0 */6 * * *`); no plano Hobby o limite é 1x/dia.

## Execução manual

```bash
curl -X POST https://moreja.com.br/api/import-feed \
  -H "Authorization: Bearer $FEED_IMPORT_SECRET"
```

Resposta (exemplo):

```json
{
  "ok": true,
  "total": 18,
  "imoveis": 18,
  "empreendimentos": 0,
  "inserted": 18,
  "updated": 0,
  "removed": 0,
  "price_changes": 18,
  "skipped": [],
  "duration_ms": 1240
}
```

Erros: `401 unauthorized`, `500 server_misconfigured` (env faltando),
`502 feed_unavailable`/`feed_fetch_failed`, `422 feed_empty` (feed sem itens —
nada é apagado por segurança), `500 db_read_failed`/`db_write_failed`.

## Formato do feed (observado em 2026-07)

```json
{
  "imobiliaria": "MoreJá",
  "contato": { "nome": "...", "email": null, "telefone": null },
  "total": 18,
  "gerado_em": "2026-07-02T01:52:57.268Z",
  "imoveis": [
    {
      "codigo": "AP-4428535",
      "titulo": "...",
      "tipo": "apartamento",          // apartamento | casa | comercial | ...
      "operacao": "venda",            // venda | locacao
      "destaque": false,
      "preco_venda": 1000000,
      "preco_locacao": null,
      "condominio": 3300,
      "iptu_anual": 6992,
      "area_util": 259,
      "area_total": null,
      "quartos": 4, "suites": 3, "banheiros": 5, "vagas": 3,
      "bairro": "Piedade", "cidade": "Recife", "uf": "PE",
      "endereco": null,
      "descricao": "texto puro com \n",
      "foto_capa": "https://api.supabase.srv1577302.hstgr.cloud/storage/...",
      "fotos": ["https://..."],
      "link": null
    }
  ]
}
```

O importador também aceita um array opcional `empreendimentos` (mesmo shape)
e classifica como empreendimento qualquer item com `tipo` contendo
"empreendimento"/"lançamento". Empreendimentos importados aparecem em
`/empreendimentos` via fallback local (estendido em `src/lib/properties.ts`).

## Observações

- As fotos do feed são hotlinkadas do storage do Claivor
  (`api.supabase.srv1577302.hstgr.cloud`, host liberado em
  `next.config.ts remotePatterns`). Se o CRM trocar de domínio, é preciso
  adicionar o novo host lá.
- Por padrão o site exibe **apenas** imóveis importados do feed Claivor:
  a leitura local filtra `external_id LIKE 'claivor_%'` (mocks de seed e
  resíduos de cache do Supremo ficam de fora) e o supremo-proxy não é
  consultado. Para voltar ao comportamento antigo, defina
  `PROPERTIES_SOURCE=supremo`.
