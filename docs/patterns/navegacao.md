# Padrões de Navegação

## Bottom navigation mobile

Use em mobile para as rotas principais:

- `Início`
- `Radar`
- `+`
- `Explorar`
- `Mapa`

O botão `+` abre ações contextuais. Ele não cria post, comentário livre ou denúncia sem estrutura.

## Sidebar desktop

Use em desktop para navegação persistente:

- Início
- Radar
- Explorar
- Mapa
- Acompanhados
- Contribuir

A sidebar deve ser estável, discreta e sem badges sensacionalistas.

## Command search

`UniversalCommandSearch` é a busca principal. Resultados devem agrupar entidades, contratos, cidades, documentos e temas. Cada resultado público precisa mostrar tipo e, quando aplicável, fonte e confiança.

Não transformar command search em chat principal.

## Botão `+` contextual

Ações permitidas:

- acompanhar entidade;
- ver evidência;
- reportar erro estruturado;
- contribuir contexto;
- exportar CSV/JSON;
- citar página.

Ações proibidas:

- criar post;
- curtir;
- comentar livremente;
- acusar;
- denunciar sem evidência.

## Drawer de ações

`ContextualActionDrawer` detalha ações do botão `+`. O drawer precisa:

- mostrar o contexto atual;
- explicar consequência de cada ação;
- ter foco acessível;
- voltar foco ao botão acionador;
- expor estados de erro e sem ações.

## Carrossel territorial

`TerritorialCarousel` permite navegar por camadas como Brasil, estado, cidade, bairro, órgão e tema. Ele não substitui filtros avançados quando a escolha precisar de precisão.

## Links internos em entidades

Links para entidade relacionada devem deixar claro:

- tipo da entidade;
- relação observada;
- fonte da relação;
- confiança ou limitação.

Não criar relação implícita apenas por proximidade visual.
