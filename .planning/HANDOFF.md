# Handoff

Ultima atualizacao: 2026-05-30

## Estado atual

- Repositorio local: `D:\DeOlho`
- Branch atual: `codex/fundacao-civica-eventos`
- Observacao Git: `git pull --ff-only` nao executa nesta branch porque ela ainda nao tem upstream configurado.
- Territorio da entrega: Americana/SP primeiro.
- Escopo trabalhado: fundacao civica com eventos, evidencias, vinculos documentados, fluxos financeiros e cobertura de fontes.

## Entregue nesta sessao

### Banco canonico

- Criadas as tabelas canonicas:
  - `civic_events`
  - `evidence`
  - `entity_relationships`
  - `money_flows`
  - `source_coverage`
- Adicionados enums para categorias civicas, tipos de relacionamento, tipos de fluxo financeiro e status de cobertura.
- Migration gerada: `packages/db/migrations/0004_awesome_wallop.sql`.
- `sources` atualizado para incluir `camara-americana`, totalizando 10 fontes no catalogo.

### PNCP

- Corrigido o transform de PNCP no web com type guard seguro para diferenciar compra/contrato.
- `/financas` agora usa PNCP real quando ha snapshot local e fallback marcado como demonstrativo/sintetico.
- Mapper PNCP adaptado ao payload real da API:
  - fornecedor via `niFornecedor`/`nomeRazaoSocialFornecedor`;
  - numero via `numeroContrato`, `numeroContratoEmpenho` ou `numeroControlePNCP`;
  - URL publica do contrato PNCP derivada de `numeroControlePNCP`.
- Validacao local:
  - 627 contratos retornados na coleta completa;
  - 1.118 raw records locais acumulados por causa da primeira tentativa interrompida + recoleta completa;
  - 578 contratos distintos por `numeroControlePNCP`;
  - 578 eventos;
  - 578 evidencias;
  - 578 fluxos `contratado`;
  - 578 vinculos documentados orgao-fornecedor.
- Segunda execucao do mapper PNCP manteve contagens estaveis.

### TCE-SP

- Corrigido adapter para a API oficial atual:
  - `/api/json/despesas/americana/{exercicio}/{mes}`
  - `/api/json/receitas/americana/{exercicio}/{mes}`
- Ingestao L0 em lote (`ingestMany`) para suportar volume real.
- Mapper TCE-SP cria eventos/evidencias/fluxos para:
  - `empenhado`
  - `liquidado`
  - `pago`
  - `anulado`
  - `receita_arrecadada`
- Valores zero e negativos tambem viram fluxo quando publicados pela fonte.
- Pessoa fisica comum nao vira entidade publica: documento de credor so e usado quando for CNPJ completo.
- Validacao local:
  - 124.795 despesas cruas;
  - 4.074 receitas cruas;
  - 124.794 eventos de pagamento;
  - 4.071 eventos de receita;
  - 128.865 evidencias TCE-SP;
  - nenhum raw TCE-SP ficou sem evento/evidencia/fluxo esperado;
  - segunda execucao do mapper TCE-SP retornou 0 pendencias.

### Diario, atomos e evidencias

- Extração de atomos agora suporta segmentacao documental com `indefinido`.
- Eventos do Diario gerados a partir dos atomos:
  - 273 eventos/evidencias;
  - 24 contratos publicados;
  - 249 atos publicados.
- Extracao de territorio adicionada para rua, bairro, escola, UBS, praca, secretaria, orgao e equipamento publico quando aparecem no texto.
- Mapper de mencoes Diario->entidade mantem a regra conservadora: so liga CNPJ encontrado no PDF a empresa ja conhecida.

### Fontes e cobertura

`source_coverage` validado com 12 linhas:

