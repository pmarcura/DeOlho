# Feature Landscape

**Domain:** Civic transparency / open government data platform (Brazil)
**Researched:** 2026-05-23
**Overall confidence:** MEDIUM (see Research Limitations below)

## Research Limitations (read first)

> **Live verification was NOT possible in this environment.** WebSearch, WebFetch, and the
> Context7 CLI fallback were all denied (network access blocked). This document is built from
> **training-data knowledge** of the named platforms — substantial and stable for well-documented
> civic-tech tools (OpenCorporates, OCCRP Aleph, ProPublica, mySociety, OpenSpending, Querido Diário, Serenata
> de Amor, Brasil.IO), but **cannot reflect changes within the last ~12-18 months**.
>
> **Confidence calibration:**
> - **MEDIUM** = the platform's *core feature model* is stable and corroborated across training; unlikely to have fundamentally changed.
> - **LOW** = specific feature details, exact data freshness, or recent additions unverifiable against current docs.
>
> **Action for roadmap:** Treat platform-specific claims as a starting hypothesis. Re-verify against
> live docs during phase-specific research — especially PNCP/Transparência API behaviors and Querido
> Diário coverage, which evolve.

---

## How to read this document

Each of the 10 feature categories is classified into:
- **Table Stakes** — users (journalists, citizens, devs) leave without this.
- **Differentiators** — competitive advantage for DeOlho, aligned with trust-first positioning.
- **Anti-features** — deliberately excluded, with reason.

Complexity: **Low / Med / High** for a Next.js + PostgreSQL stack built by AI agents.

---

## Platform reference map (who does what well)

| Platform | Domain | Feature signature worth stealing |
|----------|--------|----------------------------------|
| **OpenCorporates** | Global company registry | Entity pages com provenance por campo; framing "as recorded by official register"; bulk + API; URLs permanentes por empresa |
| **OCCRP Aleph** | Investigative document search | Full-text em milhões de docs + entidades estruturadas; cross-referenciamento; entity graph; alertas em buscas salvas |
| **ProPublica Nonprofit Explorer** | US nonprofit filings | Página de entidade limpa; raw filing (PDF) linkado ao lado do dado parseado; framing "data comes from IRS, here's the caveat" |
| **mySociety — TheyWorkForYou** | UK parliament | Páginas de políticos em linguagem simples; histórico de votos resumido em termos humanos; alerta por keyword/pessoa; disclaimers "our interpretation" |
| **OpenSpending** | Budget/spending data | Modelo fiscal padronizado; breakdowns visuais; bulk data |
| **EveryPolitician** (arquivado) | Politician identity data | IDs canônicos compartilhados; reconciliação entre fontes |
| **Serenata de Amor / Jarbas** | BR — despesas parlamentares | Sinais de anomalia (não acusações); framing "suspicions, not facts"; Rosie sinaliza, humanos verificam |
| **Brasil.IO** | BR — open datasets | Datasets públicos limpos, normalizados; baixáveis; API; documenta metodologia e fonte por dataset |
| **Querido Diário (OKBR)** | BR — gazetas municipais | Diários com OCR, full-text pesquisável; alertas por keyword; PDF fonte sempre linkado |
| **Transparência Internacional Brasil** | BR — anti-corruption | "Mapa das Conexões" para relações; transparência de metodologia |
| **data.gov / data.gov.uk / ODI** | Gov data portals | Padrões de catálogo; metadados (publicador, licença, frequência de atualização); clareza de licença aberta |

---

## 1. Search and Discovery

**Confidence: MEDIUM**

### Table Stakes
| Feature | Por que esperado | Complexidade | Notas / Dependências |
|---------|-----------------|-------------|----------------------|
| Search box único aceitando número de contrato, CNPJ, nome de órgão ou keyword (CONT-01, ENT-03) | Toda plataforma tem um ponto de entrada; usuários não sabem qual "tipo" estão buscando | Med | Depende de DATA-01. PostgreSQL FTS (`tsvector` + `pg_trgm`) cobre v1 |
| Tolerância a erros de digitação / fuzzy match em nomes | Nomes de CNPJ/órgão são longos; OpenCorporates e Aleph fazem fuzzy | Med | `pg_trgm` similarity. Crítico para queries "Prefeitura de São..." |
| Filtros/facets: órgão, faixa de valor, período, status | OpenSpending, Aleph, ProPublica facetam; jornalistas refinam constantemente | Med | Colunas indexadas |
| Lista de resultados mostra tipo por entidade (contrato vs empresa vs órgão) | Busca multi-entidade é confusa sem rótulos de tipo | Low | Parte do sistema de tipos |
| URLs permanentes e citáveis por entidade | Jornalistas citam; cidadãos compartilham | Low | Slugs/IDs estáveis; decidir esquema de URL cedo |

