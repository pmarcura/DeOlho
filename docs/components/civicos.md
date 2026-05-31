# Componentes Cívicos

Componentes cívicos ficam em `packages/ui/src/components/deolho`. Eles traduzem dados públicos em UI verificável. Devem carregar semântica de tipo, fonte, confiança, evidência e limitação quando aplicável.

## Contrato comum de componente cívico

Todo componente cívico deve documentar e testar:

- estado padrão;
- carregando;
- vazio, quando houver ausência de dado;
- erro operacional;
- dado incompleto;
- fonte atrasada;
- baixa confiança ou verificação pendente, quando aplicável;
- exemplos com dados sintéticos claramente marcados.

Props de domínio persistente não devem ser acopladas diretamente ao banco. Use props de apresentação e tipos de UI.

## TipoInformacaoBadge

| Campo | Definição |
|-------|-----------|
| O que é | Badge que separa fato oficial, explicação por IA, sinal de atenção, notícia, opinião, revisão manual e dado incompleto. |
| Quando usar | Em cards, cabeçalhos, tabelas e resultados de busca que exibem informação pública classificada. |
| Quando não usar | Para decorar UI ou indicar status operacional genérico. |
| Props | `tipo`, `label`, `icone`, `descricao`, `size`, `tone`. |
| Estados | Padrão, desconhecido, revisão pendente, dado incompleto. |
| Exemplo | `tipo="official_fact"` com label `Fato oficial`; `tipo="ai_explanation"` com label `Explicação por IA`. |
| Acessibilidade | O label textual é obrigatório; cor e ícone são reforço. |
| Erros comuns | Usar apenas cor; chamar sinal de atenção de irregularidade. |
| Regras para agentes | Nunca inventar tipo novo sem atualizar tokens e docs. |
| Storybook | `/?path=/docs/deolho-tipoinformacaobadge--docs` |

## ConfiancaBadge

| Campo | Definição |
|-------|-----------|
| O que é | Badge que comunica confiança, revisão, atraso ou contradição da informação. |
| Quando usar | Ao lado de fatos, fontes, campos sensíveis e cards públicos. |
| Quando não usar | Como score moral, ranking ou selo de aprovação política. |
| Props | `nivel`, `label`, `descricao`, `ultimaVerificacao`, `tooltip`. |
| Estados | Fonte oficial, cópia verificada, verificação pendente, fonte atrasada, incompleto, contraditório. |
| Exemplo | `nivel="delayed_source"` com tooltip sobre última coleta. |
| Acessibilidade | Tooltip deve ter texto equivalente visível ou acessível por teclado. |
| Erros comuns | Transformar confiança técnica em julgamento de pessoa ou órgão. |
| Regras para agentes | Sempre explicar o motivo do nível quando não for `official_source`. |
| Storybook | `/?path=/docs/deolho-confiancabadge--docs` |

## FonteBadge

| Campo | Definição |
|-------|-----------|
| O que é | Badge que identifica a origem da informação e, quando disponível, data de coleta. |
| Quando usar | Em todo card ou linha que apresente dado público rastreável. |
| Quando não usar | Para fontes sem origem identificável ou texto de IA sem base. |
| Props | `fonte`, `url`, `dataPublicacao`, `dataColeta`, `estadoFonte`, `isSynthetic`. |
| Estados | Atualizada, atrasada, indisponível, parcial, dados sintéticos. |
| Exemplo | `fonte="PNCP"` e `estadoFonte="fresh"`. |
| Acessibilidade | Link deve ter nome claro: `Abrir fonte PNCP`. |
| Erros comuns | Omitir data de coleta; esconder que o dado é sintético. |
| Regras para agentes | Dados mockados sempre usam `isSynthetic=true`. |
| Storybook | `/?path=/docs/deolho-fontebadge--docs` |

## EntidadeAvatar

