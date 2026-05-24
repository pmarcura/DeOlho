# Referências de Design System

Este documento registra referências externas usadas para amadurecer o **DeOlho Interface System**. A intenção é aprender padrões de documentação, governança e arquitetura de sistemas maduros, sem copiar identidade visual, componentes proprietários ou linguagem de marca.

## Leituras principais

| Referência | O que observar | Adaptação para o DeOlho |
|------------|----------------|--------------------------|
| [IBM Carbon Design System](https://carbondesignsystem.com/) | Sistema open source com código, ferramentas de design, diretrizes, contribuição e princípios de inclusão, modularidade e consistência. | Tratar o DeOlho como produto vivo: componentes, guidelines, comunidade, contribuição e padrões precisam evoluir juntos. |
| [Microsoft Fluent 2](https://fluent2.microsoft.design/) | Organização por design, desenvolvimento, plataformas e recursos de acessibilidade. | Documentar variações de navegação e componentes para web, mobile e futuras superfícies sem fragmentar linguagem. |
| [Figma Design Systems](https://www.figma.com/design-systems/) | Bibliotecas compartilhadas, variáveis, modos, mapeamento entre componente e código, análise de uso. | Preparar tokens e props para sincronização futura entre Figma, Storybook e código. |
| [USWDS](https://designsystem.digital.gov/) | Design system governamental com componentes, padrões, tokens, acessibilidade, templates e comunidade. | Priorizar acessibilidade, mobile, linguagem pública e transparência de origem como parte do sistema, não como checklist tardio. |
| [GOV.UK Design System](https://design-system.service.gov.uk/) | Componentes com orientação de uso, exemplos codificados e foco em consistência de serviços públicos. | Cada componente cívico precisa dizer quando usar, quando não usar, estados e exemplos verificáveis. |
| [Atlassian Design System](https://atlassian.design/) | Linguagem unificada, tokens, componentes e conteúdo para colaboração em escala. | Separar fundações, componentes, padrões e regras de contribuição para reduzir decisão repetida entre agentes. |
| [GitHub Primer](https://primer.style/) | Separação entre Product UI, Brand UI, acessibilidade, ícones e primitives/tokens. | Separar `packages/ui` de identidade pública e manter componentes cívicos independentes de marketing. |
| [Adobe Spectrum](https://spectrum.adobe.com/) | Componentes, ferramentas, diretrizes de uso e coerência entre produtos. | Documentar intenção, comportamento, estados e acessibilidade como parte do contrato de cada componente. |
| [Shopify Polaris](https://polaris-react.shopify.com/) | Foundations, design, content, patterns, components, tokens, icons e contribuição para produto operacional. | Manter linguagem de produto, conteúdo e padrões de tela lado a lado com os componentes. |
| [shadcn/ui](https://ui.shadcn.com/docs) | Componentes acessíveis como código aberto no projeto, CLI, monorepo, registry, theming e Figma. | Usar como camada de implementação e distribuição do DeOlho Interface System, com componentes base e cívicos versionados no repositório. |

## Síntese para o DeOlho

O DeOlho deve combinar quatro camadas:

1. **Fundações**: princípios, tokens, linguagem e acessibilidade.
2. **Componentes**: shadcn/ui como base e componentes cívicos em `packages/ui`.
3. **Padrões**: telas, navegação, estados obrigatórios e fluxos de evidência.
4. **Governança**: regras para agentes, checklist de PR, Storybook e documentação web.
5. **Distribuição**: shadcn registry futuro apenas quando componentes cívicos estiverem estáveis.

## Diferença central do DeOlho

Design systems corporativos buscam consistência, velocidade e qualidade. O DeOlho precisa disso, mas acrescenta uma obrigação própria: **separar fato oficial, explicação por IA, sinal estatístico, notícia, opinião e revisão manual**.

Por isso, qualquer componente que mostre dado público precisa responder:

- o que é;
- de onde veio;
- qual evidência sustenta;
- qual confiança deve receber;
- qual limitação precisa ser vista;
- como o usuário volta ao documento.

## Regra de uso de referências

Use referências para padrões de documentação e maturidade. Não copie:

- identidade visual;
- layout proprietário;
- nomes de componentes de marca quando não fizerem sentido no domínio cívico;
- exemplos com dados reais;
- linguagem promocional.
