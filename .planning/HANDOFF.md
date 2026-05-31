# Handoff

Ultima atualizacao: 2026-05-30

## Estado atual

- Repositorio local: `D:\DeOlho`
- Branch atual: `codex/m0-fundacao-social-grafo`
- Observacao Git: `git pull --ff-only` foi executado em `main` antes da branch e estava atualizado; a branch local ainda nao tem upstream configurado.
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

## Atualizacao M0: Fundacao Social-Civica + ADR do Grafo

### Issue trabalhada

M0: Fundacao Social-Civica + ADR do Grafo.

### Entregue

- Home reposicionada como radar social-civico com `EventoCivicoCard`, badges de tipo/fonte/confianca, limitacoes, evidencias, conexoes e contexto territorial Wikipedia com fallback.
- Compositor renomeado para `evento-compositor`, com contrato `EventoComposto`, suporte a `fornecedorDocumento` e `credorDocumento`, avisos obrigatorios em sancoes e degradacao visivel quando falta fonte/evidencia.
- Politica de Wikipedia isolada: enriquecimento permitido apenas para cidade, territorio, orgao, unidade de orgao e lugar publico.
- Reacoes civicas atualizadas para enum fechado: `apoio`, `parcial`, `contra`, `faltou_informacao`; continuam opiniao de usuario, sem persistencia nesta entrega.
- ADR criada em `.planning/research/GRAPH.md`: decisao recomendada e evolutiva, com PostgreSQL como fonte canonica/read model antes de qualquer Neo4j em producao.
- `.planning` e `docs/` atualizados para guardrails de rede social civica, contribuicoes contextuais moderadas, habitos privados e mapa de conexoes documentadas.

### Verificacoes executadas

- `pnpm --filter web test:compositor` -> OK.
- `pnpm -r typecheck` -> OK.
- `pnpm -r lint` -> OK.
- `pnpm -r build` -> OK.
- `git diff --check` -> OK; apenas avisos CRLF do Windows.
- Validacao visual com Playwright em `http://127.0.0.1:3000/` desktop e mobile: HTTP 200, 30 cards, fonte/confianca visiveis, sem linguagem publica de post/like/comentario livre, sem overflow horizontal raiz.

### Pendencias conhecidas

- `/explorar` ainda e a experiencia de descoberta atual; a substituicao por Mapa de conexoes fica para a proxima issue.
- A pasta/import path `components/feed` permanece como legado tecnico; a UI e os comentarios de produto foram ajustados para radar/evento civico.
- Sem Neo4j, comentarios persistentes, perfis, pontos ou gamificacao publica nesta entrega.

### Proxima issue recomendada

Criar `/explorar` como Mapa de conexoes com read model PostgreSQL:

1. `getGraphSnapshot({ territory, rootEntityId, depth })`.
2. Lista acessivel + grafo compacto com painel de evidencia.
3. Limites iniciais: depth 1, maximo 150 nos e 300 arestas.
4. Toda aresta publica precisa de fonte, confianca e evidencia; sinais neutros mostram aviso de que nao indicam irregularidade.

## Atualizacao: Agente leve de apresentacao e entrada em eventos

### Entregue

- Criado agente leve em `packages/collectors/src/agents/civic-post-agent.ts`.
  - Usa OpenAI Responses API com `gpt-4.1-nano` e JSON schema quando ha cota.
  - Consome input compacto e `max_output_tokens` baixo.
  - Nunca cria fato, acusacao, relacao ou valor fora dos campos recebidos.
  - Se a API falhar ou faltar cota, cai em fallback deterministico.
- Criado script `pnpm --filter @deolho/collectors format:posts -- --limit=N`.
- Criado script `pnpm --filter @deolho/collectors sync:civic` para mapear PNCP, TCE, Diario e formatar eventos recentes no final.
- Home agora ordena por `mais recentes` por padrao, com alternativas `em alta na semana` e `mais conectados`.
- `/explorar` foi unificado com o Inicio: redireciona para `/?ordem=semana`.
- Cards do radar agora levam para `/evento/[id]` via `ler tudo`.
- Criada pagina `/evento/[id]` com cabecalho visual, imagem contextual, evidencia principal, conexoes documentadas quando existirem e relacionados com fallback por categoria/fonte.

