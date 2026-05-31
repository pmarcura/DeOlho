# Conteúdo e Linguagem

## Termos permitidos

- fato oficial;
- fonte oficial;
- evidência;
- limitação;
- dado incompleto;
- fonte atrasada;
- verificação pendente;
- sinal de atenção;
- explicação por IA;
- contribuição contextual;
- acompanhar;
- radar de mudanças públicas;
- página de entidade;
- atualização de entidade;
- evento público.
- reação estruturada;
- mapa de conexões;
- vínculo documentado;
- contribuição contextual moderada.

## Termos proibidos ou restritos

- post;
- like;
- follower;
- comentário livre;
- score de corrupção;
- score de risco;
- ranking de suspeitos;
- suspeito, culpado, corrupto ou fraude sem decisão e fonte oficial;
- bomba, escândalo, denúncia bombástica;
- IA descobriu;
- irregularidade comprovada sem fonte oficial.

## Reações cívicas

Use apenas o enum fechado:

- `apoio`;
- `parcial`;
- `contra`;
- `faltou informação`.

Essas reações são opinião de usuário, não fato oficial. Não usar como ranking, sinal de culpa, priorização de suspeita ou evidência.

## Contribuições contextuais

Comentários públicos entram como contribuição contextual curta, vinculada a evento, entidade ou evidência. Estado inicial obrigatório: `pending`. Nada deve publicar automaticamente acusação, dado pessoal sensível ou afirmação sem fonte.

## Como escrever sinais de atenção

Use estrutura neutra:

```text
Sinal de atenção: [condição observada].
Isso não indica irregularidade. O sinal apenas sugere que a informação pode merecer verificação.
Fonte: [fonte]. Limitação: [limitação].
```

Não use linguagem de culpa. Não use urgência emocional.

## Como escrever explicação de IA

Use estrutura explícita:

```text
Explicação por IA, gerada a partir dos campos oficiais disponíveis.
Esta explicação não substitui a fonte original.
Fontes usadas: [fontes].
Limitações: [limitações].
```

IA nunca é fonte primária.

## Como escrever resumo mensal

O resumo mensal do radar é uma leitura local a partir dos eventos públicos daquele período. Ele deve:

- citar mês, território, volume de eventos, fontes e valores como dados publicados;
- recomendar acontecimentos do próprio mês sem sugerir culpa ou suspeita;
- declarar que valores são campos citados pelas fontes, não execução financeira completa;
- aparecer antes da lista de eventos em `mais recentes`, e a lista normal continua abaixo.

## Como usar Wikipedia

Wikipedia é contexto enciclopédico, não evidência do evento.

Use para:

- somente dentro da página de evento, nunca como bloco genérico da Home;
- órgão, instituição, lei, conceito público, empresa citada e pessoa pública em função pública quando aparecerem no próprio evento ou nas evidências;
- imagem contextual e resumo enciclopédico;
- ajudar o usuário a entender termos como licitação, pregão, lei citada ou órgão público.

Não use para:

- preencher contexto aleatório ou fallback automático de cidade;
- provar o contrato, pagamento, sanção, ato ou vínculo;
- substituir link oficial, trecho do documento ou fonte pública;
- enriquecer pessoa física comum;
- inferir relação entre entidades.

Microcopy obrigatória:

```text
Wikipedia contextualiza, mas não é fonte do evento. A prova continua nas evidências oficiais.
```

## Agente local

Quando `DEOLHO_POST_AGENT_PROVIDER=local` ou `ollama`, a leitura organizada não consome tokens externos. Mesmo assim, ela continua sendo explicação, não fato oficial. A UI deve mostrar `modo local`, `Ollama` ou `OpenAI` de forma visível.

## Como escrever limitação de fonte

Use estrutura objetiva:

```text
A fonte [nome] não informa [campo].
Última coleta: [data].
Impacto: [o que o usuário não deve concluir].
```

## Como evitar acusação

- Descreva o dado, não a intenção.
- Aponte a fonte, não a conclusão moral.
- Use `pode exigir verificação`, não `indica fraude`.
- Use `não há dado suficiente`, não `está escondendo`.
- Quando houver decisão oficial, cite a decisão e a fonte.
