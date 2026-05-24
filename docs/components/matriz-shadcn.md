# Matriz shadcn -> DeOlho

Esta matriz orienta como componentes shadcn base devem virar componentes cívicos ou padrões de tela no DeOlho.

| shadcn base | Componente/padrão DeOlho | Regra de uso |
|-------------|---------------------------|--------------|
| `Badge` | `TipoInformacaoBadge`, `ConfiancaBadge`, `FonteBadge` | Badge de dado público sempre tem texto; cor não basta. |
| `Card` | `EventoPublicoCard`, `ContratoCard`, `EntidadeCard`, `SinalAtencaoCard` | Card público precisa mostrar tipo, fonte e confiança quando aplicável. |
| `Avatar` | `EntidadeAvatar` | Não usar foto real em mock; dados sintéticos precisam estar marcados. |
| `Command` | `UniversalCommandSearch` | Busca não é chat; resultado público mostra tipo, fonte e confiança. |
| `Dialog` | Confirmações não destrutivas e detalhes focados | Não usar para confirmação destrutiva; preferir `AlertDialog` quando existir risco. |
| `Drawer` | `ContextualActionDrawer` mobile | Ações contextuais, não post, like ou comentário livre. |
| `Sheet` | Painel de filtros, evidências e navegação auxiliar | Não esconder evidência crítica só no sheet. |
| `Sidebar` | Desktop app shell | Navegação persistente, sem badges sensacionalistas. |
| `Tabs` | Alternância entre grupos equivalentes | Não esconder limitação ou baixa confiança em aba secundária. |
| `Table` | Listas densas verificáveis | Cada linha sensível precisa caminho para fonte/evidência. |
| `Tooltip` | Explicação curta de ícone, confiança ou fonte | Informação essencial precisa existir fora do hover também. |
| `Skeleton` | Loading de cards, listas e painéis | Estrutura deve parecer o conteúdo final. |
| `Alert` | Erro operacional, fonte atrasada, dado incompleto | Não transformar alerta em acusação. |
| `Carousel` | `TerritorialCarousel` | Usar para camadas curtas; não substituir filtro avançado. |
| `Sonner` | Feedback operacional curto | Não usar tom promocional ou alarmista. |

## Decisão rápida

1. A UI mostra dado público?
   - Use componente cívico.
2. A UI só organiza layout ou ação genérica?
   - Use shadcn base.
3. A UI cruza fonte, evidência, confiança ou IA?
   - Componha em `packages/ui/src/components/deolho`.
4. A UI depende de rota, query, banco ou feature?
   - Fica em `apps/web/features` ou `apps/web/components/app-shell`.

## Anti-duplicação

Não criar:

- `TrustBadge` paralelo a `ConfiancaBadge`;
- `SourcePill` paralelo a `FonteBadge`;
- `PublicUpdateCard` paralelo a `EventoPublicoCard`;
- `ContractSummary` paralelo a `ContratoCard`;
- `EvidencePanel` paralelo a `PainelEvidencia`.

Se o nome em inglês vier de exemplo externo, traduza para o vocabulário do DeOlho antes de implementar.