### Differentiators
| Feature | Proposta de valor | Complexidade | Notas |
|---------|------------------|-------------|-------|
| Query em linguagem natural roteada para filtros estruturados ("contratos de merenda escolar em 2024") | Serve jornalista e cidadão (aposta dual) | High | Camada de conveniência de IA sobre busca determinística, nunca o único caminho. Adiar além do MVP |
| "Busca mostra cobertura de fonte" — resultados indicam quais fontes foram consultadas | Expressa TRUST-05 na camada de busca | Med | Raro; forte diferenciador trust-first |
| Buscas salvas (fundação para alertas §7) | mySociety/Aleph convertem buscas salvas em alertas | Med | Requer contas. Modelar agora, UI depois |

### Anti-features
| Anti-Feature | Por que evitar | Em vez disso |
|--------------|---------------|--------------|
| Ranking opaco estilo Google que esconde *por que* um resultado bateu | Contradiz trust-first | Mostrar razão do match (CNPJ / texto do objeto / órgão) |
| Sugerir automaticamente contratos "suspeitos" na busca | Implica culpa antes de evidência (TRUST-04) | Relevância neutra; sinais rotulados só na página de entidade |
| Infra de busca pesada (Elasticsearch) em v1 | Carga operacional antes do volume justificar | PostgreSQL FTS até a latência forçar uma mudança |

---

## 2. Entity Pages

**Confidence: MEDIUM** — Superfície core do DeOlho (a "Página Viva").

### Table Stakes
| Feature | Por que esperado | Complexidade | Notas / Dependências |
|---------|-----------------|-------------|----------------------|
| Página de contrato: valor, órgão contratante, empresa contratada, objeto, território (CONT-03) | Mínimo que uma página de contrato deve responder | Med | MVP core. Depende de DATA-01 (PNCP) |
| Resumo em português simples do que é o contrato (CONT-02) | Valor central do TheyWorkForYou é linguagem simples | Med (AI) | Sumarização de IA restrita a fatos da fonte (TRUST-04) |
| Página de empresa/CNPJ: todos os contratos vinculados + sanções (ENT-01) | OpenCorporates/ProPublica: uma página canônica por entidade | Med | Depende de DATA-02 (CEIS/CNEP) |
| Página de órgão público: histórico de contratações (ENT-02) | Visão de agregação que jornalistas esperam | Med | Reutiliza índice de contratos |
| Link para documento oficial / extrato (CONT-05) | ProPublica mostra PDF raw; Aleph linka doc fonte | Med | Depende de DATA-03 (DOU/INLABS) |
| URL estável, citável, compartilhável por entidade | Jornalistas citam; cidadãos compartilham | Low | Ver §1 |

### Differentiators
| Feature | Proposta de valor | Complexidade | Notas |
|---------|------------------|-------------|-------|
| Tipagem de confiança por campo (fato oficial / explicação / sinal de atenção / notícia / opinião) (TRUST-01) | **Diferenciador signature.** Nenhuma plataforma mainstream tipa em granularidade de campo | High | Fundação, não decoração. Data model primeiro; UI segue |
| Limitações da fonte declaradas inline ("a fonte não informa X") (CONT-07) | TRUST-05 visível | Med | Requer metadados de fonte por campo. Raro |
| Bloco de "perguntas cívicas" ("O serviço foi executado? Existe fiscalização?") (CONT-08) | Transforma registro estático em ferramenta de ação — único do DeOlho | Low | Principalmente templating. Alto valor, baixo custo. Entregar no MVP |
| Sinais de atenção com disclaimer explícito "não indica irregularidade" (CONT-06) | Sinais estilo Serenata com guardrails mais fortes | Med | Depende de camada de regras de sinais. Disclaimer obrigatório |
| Seção "O que ainda não sabemos" | Operacionaliza TRUST-05 como elemento de primeira classe | Low | Constrói confiança com jornalistas céticos |