| Campo | Definição |
|-------|-----------|
| O que é | Identidade visual compacta para político, empresa, órgão, contrato, obra, lei, documento, território ou tema. |
| Quando usar | Em listas, cards, cabeçalhos e busca. |
| Quando não usar | Para foto real sem fonte, licença e contexto. |
| Props | `tipo`, `nome`, `sigla`, `imagemUrl`, `isSynthetic`, `size`. |
| Estados | Com imagem, sem imagem, sintético, carregando. |
| Exemplo | Avatar com ícone de órgão e label `Órgão sintético`. |
| Acessibilidade | `alt` deve descrever entidade e tipo. |
| Erros comuns | Usar imagem partidária como decoração. |
| Regras para agentes | Preferir ícones/tokens até existir pipeline de mídia confiável. |
| Storybook | `/?path=/docs/deolho-entidadeavatar--docs` |

## EntidadeCard

| Campo | Definição |
|-------|-----------|
| O que é | Card de navegação para uma página de entidade. |
| Quando usar | Explorar entidades, resultados de busca e blocos relacionados. |
| Quando não usar | Para evento público temporal ou contrato detalhado. |
| Props | `entidade`, `tipo`, `subtitulo`, `fonte`, `confianca`, `href`, `acoes`. |
| Estados | Padrão, carregando, vazio, fonte atrasada, dado incompleto. |
| Exemplo | Empresa sintética com `FonteBadge` e `ConfiancaBadge`. |
| Acessibilidade | Card clicável deve ter foco visível e nome acessível único. |
| Erros comuns | Card sem fonte; card inteiro clicável com botões internos ambíguos. |
| Regras para agentes | Sempre mostrar tipo da entidade antes de relações sensíveis. |
| Storybook | `/?path=/docs/deolho-entidadecard--docs` |

## EventoPublicoCard

| Campo | Definição |
|-------|-----------|
| O que é | Unidade principal do radar de mudanças públicas. |
| Quando usar | Mudanças oficiais, atualizações de entidade, publicação, alteração, limitação ou revisão. |
| Quando não usar | Como post social, opinião aberta ou denúncia. |
| Props | `tipoEvento`, `titulo`, `resumo`, `entidades`, `timestamp`, `fonte`, `confianca`, `evidencias`, `acoes`. |
| Estados | Padrão, carregando, vazio, erro, fonte atrasada, dado incompleto, contraditório. |
| Exemplo | `Contrato sintético atualizado na fonte oficial`. |
| Acessibilidade | Ordem de leitura: tipo, título, resumo, fonte, ações. |
| Erros comuns | Usar linguagem acusatória; esconder limitações no rodapé. |
| Regras para agentes | Não chamar de post, like, comentário ou feed social. |
| Storybook | `/?path=/docs/deolho-eventopublicocard--docs` |

## ContratoCard

| Campo | Definição |
|-------|-----------|
| O que é | Card especializado para resumo verificável de contrato. |
| Quando usar | Listas de contratos, busca e entidades relacionadas. |
| Quando não usar | Para substituir a página completa do contrato. |
| Props | `id`, `objeto`, `valor`, `orgao`, `empresa`, `status`, `fonte`, `confianca`, `limitacoes`, `href`. |
| Estados | Padrão, carregando, erro, valor ausente, fonte atrasada, payload parcial. |
| Exemplo | Contrato sintético com objeto, órgão, empresa e `Dados sintéticos`. |
| Acessibilidade | Valores monetários devem ter texto completo, não só abreviação visual. |
| Erros comuns | Inferir irregularidade por valor; esconder campos ausentes. |
| Regras para agentes | Se a fonte não informa empresa, mostrar limitação. |
| Storybook | `/?path=/docs/deolho-contratocard--docs` |

## PerfilEntidadeHeader