- `pncp/contrato`: `fresh`
- `pncp/compra`: `partial`
- `tce-sp/despesa`: `fresh`
- `tce-sp/receita`: `fresh`
- `diario-americana/gazeta`: `fresh`
- `querido-diario/gazeta`: `no_data`
- `transparencia-americana/execucao-orcamentaria`: `unavailable`
- `camara-americana/atividade-legislativa`: `no_data`
- `cgu-transparencia/ceis`: `partial` em rodada limitada
- `cgu-transparencia/cnep`: `partial` em rodada limitada
- `receita-cnpj/cnpj-qsa`: `fresh`
- `tse/doacao-eleitoral`: `pending`

### Produto e linguagem publica

- Removida linguagem publica de "familia no poder".
- Substituida por "vinculos documentados" e "mencoes publicas".
- Mantida a regra: nada de parentesco por sobrenome, nada de score de corrupcao, nada de acusacao automatica.
- Sinais/limitacoes aparecem como limitacao de fonte, nao como fato.

## Verificacoes executadas

- `docker compose up -d db` -> Postgres/pgvector healthy.
- `pnpm --filter @deolho/db migrate` -> OK.
- `pnpm --filter @deolho/db seed` -> OK, 10 fontes.
- `pnpm --filter @deolho/db check` -> OK.
- `pnpm --filter @deolho/collectors collect:pncp` -> contratos coletados; licitacoes ficaram parciais por exigencia de modalidade do endpoint.
- `pnpm --filter @deolho/collectors map:pncp` -> OK e idempotente.
- `pnpm --filter @deolho/collectors collect:tce` -> OK.
- `pnpm --filter @deolho/collectors map:tce` -> OK e idempotente.
- `pnpm --filter @deolho/collectors map:diario-atoms` -> OK.
- `pnpm --filter @deolho/collectors collect:diario` -> OK, `no_data`.
- `pnpm --filter @deolho/collectors collect:diario-americana` -> OK.
- `pnpm --filter @deolho/collectors collect:transparencia` -> OK, `unavailable`.
- `pnpm --filter @deolho/collectors collect:tse` -> OK, `pending`.
- `pnpm --filter @deolho/collectors collect:camara` -> OK, `no_data`.
- `pnpm --filter @deolho/collectors collect:ceis -- --max-pages=1` -> OK, `partial`.
- `pnpm --filter @deolho/collectors exec tsx src/adapters/ceis-cnep.ts cnep --max-pages=1` -> OK, `partial`.
- `pnpm --filter @deolho/collectors enrich:socios` -> OK, 323 socios gravados como atributo de empresa.
- `pnpm -r typecheck` -> OK.
- `pnpm -r lint` -> OK.
- `pnpm -r build` -> OK.
- `git diff --check` -> OK; apenas avisos CRLF do Windows.

## Pendencias conhecidas

- PNCP compras/licitacoes ainda precisa iterar modalidades corretamente; cobertura esta marcada como `partial`.
- Camara Municipal ainda precisa de mapeadores dedicados para projetos, indicacoes, requerimentos, votacoes e sessoes; cobertura inicial esta `no_data` porque o seletor generico nao encontrou itens.
- Transparencia Americana segue `unavailable` para execucao detalhada enquanto a secao SIAFIC estiver indisponivel no portal.
- TSE esta `pending`: a fonte e bulk ZIP e exige entrega focada para download, descompactacao e filtro por Americana/pessoas publicas.
- CEIS/CNEP foi validado com `--max-pages=1`; rodada completa deve ir para job com rate limit.
- Mapper de mencoes do Diario tentou 2 PDFs recentes e recebeu `fetch failed`; precisa reavaliar download/headers se essa ligacao for prioridade imediata.
- A branch contem `.claudian/` e `web/` untracked locais; nao foram alterados nem regularizados por esta entrega.

## Proxima issue recomendada

Fazer a fatia de produto "linha do tempo civica":

1. API/read model para `civic_events` + `evidence` + `money_flows` + `source_coverage`.
2. Tela de evento com fonte, trecho, data de publicacao/coleta, link original e limitacoes.
3. Filtros por rua/bairro/orgao/fornecedor/tipo de gasto.
4. Mapeadores dedicados da Camara para indicacoes/requerimentos de zeladoria.
