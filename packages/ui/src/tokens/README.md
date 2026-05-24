# Tokens do DeOlho

`deolho.tokens.json` é o contrato inicial entre documentação, Figma futuro, Storybook e componentes React.

## Regras

- Tokens semânticos representam significado cívico, não preferência estética.
- Cor nunca pode ser o único indicador de fonte, confiança, IA, limitação ou sinal.
- Novos tipos de informação precisam atualizar `docs/design-system/tokens.md` e `docs/components/civicos.md`.
- Dados sintéticos precisam usar o estado `sourceState.synthetic`.
- Tokens finais devem ser convertidos para CSS variables em `packages/ui/src/styles/globals.css` no scaffold.