| Campo | Definição |
|-------|-----------|
| O que é | Cabeçalho da página de entidade com identidade, tipo, confiança e ações. |
| Quando usar | Páginas de político, empresa, órgão, cidade, contrato, obra, lei, documento, tema ou território. |
| Quando não usar | Para cards compactos ou modais de ação. |
| Props | `entidade`, `tipo`, `descricaoCurta`, `badges`, `acoes`, `ultimaAtualizacao`. |
| Estados | Padrão, carregando, sem descrição, fonte atrasada, revisão pendente. |
| Exemplo | Órgão sintético com ações `Acompanhar` e `Ver evidências`. |
| Acessibilidade | Título da página deve ser `h1`; ações precisam de labels claros. |
| Erros comuns | Usar slogan, foto partidária ou resumo sem fonte. |
| Regras para agentes | Header não deve declarar reputação, moralidade ou suspeita. |
| Storybook | `/?path=/docs/deolho-perfilentidadeheader--docs` |

## PainelEvidencia

| Campo | Definição |
|-------|-----------|
| O que é | Painel lateral ou drawer que reúne documentos, links, datas e limitações. |
| Quando usar | Desktop à direita, mobile em drawer ou sheet. |
| Quando não usar | Como local escondido para única fonte de uma afirmação crítica. |
| Props | `evidencias`, `fontePrincipal`, `limitacoes`, `estadoFonte`, `onOpenDocumento`. |
| Estados | Com evidências, vazio, fonte indisponível, fonte atrasada, erro de carregamento. |
| Exemplo | Lista de links sintéticos para documento oficial simulado. |
| Acessibilidade | Deve ser navegável por teclado e anunciar abertura/fechamento. |
| Erros comuns | Colocar evidência somente em tooltip. |
| Regras para agentes | Se não há evidência, mostrar o motivo e reduzir força da afirmação. |
| Storybook | `/?path=/docs/deolho-painelevidencia--docs` |

## EvidenciaLink

| Campo | Definição |
|-------|-----------|
| O que é | Link estruturado para documento, base, publicação ou payload. |
| Quando usar | Dentro de cards, painel de evidência, timeline e tabelas. |
| Quando não usar | Para link genérico sem fonte identificada. |
| Props | `titulo`, `fonte`, `url`, `tipoDocumento`, `dataPublicacao`, `dataColeta`, `estado`. |
| Estados | Disponível, indisponível, atrasado, parcial, sintético. |
| Exemplo | `Abrir publicação sintética no PNCP`. |
| Acessibilidade | Texto do link deve explicar destino e fonte. |
| Erros comuns | Usar `clique aqui`; omitir data de coleta. |
| Regras para agentes | Link quebrado exige estado indisponível, não silêncio. |
| Storybook | `/?path=/docs/deolho-evidencialink--docs` |

## BlocoExplicacaoIA

| Campo | Definição |
|-------|-----------|
| O que é | Bloco visual para explicação gerada por IA a partir de fontes conhecidas. |
| Quando usar | Resumos em português simples, explicação de termos e perguntas cívicas. |
| Quando não usar | Para fato oficial, acusação, inferência sem fonte ou decisão pública. |
| Props | `texto`, `titulo`, `fontesUsadas`, `geradoEm`, `meta`, `limitacoes`, `className`. |
| Estados | Padrão, carregando, sem fontes suficientes, erro, revisão pendente. |
| Exemplo | `Explicação gerada a partir dos campos oficiais disponíveis.` |
| Acessibilidade | Label `Explicação por IA` deve aparecer antes do texto. |
| Erros comuns | Usar tom oficial; omitir fontes usadas. |
| Regras para agentes | Se faltar fonte, o bloco deve recusar ou declarar limitação. |
| Storybook | `/?path=/docs/deolho-blocoexplicacaoia--docs` |

## BlocoLimitacaoDado

| Campo | Definição |
|-------|-----------|
| O que é | Bloco que comunica lacunas, atrasos e limites da fonte. |
| Quando usar | Sempre que campo importante estiver ausente, atrasado, parcial ou indisponível. |
| Quando não usar | Para esconder falha irrelevante ou substituir erro operacional. |
| Props | `tipo`, `mensagem`, `campoAfetado`, `fonte`, `ultimaTentativa`, `acao`. |
| Estados | Dado ausente, fonte atrasada, fonte indisponível, campo contraditório. |
| Exemplo | `A fonte não informa o território impactado.` |
| Acessibilidade | Deve ser lido como aviso, sem depender de cor. |
| Erros comuns | Escrever como culpa da entidade; usar linguagem vaga. |
| Regras para agentes | Limitação deve dizer o que falta e de onde vem a lacuna. |
| Storybook | `/?path=/docs/deolho-blocolimitacaodado--docs` |