### Anti-features
| Anti-Feature | Por que evitar | Em vez disso |
|--------------|---------------|--------------|
| Scores de corrupção / risco por entidade | Fora do escopo; transforma sinais em veredictos | Sinais discretos, rotulados, linkados à fonte — nunca um score composto |
| Páginas para indivíduos privados | Linha legal/ética (LGPD; apenas pessoas públicas em função) | Apenas órgãos/empresas/pessoas públicas. Enforçar no data model |
| Prosa editorializada em páginas de entidade | Embaralha fato vs opinião | Manter opinião/notícia tipada e separada; página default = fatos + explicações |
| Narrativas "investigativas" auto-geradas | IA inventando uma história = fabricação (TRUST-04) | IA resume apenas campos verificáveis |

---

## 3. Evidence and Source Display

**Confidence: MEDIUM**

### Table Stakes
| Feature | Por que esperado | Complexidade | Notas |
|---------|-----------------|-------------|-------|
| Toda afirmação linka para seu documento/base fonte (TRUST-02) | Aleph, ProPublica, Querido Diário ancoram afirmações em docs | Med | Constraint cross-cutting; no data model desde o início |
| Atribuição de fonte: qual base (PNCP/Transparência/DOU) por dado | Norma data.gov/ODI: publicador sempre nomeado | Low | Proveniência por campo |
| Link direto ou extrato embutido de documento oficial DOU/PNCP (CONT-05) | Querido Diário sempre mostra o PDF do diário | Med | Depende de DATA-03. Armazenar snapshot/extrato — URLs gov quebram |

### Differentiators
| Feature | Proposta de valor | Complexidade | Notas |
|---------|------------------|-------------|-------|
| Snapshot/arquivo da fonte no momento da coleta | URLs gov quebram; evidência arquivada é durável | Med | Custo de storage, grande ganho de credibilidade |
| Span destacado no doc fonte suportando um campo | Aleph destaca matches | High | Adiar além do MVP; precisa de dados OCR/posição |
| Cadeia de proveniência para valores derivados/computados ("calculado a partir de X + Y") | Distingue fatos raw de valores computados pelo DeOlho | Med | Par com tipagem de confiança. Raro |

### Anti-features
| Anti-Feature | Por que evitar | Em vez disso |
|--------------|---------------|--------------|
| Afirmações sem fonte linkável | Viola constraint de evidência obrigatória | Marcar "não verificado" ou omitir |
| Re-hospedar documentos com direitos autorais/não-públicos | Risco legal | Linkar ou extrair apenas fontes oficiais públicas |
| Agregar dados pessoais além da fonte | Risco LGPD | Exibir apenas o que a fonte pública divulga |

---

## 4. Trust Signals (Freshness, Source Quality, Limitations)

**Confidence: MEDIUM** — Área de diferenciação mais forte do DeOlho; fraca em toda a indústria.

### Table Stakes
| Feature | Por que esperado | Complexidade | Notas |
|---------|-----------------|-------------|-------|
| "Última atualização/coletado/publicado" por dataset (TRUST-03) | data.gov.uk/ODI requerem frequência de atualização; usuários desconfiam de dados sem data | Low | Armazenar timestamps de ingestão (DATA-04) |
| Aviso "dados podem estar desatualizados" quando lag excede threshold (TRUST-03) | Honesto dado que fontes gov atrasam | Low | Threshold por fonte |
| Fonte nomeada + licença por dataset | Norma ODI/open-data | Low | Alinha com identidade open-source |

### Differentiators
| Feature | Proposta de valor | Complexidade | Notas |
|---------|------------------|-------------|-------|
| Freshness por campo (não apenas por dataset) | Mais granular que qualquer plataforma de referência | Med | Depende de proveniência por campo de §3 |
| Declarações explícitas de completude da fonte ("PNCP não cobre X"; TRUST-05) | Quase ninguém declara o que sua fonte *não* contém | Med | Base de conhecimento por fonte inicialmente curada |
| Legenda visual de tipos de confiança em todo o site (fato/explicação/sinal/notícia/opinião) | Torna TRUST-01 legível; torna-se identidade visual | Med | Nível de design system; coordenar com fase de UI |
| Disclosure de "confiança/limitações" em texto de IA | Honestidade sobre prosa resumida por máquina | Low | Rotulagem obrigatória para outputs §9 |

