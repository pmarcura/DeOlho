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
    baseUrl: "https://api.queridodiario.ok.org.br",
    licenca: "Open Knowledge Brasil",
    cobertura: "Gazetas municipais das cidades cobertas pelo projeto.",
    limitacoes:
      "Cobertura municipal parcial. O texto vem de OCR e pode conter ruído.",
    defaultTrustType: "fato_oficial",
  },
  {
    id: "diario-americana",
    nome: "Diário Oficial de Americana",
    descricao:
      "Diário oficial do município de Americana-SP, publicado diretamente pela prefeitura.",
    baseUrl: "https://diariooficial.americana.sp.gov.br",
    licenca: "Publicação oficial municipal",
    cobertura:
      "Atos oficiais do Município de Americana-SP publicados em seu diário oficial.",
    limitacoes:
      "Edições em PDF; o texto depende de extração e pode conter ruído. Cobertura conforme o calendário de publicação da prefeitura.",
    defaultTrustType: "fato_oficial",
  },
  {
    id: "transparencia-americana",
    nome: "Portal da Transparência de Americana",
    descricao: "Execução orçamentária, licitações e contratos do município.",
    baseUrl: "https://transparencia.americana.sp.gov.br",
    licenca: "Publicação oficial municipal (LAI 12.527/2011)",
    cobertura: "Dados de transparência do Município de Americana-SP.",
    limitacoes:
      "Seção SIAFIC (despesas/empenhos com credor) marcada como 'em breve' em 2026-05 — a execução detalhada ainda não foi publicada no portal.",
    defaultTrustType: "fato_oficial",
  },
  {
    id: "camara-americana",
    nome: "Câmara Municipal de Americana",
    descricao: "Atividade legislativa municipal: sessões, proposições, indicações, requerimentos e votações.",
    baseUrl: "https://www.camara-americana.sp.gov.br",
    licenca: "Publicação oficial municipal",
    cobertura:
      "Atos e tramitação legislativa da Câmara Municipal de Americana-SP, conforme disponibilidade do portal oficial.",
    limitacoes:
      "Coleta inicial usa descoberta HTML; projetos, indicações, requerimentos e votações ainda precisam de mapeadores dedicados por seção.",
    defaultTrustType: "fato_oficial",
  },
  {
    id: "receita-cnpj",
    nome: "Cadastro Nacional da Pessoa Jurídica (Receita Federal via BrasilAPI)",
    descricao: "Dados cadastrais e quadro de sócios (QSA) de empresas.",
    baseUrl: "https://brasilapi.com.br/api/cnpj/v1",
    licenca: "Dados públicos da Receita Federal",
    cobertura: "Empresas com CNPJ na base da Receita Federal.",
    limitacoes:
      "O CPF dos sócios vem mascarado. Reflete a base da Receita, que pode ter defasagem de atualização.",
    defaultTrustType: "fato_oficial",
  },
  {
    id: "tse",
    nome: "Tribunal Superior Eleitoral (Dados Abertos)",
    descricao: "Prestação de contas eleitorais — receitas/doações e candidaturas.",
    baseUrl: "https://dadosabertos.tse.jus.br",
    licenca: "Dados abertos governamentais",
    cobertura: "Eleições brasileiras (candidatos, doadores e despesas de campanha).",
    limitacoes:
      "Dados em arquivos bulk (CSV/ZIP) por eleição/UF; exigem download e filtragem por município/candidato.",
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
