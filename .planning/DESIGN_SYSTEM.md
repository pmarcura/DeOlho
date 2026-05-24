# Design System DeOlho

Fundação de UI para uma experiência social-cívica moderna com shadcn/ui. A referência de familiaridade é a navegação fluida de apps sociais mobile-first, mas o DeOlho não é rede social: a unidade principal é **evento público** ou **atualização de entidade**, sempre orientada por evidência, fonte e confiança.

## Documentação operacional

Este arquivo registra a direção de produto e arquitetura do design system. A documentação pública e operacional fica em:

- `docs/design-system/index.md`
- `docs/design-system/referencias.md`
- `docs/components/base.md`
- `docs/components/civicos.md`
- `docs/patterns/telas.md`
- `docs/patterns/navegacao.md`
- `docs/patterns/estados.md`
- `docs/patterns/conteudo-linguagem.md`
- `docs/patterns/acessibilidade.md`
- `docs/agents/regras.md`
- `docs/agents/checklist-pr-ui.md`
- `apps/docs/index.html`

Agentes devem consultar esses arquivos antes de alterar UI, componentes, navegação ou linguagem.

## Vocabulário de produto

| Evitar | Usar |
|--------|-----|
| post | evento público |
| perfil | página de entidade |
| like | reação estruturada |
| comentário | contribuição contextual |
| seguir | acompanhar |
| feed | radar de mudanças públicas |
| stories | atualizações recentes |
| explorar | navegar por entidades |

## Estrutura de pastas recomendada

```text
apps/
  web/
    app/
      page.tsx
      explorar/page.tsx
      radar/page.tsx
      mapa/page.tsx
      entidade/[tipo]/[slug]/page.tsx
      contrato/[id]/page.tsx
      cidade/[slug]/page.tsx
    components/
      app-shell/
        app-shell.tsx
        desktop-sidebar.tsx
        mobile-bottom-nav.tsx
        top-search-bar.tsx
        evidence-aside.tsx
    features/
      radar/
      entidades/
      contratos/
      cidades/
      evidencias/
      busca/
packages/
  ui/
    src/
      components/
        ui/
        deolho/
      lib/
        cn.ts
      tokens/
        colors.ts
        information-types.ts
        trust-levels.ts
      index.ts
```

## Componentes shadcn base

Instalar no scaffold técnico dentro de `packages/ui/src/components/ui`:

- `avatar`
- `badge`
- `button`
- `card`
- `carousel`
- `command`
- `dialog`
- `drawer`
- `dropdown-menu`
- `hover-card`
- `input`
- `popover`
- `scroll-area`
- `sheet`
- `sidebar`
- `skeleton`
- `tabs`
- `table`
- `tooltip`
- `sonner`

Os componentes base devem ficar o mais próximos possível do shadcn original. Customização de produto deve entrar em `components/deolho`, não diretamente no componente base, salvo ajuste de token ou acessibilidade.

## Componentes cívicos próprios

Criar em `packages/ui/src/components/deolho`:

1. `TipoInformacaoBadge`
   - Exibe `fato oficial`, `explicação`, `sinal de atenção`, `notícia`, `opinião`, `dado incompleto`.
   - Nunca usa cor como único indicador; combinar label e ícone.

2. `ConfiancaBadge`
   - Exibe estado como `fonte oficial`, `explicação IA`, `fonte atrasada`, `incompleto`, `verificação pendente`.
   - Deve aceitar descrição curta para tooltip.

3. `FonteBadge`
   - Exibe fonte: `PNCP`, `Portal da Transparência`, `DOU`, `Câmara`, `Senado`, `Fonte local`, `Dados sintéticos`.
   - Deve indicar data de coleta quando disponível.

4. `EntidadeAvatar`
   - Avatar por tipo de entidade: político, empresa, órgão, contrato, obra, lei, documento, território, tema.
   - Não usar foto real em dados sintéticos.