### Anti-features
| Anti-Feature | Por que evitar | Em vez disso |
|--------------|---------------|--------------|
| Badges "Verificado" implicando que DeOlho endossa precisão | Implica uma garantia que o projeto não pode fazer | Framing "As recorded by [source]" |
| Promessas de dados em "tempo real" | Fora do escopo; desonesto dado o lag | Lag honesto + timestamps de freshness |
| Score composto único de "confiança" por página | Colapsa a nuance que o sistema existe para preservar | Sinais discretos tipados com fontes independentes |

---

## 5. Timeline and History

**Confidence: MEDIUM**

### Table Stakes
| Feature | Por que esperado | Complexidade | Notas |
|---------|-----------------|-------------|-------|
| Timeline de contrato: publicação, aditivos, alterações, pagamentos (CONT-04) | MVP core; a vida de um contrato é sua história | Med | Depende de DATA-01 + DATA-04 |
| Cada evento da timeline linka para seu documento fonte | Reforça mandato de evidência no nível de evento | Med | Depende de §3 |

### Differentiators
| Feature | Proposta de valor | Complexidade | Notas |
|---------|------------------|-------------|-------|
| Histórico de mudança de dados ("o valor mudou de X para Y entre coletas") | Expõe edições silenciosas — ouro investigativo | High | Modelo temporal/append-only (DATA-04). Adiar UI, modelar agora |
| Descrições de eventos em linguagem simples ("3º aditivo aumentou o valor em 40%") | Timeline legível por cidadão | Med (AI) | Explicação de IA restrita de um delta factual |
| Diff entre versões de contrato | Transparência estilo git para registros públicos | High | Construído sobre histórico de mudanças. Fase posterior |

### Anti-features
| Anti-Feature | Por que evitar | Em vez disso |
|--------------|---------------|--------------|
| Eventos futuros inferidos/previstos ("provável aditivo") | Especulação próxima a fatos (TRUST-04) | Registrar apenas eventos sourced que ocorreram |
| Timelines de carreira de político em v1 | Fora do escopo (módulo TSE/político é v2) | Adiar para módulo político |

---

## 6. Relationship Mapping

**Confidence: MEDIUM**

### Table Stakes
| Feature | Por que esperado | Complexidade | Notas |
|---------|-----------------|-------------|-------|
| Empresa → outros contratos; órgão → outros contratos (CONT-09) | MVP explícito; mínimo de "conectar os pontos" | Med | Joins relacionais; sem graph DB ainda |
| Links bidirecionais entre entidades linkadas | Baseline de navegação OpenCorporates/Aleph | Low | Deriva do schema normalizado |

### Differentiators
| Feature | Proposta de valor | Complexidade | Notas |
|---------|------------------|-------------|-------|
| Visão de relacionamento com fonte explícita por aresta | TI Brasil's "Mapa das Conexões" + proveniência por aresta | High | Cada aresta é um fato, não uma inferência |
| IDs canônicos de entidade compartilhados (um nó por empresa em todos os contratos) | Reconciliação OpenCorporates/EveryPolitician; evita duplicatas | Med | **Fazer cedo — retrofitar IDs é caro.** |
| Fatos de "concentração" ("órgão concentra 60% dos contratos nessa empresa") tipados como computados | Sinal investigativo, honestamente rotulado como DeOlho-computado | Med | Depende de proveniência de computação de §3 + regras de sinal |

### Anti-features
| Anti-Feature | Por que evitar | Em vez disso |
|--------------|---------------|--------------|
| Relacionamentos inferidos ("provavelmente conectados, mesmo endereço") como fato | Culpa por associação (TRUST-04) | Apenas arestas respaldadas por registro oficial; rotular ou omitir inferências |
| Grafo force-directed como UI principal | "Mapa como feature principal" Fora do Escopo; baixa compreensão para cidadãos | Blocos de relacionamento sourced em lista primeiro; grafo visual depois, opcional |
| Linkar pessoas públicas a família/associados privados | LGPD + culpa por associação | Apenas função pública |

---

## 7. Alerts and Monitoring

**Confidence: MEDIUM**

