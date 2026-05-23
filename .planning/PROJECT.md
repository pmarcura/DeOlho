# DeOlho

## What This Is

DeOlho é uma plataforma brasileira de transparência cívica open source que transforma dados públicos difíceis em conhecimento claro, verificável e acessível para qualquer pessoa. O produto conecta contratos, empresas, órgãos, leis, obras e políticos em páginas vivas com grau de confiança explícito em cada informação — separando fato oficial, explicação, sinal de atenção e opinião de forma rigorosa. É construído inteiramente com agentes de IA (que também programam o produto) e publicado como projeto aberto no GitHub.

## Core Value

Transformar um contrato público difícil de entender em uma página clara, rastreável e verificável que qualquer cidadão consegue compreender em segundos — com fonte, evidência, limitações e contexto.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Fundação — Sistema de Confiança**
- [ ] **TRUST-01**: Cada informação exibe origem com tipo explícito: fato oficial, explicação, sinal de atenção, notícia ou opinião
- [ ] **TRUST-02**: Cada afirmação tem link para o documento/base pública de origem
- [ ] **TRUST-03**: Cada dado exibe quando foi publicado, coletado e atualizado — e se está desatualizado
- [ ] **TRUST-04**: A IA do produto nunca inventa dados, acusa pessoas ou transforma suspeita em fato
- [ ] **TRUST-05**: O sistema consegue declarar "ainda não sabemos" e "essa fonte está incompleta"

**MVP — Página Viva de Contrato Público**
- [ ] **CONT-01**: Usuário busca contrato por número, CNPJ, órgão ou palavra-chave e encontra a página correspondente
- [ ] **CONT-02**: Página exibe resumo em português simples do que é o contrato
- [ ] **CONT-03**: Página exibe valor, órgão contratante, empresa contratada, objeto e território impactado
- [ ] **CONT-04**: Página exibe linha do tempo: publicação, aditivos, alterações, pagamentos
- [ ] **CONT-05**: Página exibe documento oficial vinculado (link ou extrato do DOU/PNCP)
- [ ] **CONT-06**: Página exibe sinais de atenção com aviso explícito de que não indicam irregularidade
- [ ] **CONT-07**: Página exibe limitações da fonte ("a fonte não informa X")
- [ ] **CONT-08**: Página exibe perguntas cívicas úteis ("O serviço foi executado? Existe fiscalização?")
- [ ] **CONT-09**: Página exibe relações: empresa → outros contratos, órgão → outros contratos

**Ingestão de Dados — v1**
- [ ] **DATA-01**: Coletar e indexar contratos do PNCP (Portal Nacional de Contratações Públicas)
- [ ] **DATA-02**: Enriquecer com Portal da Transparência (CGU): sanções CEIS/CNEP, licitações, despesas federais
- [ ] **DATA-03**: Vincular publicações do Diário Oficial da União (INLABS) como evidência documental
- [ ] **DATA-04**: Pipeline de atualização incremental com controle de versão de dados
- [ ] **DATA-05**: Tratamento de rate limits da API da Transparência (90 req/min diurno, 300 noturno)

**Entidades Relacionadas — v1**
- [ ] **ENT-01**: Página de empresa/CNPJ com todos os contratos públicos vinculados e sanções
- [ ] **ENT-02**: Página de órgão público com histórico de contratações
- [ ] **ENT-03**: Busca textual simples por contrato, empresa, órgão ou palavra-chave

**Contribuição Open Source**
- [ ] **OSS-01**: Documentação clara para contribuidores no GitHub (CONTRIBUTING.md, CODE_OF_CONDUCT)
- [ ] **OSS-02**: Pipeline de CI/CD aberto e reproduzível
- [ ] **OSS-03**: Vault Obsidian público (via Obsidian Publish) com decisões, specs e contexto do projeto

### Out of Scope

- **Feed social / comentários abertos** — risco de virar arena política antes de ter moderação adequada; entra em v2 com regras estruturadas
- **Chat com IA como feature principal** — a IA serve para explicar e resumir, não para ser o produto em si
- **Dados em "tempo real"** — fontes públicas não atualizam instantaneamente; prometer isso é desonesto
- **Dados municipais despadronizados (v1)** — cada prefeitura tem formato diferente; entra depois de provar a tese federal
- **TSE / dados eleitorais (v1)** — camada importante mas não sustenta o MVP de contrato; entra em v2 com módulo político completo
- **Transferegov / emendas (v1)** — entra quando houver página de cidade funcionando
- **Mapa como feature principal** — mapa é camada visual, não fundação; entra depois do sistema de confiança estar sólido
- **Acusações automáticas ou scores de corrupção** — o DeOlho não julga, apenas mostra
- **Dados de pessoa física comum** — apenas pessoas públicas no exercício de função pública
- **Substituição de jornalismo ou fiscalização oficial** — o produto complementa, não substitui

## Context

**Problema central:** Informação pública existe, mas não está acessível. Portais do governo são confusos, dados ficam em PDFs, terminologia é jurídica e sistemas não conversam. O cidadão não deveria precisar de formação técnica para entender o que acontece com dinheiro público.