5. `EntidadeCard`
   - Card compacto para navegar por entidade.
   - Deve mostrar tipo, nome, subtítulo, fonte e confiança quando aplicável.

6. `EventoPublicoCard`
   - Unidade principal do radar.
   - Deve mostrar tipo de evento, entidade afetada, resumo neutro, timestamp, fonte, confiança e ação de evidência.

7. `ContratoCard`
   - Card especializado para contrato: objeto, valor sintético, órgão, empresa, status, fonte e limitações.

8. `PerfilEntidadeHeader`
   - Cabeçalho da página de entidade com identidade, tipo, ações de acompanhar, contribuição contextual e painel de confiança.

9. `PainelEvidencia`
   - Painel lateral ou drawer com documentos, links oficiais, datas e limitações.

10. `EvidenciaLink`
    - Link para documento/base com fonte, data, tipo e aviso de disponibilidade.

11. `BlocoExplicacaoIA`
    - Bloco visualmente separado para explicações de IA.
    - Sempre rotulado como explicação, nunca como fato oficial.

12. `BlocoLimitacaoDado`
    - Mostra lacunas: `a fonte não informa X`, `fonte atrasada`, `coleta pendente`.

13. `SinalAtencaoCard`
    - Card discreto para sinal não acusatório.
    - Deve exibir aviso: `Sinal de atenção não indica irregularidade`.

14. `TerritorialCarousel`
    - Carrossel horizontal para Brasil, estado, cidade, bairro, órgão e tema.

15. `MobileBottomNav`
    - Navegação inferior mobile: `Início`, `Radar`, `Explorar`, `Mapa`, `Acompanhar`.

16. `FloatingActionButton`
    - Botão `+` contextual.
    - Abre ações permitidas: acompanhar entidade, reportar erro, contribuir contexto, exportar, citar página.

17. `ContextualActionDrawer`
    - Drawer mobile de ações contextualizadas por rota/entidade.
    - Não incluir comentário livre.

18. `UniversalCommandSearch`
    - Busca universal com command palette.
    - Pesquisa entidades, contratos, cidades, documentos e temas; resultados devem mostrar tipo, fonte e confiança.

## Composição do app shell

`apps/web/components/app-shell` deve compor:

- desktop sidebar persistente para `Início`, `Radar`, `Explorar`, `Mapa`, `Acompanhados`, `Contribuir`;
- top search bar com `UniversalCommandSearch`;
- mobile bottom navigation usando `MobileBottomNav`;
- `FloatingActionButton` contextual no mobile e desktop compacto;
- `ContextualActionDrawer` no mobile;
- painel lateral de evidências no desktop, aberto quando o usuário seleciona evidência;
- `sonner` para feedback curto, sem tom sensacionalista.

O shell não deve depender de dados reais. Usar fixtures sintéticas claramente marcadas até a ingestão existir.

## Wireframe textual da home mobile

```text
[Top bar]
DeOlho                                 [buscar]

[Atualizações recentes]
Carrossel: Brasil | SP | Americana | Educação | Saúde

[Radar de mudanças públicas]
EventoPublicoCard
  Tipo: contrato atualizado
  Entidade: Prefeitura sintética de Exemplo
  Resumo: Valor de contrato foi atualizado na fonte oficial.
  Badges: Fato oficial | PNCP | Fonte oficial
  Ações: Ver evidência | Acompanhar

EventoPublicoCard
  Tipo: limitação detectada
  Entidade: Contrato sintético 123
  Resumo: A fonte não informa território impactado.
  Badges: Dado incompleto | PNCP | Verificação pendente

[Entidades em destaque]
EntidadeCard horizontal

[Bottom nav]
Início | Radar | + | Explorar | Mapa
```

Estados obrigatórios: carregando com skeleton, vazio com convite para explorar, erro com opção de tentar novamente, fonte atrasada, dado incompleto.

