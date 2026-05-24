# Recursos externos — DeOlho Design System

Guia de referência para ícones, bandeiras, mapas, dados e utilitários aprovados para o stack do DeOlho. Consulte este documento antes de adicionar qualquer dependência visual ou de dados.

## Ícones

### Estratégia: duas camadas

O shadcn já configura `"iconLibrary": "lucide"`. Phosphor entra como suplemento cívico.

| Camada | Biblioteca | Quando usar |
|--------|-----------|-------------|
| Primária | `lucide-react` | UI chrome: botões, navegação, formulários, estado, ações gerais |
| Suplementar | `@phosphor-icons/react` | Semântica cívica: entidades, processos, documentos, sinais |

### Lucide — UI chrome

```
npm install lucide-react
```

- ~1500+ ícones, MIT, treeshakeable, componente React
- Versão: `1.x`
- Já configurado em `components.json` como `"iconLibrary": "lucide"`
- Uso: `import { Eye, Search, FileText, MapPin, Building2, Scale } from 'lucide-react'`

**Ícones chave para o DeOlho:**

| Ícone | Uso |
|-------|-----|
| `Eye` | Identidade da marca DeOlho |
| `Search` | Busca universal |
| `FileText` | Documento, contrato |
| `MapPin` | Localização, território |
| `Building2` | Órgão público |
| `Scale` | Justiça, lei |
| `AlertTriangle` | Sinal de atenção |
| `CheckCircle2` | Verificado, confirmado |
| `ExternalLink` | Link para evidência |
| `Filter` | Filtros do radar |
| `Bell` | Notificação, acompanhar |
| `Flag` | Bandeira de atenção |

### Phosphor — semântica cívica

```
npm install @phosphor-icons/react
```

- ~9000+ ícones em 6 pesos: Thin / Light / Regular / Bold / Fill / Duotone
- Versão: `2.x`, MIT, treeshakeable
- Uso: `import { Gavel, Bank, Stamp, Scales } from '@phosphor-icons/react'`

**6 pesos disponíveis:**

| Peso | Quando usar |
|------|-------------|
| `Regular` | Conteúdo padrão (padrão do DeOlho) |
| `Bold` | Destaque, chamadas importantes |
| `Fill` | Estado ativo ou selecionado |
| `Light` | Contexto secundário, decorativo |
| `Duotone` | Ilustração de feature, onboarding |
| `Thin` | Apenas decoração — nunca para UI funcional |

**Ícones cívicos chave:**

`Gavel` `Bank` `Stamp` `Scales` `Certificate` `Newspaper` `Globe` `Buildings` `Handshake` `Megaphone` `ShieldCheck` `Notepad` `Receipt` `FileSearch` `ChartBar` `Briefcase` `Money` `Funnel` `SealCheck` `BookOpen` `Binoculars` `MagnifyingGlass`

### Regras para agentes

- Não misturar Lucide e Phosphor no mesmo componente.
- Nunca usar ícone como único indicador de estado — combinar com texto ou tooltip.
- Importar apenas ícones usados (treeshaking por import nomeado).
- Documentar a escolha de ícone no Storybook do componente.

---

## Bandeiras brasileiras

Nenhum pacote npm cobre estados e municípios brasileiros com qualidade consistente. Estratégia: SVG curado + camadas de fallback.

### Brasil — bandeira nacional

```
npm install flag-icons
```

- Versão `7.x`, MIT, sprite CSS com todos os países ISO 3166-1
- Uso: `<span class="fi fi-br" />`
- Alternativa React: `country-flag-icons@1.x` — `import BrazilFlag from 'country-flag-icons/react/3x2/BR'`

### Estados brasileiros (27 UFs)

Sem pacote npm confiável. Usar SVGs curados do Wikimedia Commons.

**Estrutura de arquivos:**

```
packages/ui/src/assets/flags/
  brasil.svg
  estados/
    ac.svg  al.svg  ap.svg  am.svg  ba.svg  ce.svg
    df.svg  es.svg  go.svg  ma.svg  mt.svg  ms.svg
    mg.svg  pa.svg  pb.svg  pr.svg  pe.svg  pi.svg
    rj.svg  rn.svg  rs.svg  ro.svg  rr.svg  sc.svg
    sp.svg  se.svg  to.svg
  capitais/
    sao-paulo.svg        rio-de-janeiro.svg
    belo-horizonte.svg   brasilia.svg
    porto-alegre.svg     curitiba.svg
    fortaleza.svg        recife.svg
    manaus.svg           salvador.svg
    belem.svg            goiania.svg
```

