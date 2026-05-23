# Padrões de Tela

Cada padrão de tela deve ser implementado primeiro com dados sintéticos marcados. Dados reais entram apenas depois de fonte, evidência, confiança e limitação existirem no modelo.

## Home

| Campo | Diretriz |
|-------|----------|
| Objetivo | Apresentar radar de mudanças públicas, atalhos territoriais e entidades relevantes sem parecer rede social. |
| Usuário principal | Cidadão interessado em entender o que mudou em seu território ou tema. |
| Layout desktop | Sidebar, top search, coluna principal com radar, painel lateral de evidências quando ativo. |
| Layout mobile | Top bar curta, carrossel territorial, lista vertical de eventos, bottom navigation e botão `+`. |
| Componentes usados | `TerritorialCarousel`, `EventoPublicoCard`, `EntidadeCard`, `UniversalCommandSearch`, `MobileBottomNav`, `FloatingActionButton`. |
| Estados obrigatórios | Carregando, vazio, erro, fonte atrasada, dado incompleto. |
| O que não fazer | Hero marketing, feed de posts, curtidas, comentários livres, ranking moral. |
| Checklist de PR | Mostra dados sintéticos; cada card tem tipo/fonte/confiança; mobile não depende de hover; estados estão implementados. |

## Radar de mudanças públicas

| Campo | Diretriz |
|-------|----------|
| Objetivo | Listar eventos públicos e atualizações verificáveis por território, fonte e tipo. |
| Usuário principal | Cidadão, jornalista, pesquisador ou contribuidor que acompanha mudanças. |
| Layout desktop | Filtros à esquerda ou topo, lista central, painel de evidências à direita. |
| Layout mobile | Filtros compactos, carrossel territorial, cards em lista única. |
| Componentes usados | `EventoPublicoCard`, `TipoInformacaoBadge`, `FonteBadge`, `ConfiancaBadge`, `PainelEvidencia`, `Tabs`. |
| Estados obrigatórios | Carregando, sem eventos, erro de fonte, fonte atrasada, contraditório. |
| O que não fazer | Chamar evento de post; ordenar por suspeita; usar linguagem de denúncia. |
| Checklist de PR | Filtros preservam contexto; cards têm evidência; sinais usam aviso obrigatório. |

## Página de entidade

| Campo | Diretriz |
|-------|----------|
| Objetivo | Reunir fatos, relações, eventos e limitações sobre uma entidade verificável. |
| Usuário principal | Usuário que quer entender uma empresa, órgão, político, cidade, documento, lei, obra ou tema. |
| Layout desktop | Header, blocos de fatos, radar da entidade e painel de evidência lateral. |
| Layout mobile | Header compacto, abas ou seções verticais, drawer de ações e evidências. |
| Componentes usados | `PerfilEntidadeHeader`, `EntidadeAvatar`, `EntidadeCard`, `EventoPublicoCard`, `PainelEvidencia`, `BlocoLimitacaoDado`. |
| Estados obrigatórios | Carregando, entidade sem dados, erro, revisão pendente, fonte atrasada. |
| O que não fazer | Declarar reputação, confiança moral, ideologia ou suspeita. |
| Checklist de PR | Título é neutro; relações têm fonte; IA aparece separada; limitações aparecem antes de conclusões. |

## Página de contrato

| Campo | Diretriz |
|-------|----------|
| Objetivo | Transformar contrato público em página viva com dados essenciais, fonte, evidência, limitações e timeline. |
| Usuário principal | Cidadão, jornalista, pesquisador ou fiscal social. |
| Layout desktop | Resumo verificável, campos principais, timeline, evidências à direita. |
| Layout mobile | Resumo, badges, seções colapsáveis, botão contextual para evidência/exportação. |
| Componentes usados | `ContratoCard`, `EvidenciaLink`, `PainelEvidencia`, `BlocoExplicacaoIA`, `BlocoLimitacaoDado`, `SinalAtencaoCard`. |
| Estados obrigatórios | Carregando, contrato não encontrado, payload parcial, fonte atrasada, campo contraditório. |
| O que não fazer | Inferir irregularidade por valor, fornecedor, prazo ou órgão. |
| Checklist de PR | Campos têm fonte; resumo IA cita base usada; export preserva metadados; sinais têm método e aviso. |

## Página de empresa

| Campo | Diretriz |
|-------|----------|
| Objetivo | Mostrar contratos, órgãos relacionados, documentos e eventos vinculados a uma empresa. |
| Usuário principal | Usuário que pesquisa relação empresa-poder público. |
| Layout desktop | Header de entidade, métricas descritivas, contratos, eventos e evidências. |
| Layout mobile | Header compacto, contratos em cards, ações em drawer. |
| Componentes usados | `PerfilEntidadeHeader`, `ContratoCard`, `EventoPublicoCard`, `SinalAtencaoCard`, `PainelEvidencia`. |
| Estados obrigatórios | Sem contratos, fonte incompleta, revisão pendente, baixa confiança. |
| O que não fazer | Criar ranking de empresa suspeita ou score de risco. |
| Checklist de PR | Relações são documentadas; ausência de dado é explícita; sinais não acusam. |

