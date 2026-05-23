# Componentes Base

Componentes base são os blocos shadcn/ui mantidos em `packages/ui/src/components/ui`. Eles devem permanecer próximos da implementação original e não carregar regra de negócio cívica.

| Componente | Uso no DeOlho | Não usar para |
|------------|---------------|---------------|
| `Button` | Ações claras: abrir evidência, acompanhar, exportar, tentar novamente | Estado de dado público sem label |
| `Card` | Contêiner de entidade, evento, contrato, evidência ou limitação | Empilhar cards dentro de cards sem necessidade |
| `Badge` | Base visual para tipo, fonte, confiança e estado | Comunicar risco apenas por cor |
| `Avatar` | Base para `EntidadeAvatar` | Foto real sem fonte e consentimento adequado |
| `Command` | Busca universal e atalhos | Chat principal ou formulário aberto |
| `Drawer` | Ações mobile contextuais | Esconder fonte ou limitação crítica |
| `Sheet` | Painel lateral de filtros, evidências ou navegação | Conteúdo que precisa ser página própria |
| `Sidebar` | Navegação desktop persistente | Navegação mobile principal |
| `Tabs` | Alternar visões equivalentes | Esconder estados críticos |
| `Table` | Dados tabulares verificáveis | Layout de cards editoriais |
| `Tooltip` | Explicar ícones, confiança e fonte | Informação essencial inacessível sem hover |
| `Skeleton` | Carregamento previsível | Substituir estado vazio ou erro |
| `Alert` | Avisos operacionais, fonte atrasada, dado incompleto | Acusação, julgamento ou destaque sensacionalista |
| `Carousel` | Camadas territoriais e grupos horizontais curtos | Feed principal vertical |

## Regras

- Componentes base não devem importar dados de domínio.
- Ajustes globais devem ser feitos por tokens ou wrappers, não por lógica específica de contrato, órgão ou político.
- Se uma tela lida com dado público, componha um componente cívico por cima do componente base.
- Todo componente base exposto em Storybook deve incluir estados de foco, teclado, desabilitado e contraste.

## Storybook

Quando o scaffold existir, os componentes base devem aparecer em `/docs/base-<nome>--docs`, por exemplo:

```text
/?path=/docs/base-button--docs
/?path=/docs/base-card--docs
/?path=/docs/base-badge--docs
```
