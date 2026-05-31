# Checklist de PR de UI

Use este checklist em todo PR que altera UI, componentes, docs de design system ou padrões de tela.

## Contexto

- [ ] A issue GitHub está referenciada.
- [ ] `.planning/PROJECT.md` foi respeitado.
- [ ] `.planning/DESIGN_SYSTEM.md` foi respeitado.
- [ ] Docs em `docs/design-system`, `docs/components` ou `docs/patterns` foram atualizados quando necessário.

## Confiança pública

- [ ] Todo dado público mostra tipo de informação quando aplicável.
- [ ] Todo dado público mostra fonte quando aplicável.
- [ ] Todo dado público mostra confiança, limitação ou evidência quando aplicável.
- [ ] Explicação por IA está visualmente separada de fato oficial.
- [ ] Sinal de atenção contém o aviso `Sinal de atenção não indica irregularidade`.
- [ ] Nenhuma UI cria score de corrupção, ranking moral ou acusação automática.
- [ ] Reações e contribuições de usuário aparecem como opinião/contribuição, nunca como fato ou evidência.

## Estados

- [ ] Loading implementado.
- [ ] Estado vazio implementado.
- [ ] Erro implementado.
- [ ] Dado incompleto implementado.
- [ ] Fonte atrasada implementada.
- [ ] Baixa confiança ou revisão pendente implementada quando aplicável.

## Acessibilidade

- [ ] Funciona por teclado.
- [ ] Foco visível.
- [ ] Não depende só de cor.
- [ ] Labels acessíveis para botões, ícones e links.
- [ ] Contraste adequado.
- [ ] Mobile revisado.

## Componentes

- [ ] Não há componente duplicado.
- [ ] Componentes base shadcn não receberam regra de produto sem justificativa.
- [ ] Componentes cívicos ficam em `packages/ui/src/components/deolho`.
- [ ] `docs/design-system/shadcn.md` foi seguido quando a mudança toca shadcn, `components.json`, tokens ou `packages/ui`.
- [ ] Stories foram criadas ou atualizadas para componente novo.
- [ ] Exemplos usam dados sintéticos marcados.

## Linguagem

- [ ] Texto em português do Brasil.
- [ ] Sem linguagem sensacionalista.
- [ ] Sem tom partidário.
- [ ] Sem termos `post`, `like`, `comentário livre` ou `seguir` na UI.
- [ ] Limitações dizem o que falta e por quê.
- [ ] Mapa ou grafo de conexões não sugere culpa por proximidade visual.

## Handoff

- [ ] Testes/verificações estão descritos.
- [ ] Pendências estão listadas.
- [ ] Próxima issue recomendada está clara.
