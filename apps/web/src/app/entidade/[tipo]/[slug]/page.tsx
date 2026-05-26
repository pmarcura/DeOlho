/**
 * Página de entidade — perfil cívico (NÃO perfil social).
 *
 * docs/patterns/telas.md "Página de entidade / empresa / político":
 *  - Header neutro (sem slogan, sem foto partidária).
 *  - Resumo verificável separado como BlocoExplicacaoIA.
 *  - Atributos públicos (sócios para empresa) — doc mascarado.
 *  - Contratos e eventos relacionados.
 *  - Sinais de atenção SEMPRE com aviso obrigatório.
 *  - Limitações declaradas.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { EntidadeAvatar } from "@/components/deolho/entidade-avatar";
import {
  TipoInformacaoBadge,
  ConfiancaBadge,
  FonteBadge,
  ChipDataColeta,
} from "@/components/deolho/badges";
import { BlocoExplicacaoIA, BlocoLimitacaoDado, AvisoSintetico } from "@/components/deolho/blocos";
import { ContratoCard, EventoPublicoCard, SinalAtencaoCard } from "@/components/deolho/cards";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CONTRATO_DESTAQUE,
  EMPRESAS_REF,
  EVENTOS_RADAR,
  PREFEITURA_REF,
  SINAL_EMPRESA_ALFA,
  SOCIOS_EMPRESA_ALFA,
} from "@/lib/civic-data";
import type { TipoEntidade } from "@/lib/civic-types";

interface PageProps {
  params: Promise<{ tipo: string; slug: string }>;
}

const TIPO_LABEL: Record<string, string> = {
  empresa: "Empresa",
  orgao: "Órgão público",
  "pessoa-publica": "Agente público",
  contrato: "Contrato",
  obra: "Obra pública",
  cidade: "Cidade",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tipo, slug } = await params;
  const tipoLabel = TIPO_LABEL[tipo] ?? "Entidade";
  return {
    title: `${tipoLabel} · ${slug} — DeOlho`,
    description: "Página de entidade pública — fatos verificáveis, fonte e limitações.",
  };
}

export default async function EntidadePage({ params }: PageProps) {
  const { tipo, slug } = await params;
  const tipoEntidade = normalizarTipo(tipo);

  // Em produção: query por (tipo, slug). Aqui resolvemos com fixture.
  const entidade =
    tipoEntidade === "empresa"
      ? EMPRESAS_REF[0]!
      : tipoEntidade === "orgao"
        ? PREFEITURA_REF
        : EMPRESAS_REF[0]!;

  const tipoLabel = TIPO_LABEL[tipo] ?? "Entidade";
  const eventosRelacionados = EVENTOS_RADAR.filter((e) =>
    e.entidades.some((en) => en.id === entidade.id),
  );

  return (
    <AppShell>
      {/* Crumb */}
      <Link
        href="/explorar"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
        Explorar entidades
      </Link>

      {/* Header (PerfilEntidadeHeader inline) */}
      <header className="flex items-start gap-3 pb-2">
        <EntidadeAvatar
          tipo={tipoEntidade}
          nome={entidade.nome}
          size="lg"
          isSynthetic
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {tipoLabel}
          </p>
          <h1 className="text-xl font-bold tracking-tight leading-tight">{entidade.nome}</h1>
          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
            <FonteBadge fonte="pncp" isSynthetic />
            <ConfiancaBadge nivel="verificacao_pendente" />
            <ChipDataColeta label="atualizado" data="2026-05-25" />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <Button variant="outline" size="sm" className="w-full">
          Acompanhar
        </Button>
        <Button variant="outline" size="sm" className="w-full">
          Reportar erro
        </Button>
      </div>

      {/* Resumo verificável (IA) */}
      <section className="mt-5">
        <BlocoExplicacaoIA
          texto={
            tipoEntidade === "empresa"
              ? "Empresa sintética com 1 contrato registrado com a Prefeitura sintética de Americana, valor total de R$ 1,24 milhão (sintético). Quadro societário com 2 sócios sintéticos."
              : "Órgão sintético com radar de mudanças públicas ativo. As atualizações vêm do PNCP, Diário e TCE-SP sintéticos."
          }
          fontesUsadas={[{ fonte: "pncp" }, { fonte: "receita-cnpj" }]}
          limitacoes={[
            "Sócios vêm da Receita com CPF mascarado.",
            "Estes dados são sintéticos — nada se refere a empresa real.",
          ]}
          geradoEm="2026-05-25"
        />
      </section>

      {/* Sócios (envolvidos) — só para empresa, doc mascarado */}
      {tipoEntidade === "empresa" && (
        <section className="mt-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" aria-hidden />
            Sócios (quadro societário público)
          </h2>
          <Card size="sm">
            <CardContent className="flex flex-col divide-y divide-border/40 p-0">
              {SOCIOS_EMPRESA_ALFA.map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 ring-1 ring-slate-200 flex items-center justify-center text-[11px] font-semibold text-slate-700 shrink-0">
                    {iniciais(s.nome)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.qualificacao}
                      {s.documentoMascarado && (
                        <>
                          {" "}· <code className="font-mono">{s.documentoMascarado}</code>
                        </>
                      )}
                    </p>
                  </div>
                  {s.dataEntrada && (
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {new Date(s.dataEntrada).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
          <p className="text-[10px] text-muted-foreground/70 mt-2 leading-relaxed">
            Sócios vêm do quadro societário público do CNPJ (Receita Federal). O CPF é mascarado pela
            fonte. Isto é atributo da empresa — não cria perfil de cidadão.
          </p>
        </section>
      )}

      {/* Contratos relacionados (só para empresa/orgao) */}
      {(tipoEntidade === "empresa" || tipoEntidade === "orgao") && (
        <section className="mt-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Contratos relacionados
          </h2>
          <div className="flex flex-col gap-2">
            <ContratoCard contrato={CONTRATO_DESTAQUE} />
          </div>
        </section>
      )}

      {/* Radar da entidade */}
      {eventosRelacionados.length > 0 && (
        <section className="mt-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Radar desta entidade
          </h2>
          <div className="flex flex-col gap-2">
            {eventosRelacionados.map((e) => (
              <EventoPublicoCard key={e.id} evento={e} />
            ))}
          </div>
        </section>
      )}

      {/* Sinal de atenção (cruzamento) */}
      {tipoEntidade === "empresa" && (
        <section className="mt-5">
          <SinalAtencaoCard sinal={SINAL_EMPRESA_ALFA} />
        </section>
      )}

      {/* Limitações */}
      <section className="mt-5">
        <BlocoLimitacaoDado
          limitacoes={[
            {
              tipo: "dado_ausente",
              mensagem: "Sanções (CEIS/CNEP) ainda não foram ingeridas ao vivo — exigem chave de API CGU.",
              fonte: "cgu-transparencia",
            },
            {
              tipo: "fonte_atrasada",
              mensagem: "TCE-SP: endpoints reais ainda em verificação para Americana.",
              fonte: "tce-sp",
            },
          ]}
        />
      </section>

      <section className="mt-5 mb-2">
        <AvisoSintetico />
      </section>
    </AppShell>
  );
}

function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function normalizarTipo(tipo: string): TipoEntidade {
  if (tipo === "pessoa-publica") return "pessoa_publica";
  if (tipo === "unidade-orgao") return "unidade_orgao";
  const valid: TipoEntidade[] = [
    "empresa",
    "orgao",
    "unidade_orgao",
    "pessoa_publica",
    "contrato",
    "obra",
    "lei",
    "documento",
    "territorio",
    "tema",
  ];
  return (valid as readonly string[]).includes(tipo) ? (tipo as TipoEntidade) : "empresa";
}
