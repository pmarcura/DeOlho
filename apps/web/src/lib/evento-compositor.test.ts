import assert from "node:assert/strict";
import { comporEvento, leituraLocalInterpretativa } from "./evento-compositor";
import { podeEnriquecerComWikipedia } from "./wiki-policy";

function assertEmpresaHref(evento: ReturnType<typeof comporEvento>, href: string) {
  assert.equal(
    evento.conexoes.some((c) => c.tipo === "empresa" && c.href === href),
    true,
    `esperava conexão de empresa para ${href}`,
  );
}

const pagamento = comporEvento({
  categoria: "pagamento",
  tipo: "pagamento_registrado",
  titulo: "Despesa registrada para ACME SERVICOS LTDA",
  resumo: "Órgão: Prefeitura. Credor: ACME SERVICOS LTDA. Ação orçamentária: Manutenção de escolas.",
  valor: "12500.00",
  sourceId: "tce-sp",
  sourceUrl: "https://exemplo.tce.sp.gov.br/despesa",
  trustType: "fato_oficial",
  entidades: { credorDocumento: "12.345.678/0001-90" },
});
assertEmpresaHref(pagamento, "/empresa/12345678000190");

const contratacao = comporEvento({
  categoria: "contratacao",
  tipo: "contrato_publicado",
  titulo: "Contrato publicado",
  resumo: "Fornecedor: BETA COMERCIO LTDA. Objeto: compra de materiais.",
  valor: "900000",
  sourceId: "pncp",
  sourceUrl: "https://pncp.gov.br/app/contratos/1",
  trustType: "fato_oficial",
  entidades: { fornecedorDocumento: "98.765.432/0001-10" },
});
assertEmpresaHref(contratacao, "/empresa/98765432000110");

const sancao = comporEvento({
  categoria: "sancao",
  tipo: "sancao_registrada",
  titulo: "Sanção registrada",
  resumo: "GAMA LTDA Tipo: impedimento temporário.",
  valor: null,
  sourceId: "cgu-transparencia",
  sourceUrl: "https://portaldatransparencia.gov.br/sancoes",
  trustType: "fato_oficial",
  entidades: { fornecedorDocumento: "11.111.111/0001-11" },
});
assert.equal(
  sancao.avisos.some((aviso) => aviso.includes("não indica irregularidade")),
  true,
);

assert.equal(podeEnriquecerComWikipedia("pessoa_comum"), false);
assert.equal(podeEnriquecerComWikipedia("orgao"), true);
assert.equal(podeEnriquecerComWikipedia("pessoa_publica"), true);
assert.equal(podeEnriquecerComWikipedia("empresa"), true);
assert.equal(podeEnriquecerComWikipedia("lei"), true);

const semFonte = comporEvento({
  categoria: "ato_normativo",
  titulo: "Ato sem fonte",
  resumo: "Texto pendente de proveniência.",
  valor: null,
  sourceId: null,
  sourceUrl: null,
  trustType: null,
});
assert.equal(semFonte.tipoInformacao, "dado_incompleto");
assert.equal(semFonte.confianca, "incompleto");
assert.equal(semFonte.limitacoes.length >= 2, true);

const formatadoPorAgente = comporEvento({
  categoria: "contratacao",
  tipo: "contrato_publicado",
  titulo: "Título organizado pelo agente",
  resumo: "Fornecedor: DELTA LTDA. Objeto: serviço público.",
  valor: "56000",
  sourceId: "pncp",
  sourceUrl: "https://pncp.gov.br/app/contratos/2",
  trustType: "fato_oficial",
  entidades: {
    fornecedorDocumento: "22.222.222/0001-22",
    apresentacao: {
      modo: "openai",
      modelo: "gpt-4.1-nano",
      linhaFina: "Contrato · R$ 56 mil · PNCP",
      leituraCompleta: "Leitura completa organizada somente a partir da evidência oficial.",
      conexoesTexto: ["DELTA LTDA"],
      evidenciasLidas: 1,
    },
  },
});
assert.equal(formatadoPorAgente.titulo, "Título organizado pelo agente");
assert.equal(formatadoPorAgente.apresentacaoIA?.leituraCompleta?.includes("evidência oficial"), true);
assert.equal(
  formatadoPorAgente.conexoes.some((c) => c.tipo === "ia" && c.label === "DELTA LTDA"),
  true,
);

// Leitura interpretativa: explica o significado SEM recitar o trecho bruto.
const leituraContrato = leituraLocalInterpretativa({
  categoria: "contratacao",
  titulo: "Prefeitura contratou Beta Comercio",
  resumo: "Fornecedor: BETA COMERCIO LTDA. Objeto: compra de materiais escolares.",
  valor: "900000",
  sourceId: "pncp",
  sourceUrl: "https://pncp.gov.br/app/contratos/1",
  trustType: "fato_oficial",
});
assert.match(leituraContrato, /A Prefeitura contratou/);
assert.match(leituraContrato, /Vale acompanhar/);
assert.match(leituraContrato, /ficha e nas provas/);
assert.equal(leituraContrato.includes("Fornecedor: BETA"), false, "não deve recitar o campo bruto");

const leituraSancao = leituraLocalInterpretativa({
  categoria: "sancao",
  titulo: "Sanção registrada",
  resumo: "GAMA LTDA Tipo: impedimento temporário.",
  valor: null,
  sourceId: "cgu-transparencia",
  sourceUrl: "https://portaldatransparencia.gov.br/sancoes",
  trustType: "fato_oficial",
});
assert.match(leituraSancao, /não significa, por si só, culpa/);

console.log("[evento-compositor] testes OK");
