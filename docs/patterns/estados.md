# Estados Obrigatórios

Toda tela e componente cívico deve prever estados antes de receber dado real.

## Carregando

Use `Skeleton` com estrutura parecida com o conteúdo real. Não use spinner isolado para listas ou cards complexos.

## Vazio

Explique por que não há dado: sem coleta, filtro sem resultado, fonte não informa ou escopo ainda não coberto.

## Erro

Separe erro operacional de limitação da fonte. Erro de rede, parsing ou servidor não deve virar suspeita sobre entidade.

## Dado incompleto

Use `BlocoLimitacaoDado`. Diga qual campo falta, qual fonte foi consultada e qual impacto isso tem na leitura.

## Fonte atrasada

Mostre última coleta, fonte afetada e se a atualização será tentada novamente. Não esconda dados antigos como se fossem atuais.

## Baixa confiança

Explique o motivo: fonte parcial, revisão pendente, cópia não verificada ou conflito entre fontes.

## Em revisão

Use para dados ou contribuições sob análise manual. Não apresentar revisão pendente como confirmado.

## Contraditório

Mostre as fontes em conflito, campos divergentes e data de cada evidência. Não escolher vencedor automaticamente sem regra documentada.

## Sem permissão

Explique que o usuário não tem acesso à ação ou área. Não ocultar dados públicos por falha de autenticação se a informação deveria ser pública.
