# Tokens

Tokens são contratos visuais e semânticos. Eles devem morar em `packages/ui/src/tokens` quando o pacote for implementado.

## Cores base

| Token | Uso | Regra |
|-------|-----|-------|
| `background` | Fundo principal | Claro, neutro, sem estética partidária |
| `foreground` | Texto principal | Contraste AA mínimo |
| `muted` | Fundos secundários | Usar para zonas de baixa ênfase |
| `muted-foreground` | Texto auxiliar | Não usar para informação crítica |
| `border` | Divisórias | Sutil, mas perceptível |
| `surface` | Cards e painéis | Diferenciar do fundo sem parecer modal |

## Cores semânticas

| Token | Uso | Cuidado |
|-------|-----|---------|
| `semantic-official` | Fato oficial | Não usar para explicação de IA |
| `semantic-ai` | Explicação por IA | Sempre com rótulo textual |
| `semantic-attention` | Sinal de atenção | Não usar como acusação |
| `semantic-limitation` | Limitação ou lacuna | Explicar o que falta |
| `semantic-review` | Revisão manual | Mostrar status e data |
| `semantic-error` | Erro operacional | Separar de risco cívico |

## Tipos de informação

| Tipo | Label recomendado | Componente |
|------|-------------------|------------|
| `official_fact` | Fato oficial | `TipoInformacaoBadge` |
| `ai_explanation` | Explicação por IA | `BlocoExplicacaoIA` |
| `attention_signal` | Sinal de atenção | `SinalAtencaoCard` |
| `news` | Notícia | `TipoInformacaoBadge` |
| `user_opinion` | Opinião de usuário | Evitar no MVP |
| `manual_review` | Revisão manual | `TipoInformacaoBadge` |
| `incomplete_data` | Dado incompleto | `BlocoLimitacaoDado` |

## Níveis de confiança

| Nível | Label | Regra |
|-------|-------|-------|
| `official_source` | Fonte oficial | Linkar fonte quando possível |
| `verified_copy` | Cópia verificada | Mostrar origem e data de verificação |
| `pending_review` | Verificação pendente | Não usar para conclusão sensível |
| `delayed_source` | Fonte atrasada | Mostrar última coleta |
| `incomplete` | Incompleto | Explicar campo ausente |
| `conflicting` | Contraditório | Exibir conflito e fontes |

## Estados de fonte

| Estado | Exibição obrigatória |
|--------|----------------------|
| `fresh` | Data de publicação e coleta |
| `delayed` | Aviso de fonte atrasada |
| `unavailable` | Motivo conhecido ou tentativa de coleta |
| `partial` | Campos faltantes |
| `synthetic` | `Dados sintéticos` visível |

## Espaçamento

| Token | Uso |
|-------|-----|
| `space-1` | Ajustes internos pequenos |
| `space-2` | Badges, ícones e labels |
| `space-3` | Campos compactos |
| `space-4` | Padding padrão de card mobile |
| `space-6` | Blocos e seções |
| `space-8` | Separação de grupos |

## Radius

| Token | Uso |
|-------|-----|
| `radius-sm` | Badges, inputs compactos |
| `radius-md` | Botões e cards pequenos |
| `radius-lg` | Drawers, painéis e cards editoriais |

Cards devem manter raio moderado. Evite formas excessivamente arredondadas que aproximem a interface de rede social genérica.

## Tipografia

| Token | Uso |
|-------|-----|
| `text-label` | Badges, metadados, labels de estado |
| `text-body` | Texto comum |
| `text-body-strong` | Destaque dentro de card |
| `text-title` | Títulos de seção |
| `text-page-title` | Título de página |

Não escalar fonte por largura de viewport. Ajuste layout, não reduza legibilidade.