### Verificacoes adicionais

- `pnpm --filter @deolho/collectors typecheck` -> OK.
- `pnpm --filter @deolho/collectors format:posts -- --limit=5 --force` -> OK; atualizou 5 eventos recentes via fallback porque a API retornou `insufficient_quota`.
- Playwright em mobile e desktop:
  - Home HTTP 200;
  - filtros de ordenacao presentes;
  - primeiro card abre `/evento/[id]`;
  - detalhe HTTP 200 com evidencia e relacionados;
  - `/explorar` redireciona para `/?ordem=semana`;
  - sem overflow horizontal raiz e sem erros de console.

### Pendencia operacional

- A chave OpenAI foi criada e salva em `.env.local`, mas a conta/projeto retornou `insufficient_quota`. O agente esta pronto; para usar a camada OpenAI, e necessario habilitar credito/cota no projeto da Platform.

## Atualizacao: IA visivel, leitura completa e recorte 2026+

### Entregue

- O agente leve agora recebe trechos de `evidence` e produz `leituraCompleta`, alem de titulo, resumo, linha fina, etiquetas, conexoes textuais e aviso.
- `format:posts` passou a processar por padrao apenas eventos desde `2026-01-01`; aceita `--since=YYYY-MM-DD` para mudar o recorte.
- O metadata salvo em `entidades.apresentacao` agora registra `leituraCompleta`, `evidenciasLidas`, `desde`, modo/modelo, titulo/resumo original e data de geracao.
- O compositor preserva titulo/resumo ja organizados pelo agente e separa conexoes textuais do agente como `tipo: "ia"`, com tooltip proprio.
- Cards mostram selo visual quando o titulo/resumo foram organizados por IA/agente.
- A pagina `/evento/[id]` usa `BlocoExplicacaoIA` para exibir claramente a leitura organizada, metadados do agente, fonte usada e limitacao de que a camada apenas organiza texto.
- A pagina de detalhe ganhou bloco explicito de contexto visual Wikipedia com aviso de que nao e fonte do evento.

### Verificacoes adicionais

- `pnpm --filter @deolho/collectors typecheck` -> OK.
- `pnpm --filter web test:compositor` -> OK.
- `pnpm -r lint` -> OK.
- `pnpm -r build` -> OK.
- Browser local em `http://127.0.0.1:3000/` -> Home abre com ordenacao e contexto Wikipedia; como o Postgres local estava fora, validou estado vazio/fallback.

### Pendencias operacionais

- `pnpm --filter @deolho/collectors format:posts -- --limit=8 --force` nao conseguiu executar porque o Postgres local recusou conexao (`ECONNREFUSED`) e o Docker Desktop nao estava ativo.
- Quando o banco voltar, rodar `pnpm --filter @deolho/collectors format:posts -- --limit=80 --force` para preencher a nova leitura completa nos eventos recentes.

## Atualizacao: Wikipedia estrategica, agente local e datas do Diario

### Entregue

- O radar "mais recentes" agora ordena por `coalesce(data_evento, published_at::date)` e nao usa mais `criado_em` como data publica. Eventos sem data publica caem no fim e nao entram no filtro "em alta na semana".
- O compositor mostra limitacao visivel quando evento nao tem data publica confiavel.
- O mapper do Diario Oficial adiciona limitacao `data publica` quando o atomo nao tem `edicaoDate`; ao remapear, esses eventos deixam claro que nao devem ser tratados como recentes.
- O agente de apresentacao ganhou provedores:
  - `DEOLHO_POST_AGENT_PROVIDER=local` (padrao): deterministicamente local, zero tokens externos;
  - `DEOLHO_POST_AGENT_PROVIDER=ollama`: LLM local via Ollama;
  - `DEOLHO_POST_AGENT_PROVIDER=openai`: Responses API quando houver cota;
  - `DEOLHO_POST_AGENT_PROVIDER=auto`: tenta Ollama e cai para local, sem usar token externo.