## SinalAtencaoCard

| Campo | Definição |
|-------|-----------|
| O que é | Card discreto para sinal estatístico ou condição que merece verificação. |
| Quando usar | Padrões incomuns, divergências, ausência de informação ou mudança relevante. |
| Quando não usar | Para acusação, ranking, score de corrupção ou denúncia. |
| Props | `titulo`, `descricao`, `metodo`, `evidencias`, `limitacoes`, `severidadeVisual`. |
| Estados | Padrão, baixa confiança, revisão pendente, contraditório, fonte atrasada. |
| Exemplo | `Valor acima da mediana em amostra sintética`, com aviso obrigatório. |
| Acessibilidade | Aviso `Sinal de atenção não indica irregularidade` deve estar no corpo do card. |
| Erros comuns | Usar vermelho como culpa; omitir método e limitação. |
| Regras para agentes | Não publicar sinal sem método, evidência e limitação. |
| Storybook | `/?path=/docs/deolho-sinalatencaocard--docs` |

## TerritorialCarousel

| Campo | Definição |
|-------|-----------|
| O que é | Carrossel horizontal para camadas territoriais e temáticas. |
| Quando usar | Home, radar, explorar e páginas territoriais. |
| Quando não usar | Para navegação principal permanente ou listas longas. |
| Props | `items`, `selectedId`, `onSelect`, `ariaLabel`, `estadoFonte`. |
| Estados | Padrão, carregando, vazio, seleção atual, fonte atrasada. |
| Exemplo | `Brasil`, `SP sintético`, `Cidade sintética`, `Saúde`. |
| Acessibilidade | Deve funcionar com teclado e anunciar item selecionado. |
| Erros comuns | Esconder filtros essenciais apenas no carrossel. |
| Regras para agentes | Territórios sintéticos devem estar marcados. |
| Storybook | `/?path=/docs/deolho-territorialcarousel--docs` |

## MobileBottomNav

| Campo | Definição |
|-------|-----------|
| O que é | Navegação inferior mobile para rotas principais. |
| Quando usar | `apps/web` em viewport mobile. |
| Quando não usar | Desktop ou páginas que exigem foco total, salvo retorno claro. |
| Props | `items`, `activeHref`, `onNavigate`, `plusAction`. |
| Estados | Ativo, inativo, desabilitado, rota indisponível. |
| Exemplo | `Início`, `Radar`, `+`, `Explorar`, `Mapa`. |
| Acessibilidade | Área de toque adequada e label textual para ícones. |
| Erros comuns | Criar abas sociais ou ações de curtida. |
| Regras para agentes | O item `+` abre ações contextuais, não criação de post. |
| Storybook | `/?path=/docs/deolho-mobilebottomnav--docs` |

## FloatingActionButton

| Campo | Definição |
|-------|-----------|
| O que é | Botão `+` contextual para ações permitidas. |
| Quando usar | Ações rápidas: acompanhar, corrigir erro, contribuir contexto, exportar, citar. |
| Quando não usar | Criar post, denúncia livre ou comentário aberto. |
| Props | `actions`, `contexto`, `label`, `onOpen`. |
| Estados | Padrão, aberto, sem ações, desabilitado. |
| Exemplo | Em contrato: `Citar página`, `Exportar JSON`, `Reportar erro`. |
| Acessibilidade | Deve ter label acessível específico, não apenas `+`. |
| Erros comuns | Ação destrutiva sem confirmação; ação social genérica. |
| Regras para agentes | A lista de ações depende da rota e deve ser auditável. |
| Storybook | `/?path=/docs/deolho-floatingactionbutton--docs` |

## ContextualActionDrawer

