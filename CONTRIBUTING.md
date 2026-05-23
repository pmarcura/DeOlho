# Contribuindo com o DeOlho

Obrigado por contribuir. O DeOlho é uma ferramenta cívica, então qualidade técnica e responsabilidade pública são inseparáveis.

## Regra central

Sem fonte, sem afirmação pública.

Toda informação que chega à interface, API, exportação ou documentação pública deve ter origem rastreável ou declarar explicitamente que a fonte não informa aquele dado.

## Antes de começar

1. Leia `.planning/PROJECT.md`.
2. Leia `.planning/OBSIDIAN.md` para entender a ponte com o vault local.
3. Leia `AGENTS.md`.
4. Escolha uma issue no GitHub.
5. Crie uma branch curta a partir de `main`.
6. Confirme que `.claude/` continua fora do versionamento.

Exemplo:

```bash
git pull --ff-only
git switch -c codex/issue-7-m0-fundacao
```

## Como escolher trabalho

Prioridade atual:

1. M0 - Fundação aberta
2. Scaffold técnico Next/Postgres/Drizzle
3. CI inicial
4. Modelo de confiança e proveniência
5. Ingestão PNCP mínima

Não pule para UI, mapa, chat ou sinais de atenção antes do modelo de confiança estar definido.

## Padrão de PR

Todo PR deve incluir:

- issue relacionada, por exemplo `Refs #7` ou `Closes #7`;
- resumo objetivo do que mudou;
- testes ou verificações executadas;
- riscos e limites conhecidos;
- handoff para o próximo agente/contribuidor.

## Critérios de aceite para dados

Mudanças que lidam com dados públicos devem responder:

- Qual é a fonte?
- Onde está o link ou documento oficial?
- Quando o dado foi publicado?
- Quando foi coletado?
- O que a fonte não informa?
- O dado é fato oficial, explicação, sinal de atenção, notícia ou opinião?

## O que não será aceito

- Acusações automáticas contra pessoas, empresas ou órgãos.
- Score de corrupção, score de risco ou ranking de suspeita.
- Inferências frágeis apresentadas como fato.
- Dados de pessoa física comum.
- Comentários abertos ou feed social no v1.
- Chat de IA como superfície principal do produto.
- Afirmações de IA sem fonte oficial de apoio.

## Uso de IA no produto

IA pode:

- resumir contratos em português simples;
- explicar termos jurídicos;
- sugerir perguntas cívicas;
- ajudar a organizar informações já presentes nas fontes.

IA não pode:

- descobrir fatos sozinha;
- preencher lacunas sem evidência;
- acusar pessoas ou empresas;
- transformar sinal de atenção em irregularidade.

## Estilo de documentação

- Escreva em português do Brasil.
- Seja direto, profissional e verificável.
- Prefira exemplos concretos.
- Registre decisões relevantes em documentação ou issues.

## Obsidian e `.planning/`

O Obsidian continua conectado ao projeto como camada de pensamento. Porém, agentes e contribuidores devem implementar a partir de contexto versionado.

- Use o vault local para rascunhos, exploração e notas em formação.
- Promova decisões estáveis para `.planning/` antes de abrir issue ou implementar.
- Não versione `.obsidian/`, plugins, temas ou configurações pessoais.
- Se uma informação existir apenas no Obsidian, trate como contexto não operacional até ser registrada em `.planning/`.

## Relatando problemas

Ao abrir uma issue, inclua:

- contexto;
- resultado esperado;
- resultado observado;
- fonte ou evidência, quando envolver dado público;
- impacto para usuário, contribuidor ou confiabilidade do projeto.