**Fonte:** Wikimedia Commons (domínio público para bandeiras oficiais).

**Componente:**

```tsx
// packages/ui/src/components/deolho/TerritoryFlag.tsx
interface TerritoryFlagProps {
  type: 'pais' | 'estado' | 'municipio'
  code: string   // 'BR' | 'SP' | 'sao-paulo'
  size?: number  // px, padrão 24
  className?: string
}

// Ordem de resolução:
// 1. SVG curado em assets/flags/
// 2. Brasão IBGE via API
// 3. Avatar com inicial + cor derivada do UF
// 4. Placeholder neutro
```

### Municípios (5 570 cidades)

A maioria não tem bandeira oficial em SVG. Estratégia em camadas:

1. **Capitais:** SVG curado por cidade (26 capitais + Brasília)
2. **Grandes municípios:** brasão oficial quando disponível no IBGE
3. **Fallback universal:** inicial do município em avatar com cor derivada do estado

---

## Mapas e território

### Fase 1 — react-simple-maps (SVG estático)

```
npm install react-simple-maps topojson-client
```

- Versão `3.x`, MIT
- Renderização SVG com projeções geográficas
- Combina com TopoJSON das malhas IBGE

**Malhas IBGE:**

```
https://servicodados.ibge.gov.br/api/v2/malhas/paises/BR?resolucao=2&formato=application/json
https://servicodados.ibge.gov.br/api/v2/malhas/estados/{UF}
```

Uso: mapa coroplético de estados no radar territorial, sem API key.

### Fase 2 — react-leaflet (mapa interativo)

```
npm install react-leaflet leaflet
```

- Versão `5.x`, BSD-2
- Tiles OpenStreetMap — domínio público, sem API key
- Alternativa de performance: MapLibre GL JS (`maplibre-gl`)
- **Não entra antes de dados reais de território impactado**

---

## Dados, locale e utilitários

### Datas

```
npm install date-fns
```

```ts
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
formatDistanceToNow(data, { addSuffix: true, locale: ptBR })
```

Versão `4.x`, MIT. Não usar `moment.js`.

### Moeda e números

Usar `Intl` nativo — sem dependência:

```ts
new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(valor)

new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  maximumFractionDigits: 1,
}).format(1_500_000) // → "1,5 mi"
```

### API IBGE — localidades

Sem autenticação, resposta JSON:

```
GET servicodados.ibge.gov.br/api/v1/localidades/estados
GET servicodados.ibge.gov.br/api/v1/localidades/municipios
GET servicodados.ibge.gov.br/api/v1/localidades/estados/{UF}/municipios
```

### Dados sintéticos de desenvolvimento

```
npm install -D @faker-js/faker
```

```ts
import { faker } from '@faker-js/faker/locale/pt_BR'

faker.company.name()       // → "Construções Oliveira S/A"
faker.location.city()      // → "Porto Alegre"
faker.finance.amount()     // → "12340.50"
```

Versão `10.x`, MIT. Todos os dados gerados devem ser marcados como `Dados sintéticos` na UI.

### Validação e formulários

```
npm install zod react-hook-form @hookform/resolvers
```

- `zod` para schemas compartilhados entre cliente e servidor
- `react-hook-form` com `zodResolver` para formulários de busca, contribuição e correção

### CNPJ e documentos

Validação de CNPJ via dígitos verificadores. Implementar como função utilitária em `packages/ui/src/lib/cnpj.ts` ou usar lib leve verificada. Nunca expor CPF de pessoa física.

Máscara de CNPJ: `##.###.###/####-##`

### Tipografia

```ts
// apps/web/app/layout.tsx
import { Inter, Geist_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })
```

- **Inter:** corpo de texto, UI, labels — variable font, suporte a pt-BR
- **Geist Mono:** código, hashes, IDs, valores técnicos, CNPJ formatado
- Auto-hospedadas via `next/font` — sem Google Fonts em produção, zero FOUT

---

## Regra de governança de dependências

Antes de adicionar qualquer recurso não listado aqui:

1. Verificar licença (MIT, BSD-2, Apache-2 são aceitáveis).
2. Verificar se é treeshakeable e não aumenta bundle significativamente.
3. Avaliar alternativa já usada no projeto.
4. Documentar justificativa no PR.
5. Se aprovado, atualizar este documento e `apps/docs/index.html`.