| Campo | Definição |
|-------|-----------|
| O que é | Drawer mobile que detalha ações contextuais. |
| Quando usar | Ao tocar no botão `+` ou em ação secundária mobile. |
| Quando não usar | Para esconder navegação primária ou formulário longo. |
| Props | `open`, `contexto`, `actions`, `onOpenChange`, `descricao`. |
| Estados | Aberto, fechado, carregando ações, sem ações, erro. |
| Exemplo | Drawer de contrato com ações de exportação e evidência. |
| Acessibilidade | Foco deve ficar preso no drawer e voltar ao acionador ao fechar. |
| Erros comuns | Permitir comentário livre; misturar ação cívica com entretenimento. |
| Regras para agentes | Ações sensíveis precisam explicar consequência antes de continuar. |
| Storybook | `/?path=/docs/deolho-contextualactiondrawer--docs` |

## ReacaoCivica

| Campo | Definição |
|-------|-----------|
| O que é | Controle de reação estruturada para objetos públicos verificáveis. |
| Quando usar | Evento público, contrato, ato, documento ou página de entidade que admita opinião de usuário sem confundir com fato. |
| Quando não usar | Em pessoa física comum, pessoa pública como alvo individual, sinal de culpa, ranking ou julgamento moral. |
| Props | `contagem`, `className`; enum fechado: `apoio`, `parcial`, `contra`, `faltou_informacao`. |
| Estados | Sem reação, reação selecionada, contagem local, persistência pendente. |
| Exemplo | Usuário marca `faltou_informacao` em um contrato com evidência incompleta. |
| Acessibilidade | Botões com `aria-pressed`, label textual e ícone; não depender só de cor. |
| Erros comuns | Tratar reação como evidência; permitir reações em pessoas; usar como ranking de suspeita. |
| Regras para agentes | Reações são opinião de usuário e devem ser visualmente separadas de fonte/confiança. |
| Storybook | Futuro `/?path=/docs/deolho-reacaocivica--docs` |

## ContribuicaoContextual

| Campo | Definição |
|-------|-----------|
| O que é | Comentário curto e moderado, vinculado a evento, entidade ou evidência. |
| Quando usar | Para pergunta, contexto local ou correção com fonte indicada. |
| Quando não usar | Debate livre, acusação, denúncia sem fonte ou exposição de dado pessoal sensível. |
| Props | `contexto`, `texto`, `fonteOpcional`, `status`, `moderacao`. |
| Estados | Rascunho, pendente, aprovado, rejeitado, removido por moderação. |
| Exemplo | `A fonte municipal não informa a escola atendida; alguém encontrou documento complementar?` |
| Acessibilidade | Campo com limite claro de caracteres, erro legível e confirmação de envio. |
| Erros comuns | Publicar automaticamente; confundir contribuição com fato oficial. |
| Regras para agentes | Estado inicial público persistente deve ser `pending`; nada vira visível sem moderação. |
| Storybook | Futuro `/?path=/docs/deolho-contribuicaocontextual--docs` |

## UniversalCommandSearch

| Campo | Definição |
|-------|-----------|
| O que é | Busca universal baseada em Command para entidades, contratos, cidades, documentos e temas. |
| Quando usar | Top search, atalho de teclado e busca mobile. |
| Quando não usar | Como chat de IA ou formulário de denúncia. |
| Props | `query`, `results`, `groups`, `loading`, `onSearch`, `onSelect`. |
| Estados | Inicial, digitando, carregando, sem resultados, erro, resultados com fonte atrasada. |
| Exemplo | Resultado sintético de contrato com tipo, fonte e confiança. |
| Acessibilidade | Suportar teclado, `aria-expanded`, item ativo e anúncio de resultados. |
| Erros comuns | Retornar resultado sem tipo/fonte; ranquear moralmente pessoas. |
| Regras para agentes | Resultado público precisa mostrar tipo, fonte e confiança quando aplicável. |
| Storybook | `/?path=/docs/deolho-universalcommandsearch--docs` |
