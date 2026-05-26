/**
 * Página de contrato — a "página viva" do MVP do DeOlho (docs/patterns/telas.md).
 *
 * Layout mobile-first: header com identidade do contrato + valor ancorado + grandes
 * blocos de fato + linha do tempo + evidências + limitações.
 * Toda informação carrega fonte, data e confiança. Nada é apresentado como
 * conclusão moral.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import {
  TipoInformacaoBadge,
  ConfiancaBadge,
  FonteBadge,
  ChipDataColeta,
} from "@/components/deolho/badges";
import { BlocoExplicacaoIA, BlocoLimitacaoDado, AvisoSintetico } from "@/components/deolho/blocos";
import { EntidadeCard, EventoPublicoCard, SinalAtencaoCard } from "@/components/deolho/cards";
import { EvidenciaLink, type EvidenciaItem } from "@/components/deolho/evidencia-link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CONTRATO_DESTAQUE,
  EVENTOS_RADAR,
  SINAL_EMPRESA_ALFA,
} from "@/lib/civic-data";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Contrato ${id} — DeOlho`,
    description: "Página viva de contrato público — fonte, confiança e limitações declaradas.",
  };
}

export default async function ContratoPage({ params }: PageProps) {
  const { id } = await params;
  // Em produção: db query por id. Aqui usamos a fixture única.
  const contrato = CONTRATO_DESTAQUE;

  const evidencias: EvidenciaItem[] = [
    {
      titulo: `Publicação sintética PNCP — ${contrato.numero}`,
      fonte: "pncp",
      dataPublicacao: contrato.dataAssinatura,
      dataColeta: "2026-05-25",
      estado: "sintetico",
    },
    {
      titulo: `Diário Oficial de Americana — menção ao contrato`,
      fonte: "diario-americana",
      dataPublicacao: "2026-05-04",
      dataColeta: "2026-05-25",
      estado: "sintetico",
    },
  ];

  const eventosDoContrato = EVENTOS_RADAR.filter(
    (e) => e.href?.includes(contrato.id) || e.entidades.some((en) => en.id === contrato.empresa?.id),
  );

  return (
    <AppShell>
      {/* Crumb */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        aria-label="Voltar ao início"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
        Voltar
      </Link>

      {/* Header de contrato */}
      <section className="flex flex-col gap-2 pb-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {contrato.numero}
          </span>
          <TipoInformacaoBadge tipo={contrato.tipoInformacao} size="xs" />
        </div>
        <h1 className="text-xl font-bold tracking-tight leading-tight">{contrato.objeto}</h1>
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          <FonteBadge fonte={contrato.fonte.id} isSynthetic={contrato.fonte.isSynthetic} />
          <ConfiancaBadge nivel={contrato.confianca} />
          {contrato.status && (
            <span className="text-[10px] text-muted-foreground ml-auto">{contrato.status}</span>
          )}
        </div>
      </section>

      {/* Valor ancorado (componente embutido) */}
      <section className="mt-4">
        <Card>
          <CardContent className="flex flex-col gap-1 py-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Valor contratado
            </p>
            <p className="text-3xl font-bold tracking-tight text-primary tabular-nums leading-none">
              {contrato.valorTexto}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Equivalente a aproximadamente{" "}
              <strong className="font-medium text-foreground">0,7%</strong> do orçamento sintético
              de Educação 2026 do município.
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              Âncora sintética para demonstração. Em produção, calculada a partir da LOA.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Resumo verificável (IA) */}
      <section className="mt-4">
        <BlocoExplicacaoIA
          texto="Contrato sintético de manutenção escolar firmado entre a Prefeitura sintética de Americana e uma fornecedora sintética. A fonte PNCP traz objeto, valor, vigência e fornecedor; o território impactado (bairros/escolas) não consta no payload."
          fontesUsadas={[{ fonte: "pncp" }]}
          limitacoes={["A fonte PNCP não informa território impactado."]}
          geradoEm="2026-05-25"
        />
      </section>

      {/* Partes envolvidas — órgão e fornecedor */}
      <section className="mt-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Partes envolvidas
        </h2>
        <div className="flex flex-col gap-2">
          <EntidadeCard entidade={contrato.orgao} subtitulo="Órgão contratante" />
          {contrato.empresa && (
            <EntidadeCard entidade={contrato.empresa} subtitulo="Fornecedor contratado" />
          )}
        </div>
      </section>

      {/* Linha do tempo */}
      <section className="mt-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" aria-hidden />
          Linha do tempo
        </h2>
        <ol className="relative pl-4 border-l border-border/60 flex flex-col gap-2.5">
          <TimelineItem
            data={contrato.dataAssinatura!}
            tipo="Assinatura"
            descricao={`Contrato assinado · vigência até ${contrato.vigenciaFim}`}
            fonte="pncp"
          />
          {eventosDoContrato.length > 0 && (
            <div className="flex flex-col gap-2 ml-1">
              {eventosDoContrato.slice(0, 2).map((e) => (
                <EventoPublicoCard key={e.id} evento={e} />
              ))}
            </div>
          )}
        </ol>
      </section>

      {/* Sinal de atenção (cruzamento por CNPJ) */}
      <section className="mt-5">
        <SinalAtencaoCard sinal={SINAL_EMPRESA_ALFA} />
      </section>

      {/* Limitações */}
      {contrato.limitacoes?.length ? (
        <section className="mt-5">
          <BlocoLimitacaoDado limitacoes={contrato.limitacoes} />
        </section>
      ) : null}

      {/* Evidências */}
      <section className="mt-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Evidências
        </h2>
        <div className="flex flex-col gap-2">
          {evidencias.map((ev, i) => (
            <EvidenciaLink key={i} ev={ev} />
          ))}
        </div>
      </section>

      {/* Ações cívicas (não-social) */}
      <section className="mt-5 grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="justify-start">
          Reportar erro nos dados
        </Button>
        <Button variant="outline" size="sm" className="justify-start">
          Citar esta página
        </Button>
      </section>

      <section className="mt-5 mb-2">
        <AvisoSintetico />
      </section>

      <p className="text-[10px] text-muted-foreground/60 text-center mb-2">
        id da rota: <code className="font-mono">{id}</code>
      </p>
    </AppShell>
  );
}

function TimelineItem({
  data,
  tipo,
  descricao,
  fonte,
}: {
  data: string;
  tipo: string;
  descricao: string;
  fonte: "pncp" | "tce-sp" | "diario-americana";
}) {
  return (
    <li className="relative pl-2">
      <span className="absolute -left-[1.05rem] top-1 w-2.5 h-2.5 rounded-full bg-[var(--political)] ring-4 ring-card" />
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-mono text-muted-foreground">
          {new Date(data).toLocaleDateString("pt-BR")}
        </span>
        <span className="text-xs font-semibold">{tipo}</span>
        <FonteBadge fonte={fonte} />
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{descricao}</p>
    </li>
  );
}