## Página de político

| Campo | Diretriz |
|-------|----------|
| Objetivo | Apresentar atuação pública verificável sem virar perfil social ou campanha. |
| Usuário principal | Cidadão acompanhando mandato, votação, documentos ou relações públicas. |
| Layout desktop | Header neutro, fatos oficiais, eventos, documentos e evidências. |
| Layout mobile | Resumo curto, tabs por tipo de dado, evidência em drawer. |
| Componentes usados | `PerfilEntidadeHeader`, `TipoInformacaoBadge`, `EventoPublicoCard`, `EvidenciaLink`, `BlocoLimitacaoDado`. |
| Estados obrigatórios | Sem dados, fonte atrasada, revisão manual, contraditório. |
| O que não fazer | Ranking moral, tom partidário, foto de campanha como decoração, acusação automática. |
| Checklist de PR | Linguagem neutra; cada fato tem fonte; opinião de usuário não aparece como fato. |

## Página de cidade

| Campo | Diretriz |
|-------|----------|
| Objetivo | Organizar dados públicos por território, temas, órgãos, contratos e eventos. |
| Usuário principal | Morador, pesquisador local ou jornalista. |
| Layout desktop | Header territorial, carrossel de temas, radar local e entidades relacionadas. |
| Layout mobile | Território no topo, filtros horizontais e radar vertical. |
| Componentes usados | `TerritorialCarousel`, `EventoPublicoCard`, `EntidadeCard`, `ContratoCard`, `FonteBadge`. |
| Estados obrigatórios | Cidade sem dados, fonte local atrasada, dado parcial, erro de busca. |
| O que não fazer | Comparar cidades como ranking moral ou partidário. |
| Checklist de PR | Território está claro; dados sintéticos marcados; filtros não escondem fonte. |

## Busca universal

| Campo | Diretriz |
|-------|----------|
| Objetivo | Encontrar entidades, contratos, cidades, documentos e temas com contexto mínimo de confiança. |
| Usuário principal | Qualquer usuário procurando uma informação pública. |
| Layout desktop | Command search aberto pelo topo ou atalho. |
| Layout mobile | Campo no topo e command em tela cheia ou drawer. |
| Componentes usados | `UniversalCommandSearch`, `TipoInformacaoBadge`, `FonteBadge`, `ConfiancaBadge`, `Skeleton`. |
| Estados obrigatórios | Inicial, carregando, sem resultados, erro, resultados com fonte atrasada. |
| O que não fazer | Chat principal, busca que ranqueia suspeita, resultado sem tipo/fonte. |
| Checklist de PR | Resultado tem tipo; dados públicos têm fonte; teclado funciona; vazio é útil. |

## Painel de fonte

| Campo | Diretriz |
|-------|----------|
| Objetivo | Explicar origem, coleta, publicação, limitações e evidências de uma informação. |
| Usuário principal | Usuário validando uma afirmação. |
| Layout desktop | Aside persistente ou sheet lateral. |
| Layout mobile | Drawer acionado por `Ver evidência`. |
| Componentes usados | `PainelEvidencia`, `EvidenciaLink`, `BlocoLimitacaoDado`, `Table`. |
| Estados obrigatórios | Sem evidência, fonte indisponível, atrasada, parcial, erro. |
| O que não fazer | Esconder link oficial; depender de tooltip; misturar IA como fonte. |
| Checklist de PR | Datas estão visíveis; links têm labels; limitações explicam impacto. |

## Página de erro

| Campo | Diretriz |
|-------|----------|
| Objetivo | Informar falha operacional sem transformar erro técnico em problema da fonte ou entidade. |
| Usuário principal | Qualquer usuário impactado por falha. |
| Layout desktop | Mensagem curta, ação de tentar novamente, link para início e contexto técnico mínimo. |
| Layout mobile | Mesma informação em bloco simples e acionável. |
| Componentes usados | `Alert`, `Button`, `EvidenciaLink` quando houver origem da falha. |
| Estados obrigatórios | Erro temporário, erro persistente, sem permissão. |
| O que não fazer | Culpar fonte pública sem evidência; expor stack trace ao usuário final. |
| Checklist de PR | Mensagem é clara; ação existe; logs técnicos ficam fora da UI pública. |

## Página sem dados

| Campo | Diretriz |
|-------|----------|
| Objetivo | Explicar ausência de dados e oferecer próximos passos verificáveis. |
| Usuário principal | Usuário buscando algo ainda não coletado ou sem fonte disponível. |
| Layout desktop | Estado vazio com explicação, filtros alternativos e link para metodologia. |
| Layout mobile | Mensagem compacta, ação principal e filtros reduzidos. |
| Componentes usados | `BlocoLimitacaoDado`, `Button`, `UniversalCommandSearch`, `TerritorialCarousel`. |
| Estados obrigatórios | Sem coleta, fonte não informa, filtro sem resultado, permissão insuficiente. |
| O que não fazer | Sugerir que ausência implica irregularidade. |
| Checklist de PR | Ausência é neutra; fonte/escopo estão claros; alternativa de navegação existe. |