### Table Stakes (persona jornalista/dev; não estritamente no MVP)
| Feature | Por que esperado | Complexidade | Notas |
|---------|-----------------|-------------|-------|
| Alerta por email em busca salva ou entidade monitorada | TheyWorkForYou, Querido Diário, Aleph — definidor para o investigador | Med | Depende de contas + buscas salvas (§1) + DATA-04 |
| Notificação "novo contrato matching X" | O alerta por keyword do Querido Diário é sua killer feature | Med | Depende de pipeline incremental detectando novos registros |

> Alertas **não estão no conjunto de requisitos v1** mas são *table stakes para a persona jornalista*.
> Recomendar modelar o data model de busca salva + contas no MVP para que alertas shipem barato na próxima fase.

### Differentiators
| Feature | Proposta de valor | Complexidade | Notas |
|---------|------------------|-------------|-------|
| Alerta em *mudança* para entidade monitorada (valor mudou, aditivo adicionado) | Além de "novo match" para "algo que você monitora mudou" | High | Depende de dados versionados (DATA-04). Forte hook de retenção |
| Alertas de freshness por fonte ("PNCP não atualiza há N dias") | Transparência sobre o próprio pipeline | Low | Reutiliza dados de freshness de §4 |
| Feeds Webhook/RSS (não apenas email) para devs | Serve persona dev-ativista | Med | Par com API (§10) |

### Anti-features
| Anti-Feature | Por que evitar | Em vez disso |
|--------------|---------------|--------------|
| Alertas framing como "alerta de corrupção" | Sensacionaliza; postura não-acusatória | Neutro "mudança detectada" com link para evidência |
| Promessas de alerta em tempo real | Lag da fonte torna isso desonesto | Alertas em batch alinhados à cadência real da fonte |

---

## 8. Contribution and Community

**Confidence: MEDIUM**

### Table Stakes
| Feature | Por que esperado | Complexidade | Notas |
|---------|-----------------|-------------|-------|
| Mecanismo de correção de erros ("reportar erro nesta página") | PROJECT.md manda correção desde o início; válvula de segurança legal | Low-Med | Vale o MVP. Formulário estruturado → fila de triagem |
| Repo open-source com CONTRIBUTING.md, CODE_OF_CONDUCT (OSS-01) | Definidor para persona dev-ativista + identidade do projeto | Low | Já é um requisito |
| CI/CD aberto e reproduzível (OSS-02) | Credibilidade civic-tech; reprodutibilidade = confiança | Med | Já é um requisito |
| Documentação pública de decisões/specs (OSS-03, Obsidian Publish) | Transparência de metodologia (Brasil.IO documenta cada dataset) | Low | Já é um requisito |

### Differentiators
| Feature | Proposta de valor | Complexidade | Notas |
|---------|------------------|-------------|-------|
| Correções estruturadas, com fonte obrigatória | Eleva qualidade das correções; combina com ethos de evidência | Med | Previne modo de falha de seção de comentários |
| Log público de correções / changelog por entidade | Mostra honestidade sobre próprios erros — raro, constrói confiança | Med | Par com histórico de mudanças §5 |
| Páginas de metodologia por fonte de dados | Movimento de confiança signature do Brasil.IO | Low | Content-heavy, low-tech, alta credibilidade |

### Anti-features
| Anti-Feature | Por que evitar | Em vez disso |
|--------------|---------------|--------------|
| Comentários abertos / feed social (v1) | Fora do Escopo; vira arena política antes da moderação | Correções estruturadas apenas; feed adiado para v2 com regras |
| "Evidências" submetidas por usuários sem moderação | Risco de fabricação/difamação | Fila de triagem; nada publica sem fonte |
| Perfis públicos de usuário / karma / gamificação | Convida brigading; transforma dados cívicos em jogo | Manter contribuição utilitária, não social |

---

## 9. AI Features

**Confidence: MEDIUM** — limitado rigorosamente por TRUST-04. IA é uma *camada*, nunca o produto.

### Table Stakes (dado posicionamento AI-native)
| Feature | Por que esperado | Complexidade | Notas |
|---------|-----------------|-------------|-------|
| Sumarização de contrato em português simples (CONT-02) | MVP core; promessa de compreensão do cidadão | Med | Estritamente ancorado em campos da fonte (TRUST-04) |
| Explicação de termos jurídicos ("o que é um aditivo?") | Reduz a barreira de literacia | Low-Med | Glossário + explicação sob demanda. Tipado "explicação", não "fato" |

