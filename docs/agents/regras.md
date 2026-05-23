# Regras para Agentes

Estas regras valem para Codex, Claude, GSD e qualquer agente que altere UI, documentação de UI ou componentes.

## Antes de mexer em UI

1. Leia `.planning/PROJECT.md`.
2. Leia `.planning/DESIGN_SYSTEM.md`.
3. Leia `docs/design-system/index.md`.
4. Leia a documentação do componente ou padrão em `docs/components` e `docs/patterns`.
5. Leia a issue ativa.

## Não criar componente duplicado

Antes de criar componente novo, procure em:

- `packages/ui/src/components/ui`;
- `packages/ui/src/components/deolho`;
- `docs/components/base.md`;
- `docs/components/civicos.md`.

Se o componente já existir, componha ou estenda por props. Não crie variação paralela sem justificar no PR.

## Não alterar componente base sem justificar

Componentes shadcn base devem permanecer genéricos. Regra cívica fica em `components/deolho`.

Alterar componente base exige explicar:

- problema resolvido;
- impacto em componentes existentes;
- estados testados;
- alternativa considerada.

## Usar componente cívico quando houver dado público

Se a UI mostra contrato, órgão, empresa, político, cidade, documento, lei, obra, tema, fonte ou evidência, use componente cívico adequado.

## Criar Storybook para componente novo

Todo componente cívico novo precisa de stories para:

- padrão;
- loading;
- vazio;
- erro;
- dado incompleto;
- fonte atrasada;
- baixa confiança, quando aplicável.

## Criar estado vazio, erro e loading

Nenhuma tela de produto deve ser entregue apenas no estado feliz.

## Atualizar docs ao criar padrão novo

Novo padrão de tela, fluxo de navegação ou estado de confiança precisa atualizar `docs/patterns` e, se necessário, `.planning/DESIGN_SYSTEM.md`.

## Não usar dados reais em mock

Mocks, fixtures e stories devem usar dados sintéticos marcados como `Dados sintéticos`.

## Não misturar fato e IA

Fato oficial usa fonte e evidência. Explicação por IA usa `BlocoExplicacaoIA`. Um não pode parecer o outro.

## Não implementar sensacionalismo

Proibido criar:

- score de corrupção;
- ranking moral;
- acusação automática;
- comentário livre;
- like;
- post;
- feed social;
- denúncia sem evidência.