- A leitura completa aumentou para ate 3600 caracteres e usa ate 5 evidencias/trechos para explicar o documento em secoes.
- `/evento/[id]` agora sempre mostra uma leitura completa organizada: usa a apresentacao salva quando existir, ou gera leitura local ao vivo a partir das evidencias da pagina.
- Wikipedia agora e contextual por evento: tenta orgaos, empresas, pessoas publicas, leis e conceitos publicos citados, alem do territorio.
- Home passa a destacar contexto enciclopedico dos eventos recentes quando houver eventos, em vez de depender apenas de Americana.
- A UI explicita que Wikipedia contextualiza, mas nao e fonte do evento; a prova continua nas evidencias oficiais.

### Configuracao local recomendada

Para zero tokens externos:

```bash
DEOLHO_POST_AGENT_PROVIDER=local
```

Para usar IA local com Ollama:

```bash
ollama pull llama3.2:3b
DEOLHO_POST_AGENT_PROVIDER=ollama
DEOLHO_POST_AGENT_LOCAL_MODEL=llama3.2:3b
```

## Atualizacao: ficha publica da evidencia e Wikipedia restrita ao evento

### Entregue

- Home deixou de renderizar bloco Wikipedia generico. O enriquecimento enciclopedico fica dentro da pagina do evento, onde ha contexto e evidencias.
- Wikipedia por evento deixou de usar fallback automatico de Americana/SP e agora tenta apenas entidades, leis e conceitos diretamente citados no evento ou nas evidencias.
- A pagina `/evento/[id]` ganhou ficha publica da evidencia antes da leitura organizada:
  - o que aconteceu;
  - por que/objeto;
  - quem esta envolvido;
  - quando aconteceu/publicou/coletou;
  - onde aconteceu;
  - o que foi publicamente divulgado;
  - lacunas e limitacoes.
- O read model de detalhe agora carrega territorio, datas da evidencia e metadados das relacoes documentadas para alimentar a ficha sem inferencia.
- Conexoes documentadas mostram fonte, confianca e aviso neutro quando nao forem fato oficial.

### Guardrail registrado

Wikipedia contextualiza apenas o que foi citado no evento. Nao prova fatos, nao cria vinculos e nao deve aparecer como contexto aleatorio na Home.

### Verificacoes adicionais

- `pnpm --filter web test:compositor` -> OK.
- `pnpm -r typecheck` -> OK.
- `pnpm -r lint` -> OK.
- `pnpm -r build` -> OK.
- `git diff --check` -> OK; apenas avisos CRLF do Windows.
- Browser local em `http://127.0.0.1:3000/`:
  - Home com 129.736 eventos e sem bloco Wikipedia generico;
  - primeiro evento abre `/evento/[id]`;
  - detalhe mostra ficha publica da evidencia, leitura organizada, Wikipedia contextual do evento, trecho original e relacionados/conexoes;
  - mobile 390x844 e desktop 1280x900 sem overflow horizontal e sem erros de console.

## Atualizacao: resumo mensal do radar e cards mais explicativos

### Entregue

- `mais recentes` agora abre com uma leitura local do mês antes da lista normal:
  - período, total de eventos, valor citado, fontes e categorias mais presentes;
  - pontos úteis para entender o mês;
  - recomendações de acontecimentos do próprio mês.
- Criado read model `getResumoMensalRadar`, com fallback para o mês mais recente com dados quando o mês corrente não tiver eventos.
- Criado componente `ResumoMensalRadarCard`.
- Cards de evento ficaram mais densos e legíveis:
  - mídia visual temática local por tipo de evento;
  - título maior;
  - descrição mais contextual;
  - mini-ficha com `Para que`, `Envolvidos`, `Onde` e `Quando`.
- O agente local de apresentação foi melhorado para contratos recentes:
  - preserva fornecedor no título;
  - corta campos colados por rótulos estruturados;
  - usa evidência para objeto/finalidade;
  - continua sem tokens externos por padrão.
- Reprocessados 120 eventos recentes com `pnpm --filter @deolho/collectors format:posts -- --limit=120 --force`.

### Verificacoes adicionais

- `pnpm --filter web test:compositor` -> OK.
- `pnpm --filter @deolho/collectors typecheck` -> OK.
- `pnpm -r lint` -> OK.
- `pnpm -r build` -> OK.
- Browser local:
  - resumo mensal visível em `mais recentes`;
  - recomendações do mês visíveis;
  - cards com mini-ficha e imagens locais;
  - mobile 390x844 e desktop 1280x900 sem overflow horizontal e sem erros de console.