## Wireframe textual da página de entidade

```text
[Top search]

PerfilEntidadeHeader
  EntidadeAvatar
  Nome sintético da entidade
  Tipo: órgão público
  Badges: Fonte oficial | Dados sintéticos | Atualizado em ...
  Ações: Acompanhar | Contribuir contexto | Ver evidências

[Resumo verificável]
BlocoExplicacaoIA
  "Esta explicação foi gerada a partir dos campos oficiais disponíveis."

[Fatos principais]
Cards com tipo, fonte e confiança:
  Contratos relacionados
  Documentos vinculados
  Territórios impactados

[Radar da entidade]
Lista de EventoPublicoCard

[Limitações]
BlocoLimitacaoDado

[Desktop]
PainelEvidencia fixo à direita

[Mobile]
ContextualActionDrawer aberto pelo botão +
```

## Wireframe textual do radar de mudanças públicas

```text
[Header]
Radar de mudanças públicas
Busca e filtros: território, tipo de entidade, fonte, confiança

[TerritorialCarousel]
Brasil | Estado | Cidade | Órgão | Tema

[Tabs]
Tudo | Contratos | Órgãos | Empresas | Leis | Obras | Documentos

[Lista vertical]
EventoPublicoCard
EventoPublicoCard
EventoPublicoCard

[Estados]
Skeleton de cards
Vazio: "Nenhuma mudança pública encontrada para estes filtros."
Erro: "Não foi possível carregar o radar."
Fonte atrasada: badge e aviso contextual
Dado incompleto: bloco de limitação no card
```

## Regras para agentes modificarem componentes

- Ler `AGENTS.md`, `.planning/PROJECT.md` e este documento antes de alterar UI.
- Não alterar componentes base shadcn para lógica de produto; compor em `components/deolho`.
- Todo card público deve expor tipo, fonte e confiança quando aplicável.
- Não usar cor como único indicador; usar texto, ícone e tooltip.
- Dados sintéticos devem estar marcados como `Dados sintéticos`.
- Explicação de IA deve usar `BlocoExplicacaoIA`.
- Limitações devem usar `BlocoLimitacaoDado`.
- Sinais de atenção devem usar `SinalAtencaoCard` e o aviso obrigatório.
- Não criar comentários livres, likes, ranking moral ou interface de denúncia sensacionalista.
- Todo componente cívico deve ter Storybook com estados: padrão, carregando, vazio, erro, dado incompleto e fonte atrasada quando fizer sentido.

## O que deve ir em `packages/ui`

- Componentes shadcn base em `components/ui`.
- Componentes cívicos reutilizáveis em `components/deolho`.
- Tokens de cor, tipo de informação, confiança, fonte e espaçamento.
- Helpers visuais sem dependência de rota, banco ou fetch.
- Stories de componentes.
- Tipos de props compartilhados apenas quando forem de UI, não de domínio persistente.

## O que deve ficar em `apps/web`

- Rotas App Router.
- App shell e composição de layout.
- Features por domínio: radar, entidade, contrato, cidade, evidências, busca.
- Dados sintéticos de tela e fixtures de protótipo.
- Integração futura com banco, API, ingestão, auth e permissões.
- Estados de rota, loading/error boundaries e navegação contextual.

## O que não fazer

- Não criar clone de Instagram.
- Não transformar radar em rede social.
- Não usar `post`, `like`, `seguir` ou `comentário` como vocabulário de UI.
- Não criar ranking moral de políticos, empresas ou órgãos.
- Não criar score de corrupção ou risco.
- Não criar comentários livres.
- Não sugerir denúncia sem evidência.
- Não esconder fonte, confiança ou limitações em cards públicos.
- Não deixar explicação de IA visualmente parecida com fato oficial.
- Não deixar sinal de atenção parecer acusação.
- Não usar dados reais enquanto a ingestão e o modelo de confiança não existirem.
