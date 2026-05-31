# ADR: Grafo de Conexões Cívicas

Data: 2026-05-30

## Status

Proposta para M0. Decisão recomendada: **manter PostgreSQL como fonte canônica e criar um read model de grafo antes de avaliar Neo4j em produção**.

## Contexto

O DeOlho já possui os blocos centrais de grafo:

- nós canônicos em `entities`;
- arestas documentadas em `entity_relationships`;
- evidências em `evidence`;
- eventos públicos em `civic_events`.

O objetivo de produto é visualizar Estado, órgãos, empresas, agentes públicos, contratos, sanções e vínculos documentados como rede de conexões. O risco central é transformar proximidade visual em acusação. Toda aresta pública precisa carregar fonte, evidência, confiança e limitação.

## Opções Avaliadas

### Opção A: PostgreSQL + read model de grafo

Usar o PostgreSQL atual como fonte de verdade e expor um contrato `GraphNode`/`GraphEdge` para a UI. Consultas de vizinhança usam joins e, quando necessário, CTEs recursivas. A visualização pode ser implementada no front com biblioteca dedicada depois da M0.

Vantagens:

- sem nova infraestrutura;
- preserva a proveniência já modelada;
- menor risco de divergência entre banco relacional e grafo;
- suficiente para vizinhança de 1-2 saltos e exploração territorial inicial.

Custos:

- consultas profundas e algoritmos de grafo ficam menos naturais;
- precisa cuidar de limites para não renderizar redes grandes demais.

### Opção B: Neo4j paralelo

Adicionar Neo4j como índice de grafo sincronizado a partir do PostgreSQL. Neo4j usa modelo de grafo de propriedades e Cypher, que é uma linguagem própria para padrões de nós e relacionamentos.

Vantagens:

- consultas de caminho e padrões complexos ficam mais diretas;
- bom encaixe futuro para investigação de múltiplos saltos;
- pode viabilizar analytics de rede mais sofisticado.

Custos:

- nova infraestrutura, backup e observabilidade;
- risco de divergência com a fonte canônica;
- precisa de pipeline de sincronização idempotente e auditável;
- aumenta a superfície operacional antes de validar a experiência.

### Opção C: Híbrido evolutivo

Começar com read model em PostgreSQL e só promover Neo4j quando houver necessidade comprovada: latência ruim, consultas de caminhos complexos, analytics de rede recorrente ou volume que torne o read model insuficiente.

Vantagens:

- entrega UX de grafo rapidamente sem travar a arquitetura;
- preserva a opção Neo4j com contrato de dados estável;
- permite medir antes de adicionar custo.

Custos:

- exige disciplina para manter o contrato `GraphNode`/`GraphEdge` independente do backend;
- pode haver retrabalho no índice se o produto exigir Neo4j depois.

## Decisão

Adotar a **Opção C**.

M0 não adiciona Neo4j. A próxima entrega deve criar um endpoint/read model em PostgreSQL que produza:

```ts
type GraphNode = {
  id: string;
  tipo: "empresa" | "orgao" | "unidade_orgao" | "pessoa_publica" | "contrato" | "territorio" | "tema";
  label: string;
  href: string;
  fonte?: { id: string; estado?: string };
  confianca?: string;
  media?: { imagemUrl?: string; alt?: string; credito?: string };
};

type GraphEdge = {
  id: string;
  from: string;
  to: string;
  tipo: string;
  label: string;
  fonte: { id: string; url?: string };
  confianca: string;
  evidenciaHref?: string;
  pesoVisual?: number;
  aviso?: "Sinal de atenção não indica irregularidade";
};
```

## Regras de Produto

- Aresta sem evidência não entra no grafo público.
- Vínculo por sobrenome, proximidade visual ou inferência heurística não vira aresta pública.
- Termos como nepotismo ou conflito de interesse só aparecem após regra objetiva documentada ou revisão manual. Antes disso, usar “vínculo documentado” ou “sinal de atenção”.
- O grafo deve começar com 1 salto e expansão controlada. Não renderizar rede completa por padrão.
- Cada edge precisa permitir voltar à fonte ou ao evento que a sustenta.

## Wire Textual para `/explorar`

```text
[Header]
Mapa de conexões documentadas
Busca: empresa, órgão, agente público, contrato ou tema
Aviso: conexões mostram vínculos documentados; não indicam irregularidade.

[Filtros]
Território | Tipo de nó | Tipo de vínculo | Fonte | Confiança

[Visualização]
Grafo compacto com nó raiz e vizinhos de 1 salto
Cada aresta tem label curto e abre PainelEvidencia

[Lista acessível]
Órgão A -- fornecedor documentado --> Empresa B
Fonte: PNCP | Confiança: Fonte oficial | Ver evidência

[Estados]
Sem relações: "Nenhum vínculo documentado encontrado para estes filtros."
Fonte parcial: mostrar limitação antes do grafo.
```

## Próxima Issue Recomendada

Criar `/explorar` como “Mapa de conexões” usando PostgreSQL:

1. Read model `getGraphSnapshot({ territory, rootEntityId, depth })`.
2. UI com lista + grafo compacto: nós, arestas, filtros por tipo e painel de evidência.
3. Limites: depth inicial 1, máximo 150 nós e 300 arestas.
4. Estado vazio explicando ausência de relações sem sugerir irregularidade.

## Referências

- Neo4j Cypher docs: https://neo4j.com/docs/cypher/
- PostgreSQL CTE/recursive queries: https://www.postgresql.org/docs/17/queries-with.html
- Cytoscape.js docs: https://js.cytoscape.org/
