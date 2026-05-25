import "dotenv/config";
import { createDb } from "./client";
import { sources, type NewSource } from "./schema/index";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não definida. Copie .env.example para .env.");

const db = createDb(url);

// Catálogo inicial de fontes. `limitacoes` é redação cívica sensível — descreve
// honestamente o que a fonte NÃO cobre (TRUST-05). Revisar com cuidado jurídico.
const fontes: NewSource[] = [
  {
    id: "pncp",
    nome: "Portal Nacional de Contratações Públicas (PNCP)",
    descricao: "Base oficial de contratações públicas (Lei 14.133/2021).",
    baseUrl: "https://pncp.gov.br/api/consulta/v1",
    licenca: "Dados abertos governamentais",
    termosUrl: "https://www.gov.br/pncp/",
    cobertura:
      "Contratos, atas e licitações de órgãos que publicam no PNCP (federais, estaduais e municipais).",
    limitacoes:
      "A cobertura depende da adesão do órgão ao PNCP. Não inclui execução de pagamentos nem fiscalização da obra/serviço.",
    defaultTrustType: "fato_oficial",
  },
  {
    id: "cgu-transparencia",
    nome: "Portal da Transparência (CGU)",
    descricao: "Contratos, despesas e sanções federais.",
    baseUrl: "https://api.portaldatransparencia.gov.br",
    licenca: "Dados abertos governamentais",
    cobertura: "Contratos federais, despesas e sanções CEIS/CNEP.",
    limitacoes:
      "Foco federal e limite de requisições (90/min diurno). Não cobre contratações estritamente municipais.",
    defaultTrustType: "fato_oficial",
  },
  {
    id: "dou-inlabs",
    nome: "Diário Oficial da União (INLABS)",
    descricao: "Publicações oficiais do DOU em XML.",
    baseUrl: "https://inlabs.in.gov.br",
    cobertura: "Atos oficiais publicados no Diário Oficial da União.",
    limitacoes:
      "Requer credenciais de acesso. É evidência documental — por si só não estrutura contratos.",
    defaultTrustType: "fato_oficial",
  },
  {
    id: "tce-sp",
    nome: "Tribunal de Contas do Estado de São Paulo",
    descricao: "Execução orçamentária dos municípios paulistas.",
    cobertura: "Despesas e receitas de municípios de SP (piloto: Americana-SP).",
    limitacoes: "Apenas municípios de São Paulo. Há defasagem de publicação.",
    defaultTrustType: "fato_oficial",
  },
  {
    id: "querido-diario",
    nome: "Querido Diário (Open Knowledge Brasil)",
    descricao: "Diários oficiais municipais com OCR e busca textual.",
    baseUrl: "https://queridodiario.ok.org.br/api",
    licenca: "Open Knowledge Brasil",
    cobertura: "Gazetas municipais das cidades cobertas pelo projeto.",
    limitacoes:
      "Cobertura municipal parcial. O texto vem de OCR e pode conter ruído.",
    defaultTrustType: "fato_oficial",
  },
];

async function main() {
  await db.insert(sources).values(fontes).onConflictDoNothing();
  console.log(`[seed] ${fontes.length} fontes garantidas no catálogo.`);
  process.exit(0);
}

main().catch((e) => {
  console.error("[seed] erro:", e);
  process.exit(1);
});