### Differentiators
| Feature | Proposta de valor | Complexidade | Notas |
|---------|------------------|-------------|-------|
| Geração de perguntas cívicas (CONT-08) adaptadas ao contrato | IA como ferramenta de accountability, não narração | Med | Template + IA leve. Revisável |
| Detecção de sinais de atenção (estilo Serenata/Rosie), rotulados "não é irregularidade" (CONT-06) | Valor investigativo com guardrails éticos | High | Rule-based primeiro, IA-assistida depois. Todo sinal linkado à fonte + explicado |
| Sumarização ancorada com citações de volta aos campos | Cada frase do resumo rastreável — RAG-with-provenance | High | O modo honesto de fazer IA aqui; forte diferenciador |
| Respostas "ainda não sabemos" (TRUST-05) | IA que admite ignorância — oposta à cultura de alucinação | Med | Guardrail/prompt + UI affordance. On-brand |

### Anti-features
| Anti-Feature | Por que evitar | Em vez disso |
|--------------|---------------|--------------|
| Chat de IA como produto principal | Fora do escopo; "a IA não é o produto" | IA = camada de explicação/sumarização sobre páginas estruturadas |
| IA que afirma fatos ou acusa (TRUST-04) | Risco de difamação + fabricação | IA só resume/explica/sugere a partir de dados verificados |
| "Veredictos de corrupção" ou scores gerados por IA | Fora do escopo; postura anti-julgamento | Sinais rotulados + perguntas cívicas; o humano decide |
| Narrativas generativas sem ancoragem | Alucinação ao lado de fatos corrói toda a confiança | Outputs ancorados em recuperação com proveniência visível |

---

## 10. Data Export and API Access

**Confidence: MEDIUM** — crítico para personas jornalista + desenvolvedor.

### Table Stakes
| Feature | Por que esperado | Complexidade | Notas |
|---------|-----------------|-------------|-------|
| Export CSV/JSON de um resultado ou entidade | Brasil.IO, OpenSpending, OpenCorporates exportam; jornalistas vivem em planilhas | Low-Med | Feature de maior alavancagem para persona jornalista |
| API pública de leitura documentada | OpenCorporates/Aleph/Brasil.IO têm APIs; dev-ativista espera | Med | Rate-limited; espelha ethos open-data |
| Licença open data clara em exports | Norma ODI/data.gov; obrigatório para reutilização e confiança | Low | Declarar licença prominentemente |

### Differentiators
| Feature | Proposta de valor | Complexidade | Notas |
|---------|------------------|-------------|-------|
| Downloads de dataset bulk (dumps completos) | Valor core do Brasil.IO; pesquisadores fazem suas próprias análises | Med | Custo de storage/bandwidth; ganho de credibilidade |
| Exports carregam metadados de proveniência (fonte, collected-at, licença) | Dados re-exportados ficam honestos sobre origem | Low-Med | Par com §3/§4. Raro, on-brand |
| IDs estáveis de entidade na API para reconciliação | Outras ferramentas civic-tech podem linkar para entidades DeOlho | Med | Depende de IDs canônicos de §6. Aposta de network-effect |
| Affordance "Cite esta página" (permalink + data de acesso) | Construído para jornalistas/pesquisadores que devem citar | Low | Barato, alto valor para persona primária |

### Anti-features
| Anti-Feature | Por que evitar | Em vez disso |
|--------------|---------------|--------------|
| Dados paywalled / walled por cadastro | Contradiz missão cívica aberta | Gratuito, rate-limited, licença aberta |
| API sem throttle permitindo scraping abusivo | Constraint no PROJECT.md (proteção contra abuso) | Rate limiting + keys para uso pesado; leituras permanecem livres |
| Re-expor API upstream 1:1 sem valor agregado | Apenas faz proxy do PNCP; sem razão para existir | Exportar o modelo limpo, linkado, com proveniência |

---

## Feature Dependency Graph