**Diferencial de posicionamento:** Entre portal de governo (confuso), rede social política (barulhenta) e site partidário (parcial) — o DeOlho é uma ferramenta pública moderna, limpa e séria. Referências visuais: enciclopédia viva + jornalismo de dados premium + sistema público moderno.

**Fontes de dados v1 (em ordem de prioridade):**
1. **PNCP** — base principal para contratos, atas, licitações. API pública sem cadastro.
2. **Portal da Transparência / CGU** — contratos federais, despesas, sanções CEIS/CNEP, licitações. Rate limit crítico: usar dados abertos para carga pesada, API para consulta pontual.
3. **DOU / INLABS** — publicações oficiais em XML para evidência documental. Atualização diária pós-publicação.

**Fontes v2+:** Câmara (deputados, votações, proposições), Senado, Transferegov (convênios, emendas parlamentares), TSE (candidatos, campanha, eleições), portais municipais.

**Fluxo de desenvolvimento:**
- Obsidian vault local → thinking, decisões, mapas mentais, rascunhos de specs
- Vault → .planning/ → GSD transforma em tarefas executáveis
- GitHub → repositório aberto, CI/CD, issues, PRs
- Obsidian Publish → documentação pública do projeto (decisões, ADRs, contexto)
- Agentes de IA (Claude Code + GSD) constroem o código
- O produto final usa agentes internamente para: resumir contratos, explicar termos jurídicos, detectar padrões, sugerir perguntas cívicas

**Usuários v1:**
- **Jornalistas e pesquisadores** — já usam dados públicos, querem ferramenta melhor para investigar
- **Cidadãos engajados** — interesse cívico, sem background técnico, querem entender a cidade
- **Desenvolvedores ativistas** — civic tech, querem contribuir com projeto aberto e robusto

**Cuidados jurídicos e éticos:**
- Separação rigorosa entre pessoa pública em função pública × cidadão comum (dados sensíveis)
- Sinais de atenção sempre com aviso explícito (não implica irregularidade)
- Mecanismo de correção de erros desde o início
- Sem exposição desnecessária de dados pessoais

## Constraints

- **Stack**: Next.js + PostgreSQL — melhor suporte de agentes de IA, ecossistema amplo, TypeScript full-stack
- **Open source**: Licença aberta, repositório público desde o início — decisão de identidade do projeto
- **Idioma**: Português do Brasil em toda a interface e documentação pública
- **Rate limit API**: Portal da Transparência: 90 req/min (dia) / 300 req/min (madrugada) — arquitetura deve usar dados abertos para carga e API para consulta pontual
- **Evidência obrigatória**: Nenhuma afirmação sem fonte documentada — restrição de design que atravessa todo o produto
- **IA responsável**: Modelos de linguagem só podem resumir, explicar e sugerir — nunca afirmar fatos sem evidência da fonte oficial
- **Domínio**: `.deolho.com.br` ou similar — nacional, em português
- **Segurança**: Dados de contratos e empresas são públicos, mas pipeline precisa de proteção contra abuso (rate limiting, autenticação para writes)

## Key Decisions

| Decisão | Rationale | Outcome |
|---------|-----------|---------|
| MVP = Página de Contrato Público (não mapa, chat ou feed) | Contrato conecta dinheiro, empresa, órgão, documento, território — prova toda a tese do produto em uma unidade | — Pending |
| Sistema de confiança é a fundação, não a UI | Qualquer interface elegante em cima de dados sem grau de confiança é confusão disfarçada | — Pending |
| PNCP como primeira fonte de dados | API pública, sem cadastro, cobre contratos federais — menor atrito para o MVP | — Pending |
| Next.js + PostgreSQL | Melhor suporte de agentes de IA, TypeScript full-stack, ecossistema amplo para civic tech | — Pending |
| Obsidian vault → .planning/ → GSD (não Obsidian como repositório central) | GSD precisa de controle de versão git; Obsidian é camada de thinking, não de execução | — Pending |
| Agentes constroem o código E o produto usa agentes internamente | Projeto nasce AI-native em ambas as camadas: desenvolvimento e produto | — Pending |
| Público-alvo amplo desde v1 (jornalistas + cidadãos + devs) | Não sacrificar profundidade por simplicidade nem vice-versa — três perfis têm necessidades complementares | — Pending |
| Sem comentários abertos em v1 | Risco de desinformação e perseguição antes de moderação madura — comunidade estruturada vem depois | — Pending |
| Separar pessoa pública × cidadão comum desde a arquitetura | Obrigação jurídica e ética — não é feature opcional | — Pending |

## Evolution

Este documento evolui a cada transição de fase e milestone.

**Após cada fase (via `/gsd:discuss-phase`):**
1. Requisitos invalidados? → Mover para Out of Scope com motivo
2. Requisitos validados? → Mover para Validated com referência da fase
3. Novos requisitos emergiram? → Adicionar em Active
4. Decisões a registrar? → Adicionar em Key Decisions
5. "What This Is" ainda preciso? → Atualizar se derivou

**Após cada milestone (via `/gsd:complete-milestone`):**
1. Revisão completa de todas as seções
2. Core Value check — ainda é a prioridade certa?
3. Auditoria do Out of Scope — motivos ainda válidos?
4. Atualizar Context com estado atual (usuários, feedbacks, métricas)

---
*Last updated: 2026-05-23 após inicialização do projeto*