```
DATA-01 (PNCP ingest)
  ├─> §1 Search ──> Saved searches ──> §7 Alerts (email/change)
  ├─> §2 Contract entity page (MVP core)
  │     ├─ needs §3 Evidence/source linking (TRUST-02)  <── DATA-03 (DOU/INLABS)
  │     ├─ needs §4 Trust signals (freshness)            <── DATA-04 (versioned pipeline)
  │     ├─ needs §9 AI summarization (CONT-02)
  │     └─ shows §5 Timeline (CONT-04)                   <── DATA-04
  ├─> §6 Relationship mapping (CONT-09)
  │     └─ needs Canonical entity IDs (build EARLY)
  └─> §10 Export/API

DATA-02 (Transparência: CEIS/CNEP) ──> §2 Company page sanctions (ENT-01)

Cross-cutting (must exist in the data model from day one):
  • Per-field provenance/source metadata  → powers §3, §4, §5, §10
  • Trust typing (TRUST-01)               → powers §2, §4, §9
  • Canonical entity IDs                  → powers §6, §10  (painful to retrofit)
  • Versioned/temporal storage (DATA-04)  → powers §5 change history, §7 change alerts
```

**Implicações de build-order:**
1. **Provenance + trust-typing data model primeiro** — tudo trust-related depende disso; não pode ser adicionado depois. Valida "sistema de confiança é a fundação, não a UI".
2. **IDs canônicos de entidade cedo** — retrofitar entity resolution depois que dados acumulam é caro (lição OpenCorporates/EveryPolitician).
3. **Ingestão versionada (DATA-04) cedo** mesmo se UI de histórico de mudanças shipar depois — desbloqueia os diferenciadores de maior valor (§5 diffs, §7 alertas de mudança); não pode ser reconstruído retroativamente.

---

## MVP Recommendation (nível de feature)

Alinhado com "Página Viva de Contrato Público":

**Shipar no MVP (table stakes + diferenciadores baratos de alto valor):**
1. Search de uma caixa por contrato/CNPJ/órgão/keyword com resultados com rótulo de tipo (§1)
2. Página de contrato: fatos chave, resumo em português simples, doc oficial linkado (§2, §3, §9)
3. Tipagem de confiança por campo + atribuição de fonte + freshness (§2, §3, §4) — **não adiar**
4. Timeline de contrato (§5) e relacionamentos básicos (empresa/órgão → outros contratos) (§6)
5. Sinais de atenção com disclaimer obrigatório de não-irregularidade + limitações da fonte (§2, §4)
6. Bloco de perguntas cívicas (§2) — baixo custo, alto valor de missão
7. Mecanismo de correção de erros (§8) — necessidade legal/ética
8. Export CSV/JSON + "cite esta página" (§10) — barato, conquista a persona jornalista

**Modelar o data model para (UI depois):**
- Buscas salvas + contas → alertas (§7)
- Ingestão versionada (DATA-04) → histórico de mudanças/diffs (§5), alertas de mudança (§7)
- IDs canônicos de entidade → grafo de relacionamentos (§6), API de reconciliação (§10)

**Explicitamente adiar (conforme Fora do Escopo):**
- Comentários abertos/feed social (v2 com moderação), chat de IA como superfície de produto, grafo force-directed como UI principal, módulo político/TSE, dados municipais, Transferegov/emendas, promessas em tempo real, qualquer score de corrupção ou acusação automatizada.

---

## Confidence Assessment

| Categoria | Confiança | Razão |
|-----------|-----------|-------|
| Modelo de features das plataformas nomeadas | MEDIUM | Assinaturas de features core estáveis no training; mudanças recentes não verificadas |
| Detalhes específicos de plataforma BR (Querido Diário, Serenata, PNCP/Transparência API) | LOW | Evoluem; não verificáveis; re-checar durante pesquisa de fase |
| Recomendações de features trust-first | MEDIUM | Do PROJECT.md + gaps das plataformas; não benchmarkado externamente ao vivo |
| Raciocínio de anti-features | MEDIUM-HIGH | Ancorado no Out-of-Scope do PROJECT.md + modos de falha documentados de civic-tech |
| Ratings de complexidade | LOW-MEDIUM | Estimado para Next.js + PostgreSQL; greenfield, sem codebase para validar |

## Gaps to Address in Later Research

- **Live verification de todas as claims de plataforma** — WebSearch/WebFetch/Context7 indisponíveis nesta sessão.
- **Especificidades de API PNCP & Portal da Transparência** — campos, paginação, rate limits, gaps de cobertura.
- **Feasibilidade de integração Querido Diário** — parceiro/fonte vs rebuild (municipal v2).
- **Abordagem de entity-resolution para CNPJ/órgão** — estratégia de ID canônico precisa de investigação técnica dedicada (alto custo de retrofit).
- **Revisão legal de redação de sinais de atenção** — linguagem de disclaimer é legal, não apenas produto.
