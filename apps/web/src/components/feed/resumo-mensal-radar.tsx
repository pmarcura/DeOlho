import Link from "next/link";
import { ArrowRight, CalendarDays, Database, ListChecks, Sparkles } from "lucide-react";
import { TipoInformacaoBadge, FonteBadge } from "@/components/deolho/badges";
import { comporEvento } from "@/lib/evento-compositor";
import { categoriaMeta, dataExtensa, fonteLabel, valorBRL, type ResumoMensalRadar } from "@/lib/eventos";
import type { FonteId } from "@/lib/civic-types";

export function ResumoMensalRadarCard({ resumo }: { resumo: ResumoMensalRadar }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border/50 bg-card shadow-sm">
      <div className="relative bg-[linear-gradient(135deg,rgba(45,212,191,0.22),rgba(14,165,233,0.14)_45%,rgba(251,191,36,0.18))] px-4 py-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(255,255,255,0.65),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(255,255,255,0.35),transparent_28%)]" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--source)]/25 bg-background/70 px-2.5 py-1 text-[11px] font-semibold text-foreground/75">
              <Sparkles className="h-3.5 w-3.5 text-[var(--source)]" aria-hidden />
              leitura local do mês
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {resumo.periodoLabel}
            </span>
          </div>
          <h2 className="mt-3 text-xl font-bold leading-tight tracking-tight">{resumo.leitura.titulo}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-foreground/75">{resumo.leitura.texto}</p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-border/40 pb-3 sm:grid-cols-4">
          <ResumoMetric label="eventos do mês" value={resumo.totalEventos.toLocaleString("pt-BR")} />
          <ResumoMetric label="valor citado" value={resumo.totalValor ?? "sem soma"} />
          <ResumoMetric label="fontes" value={resumo.fontes.length.toString()} />
          <ResumoMetric label="período" value={`${dataCurta(resumo.inicio)} a ${dataCurta(resumo.fim)}`} />
        </div>

        {resumo.leitura.pontos.length > 0 && (
          <div className="rounded-md bg-muted/45 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
              <ListChecks className="h-3.5 w-3.5" aria-hidden />
              Para entender o mês
            </div>
            <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-foreground/70">
              {resumo.leitura.pontos.map((ponto) => <li key={ponto}>{ponto}</li>)}
            </ul>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
            <Database className="h-3.5 w-3.5" aria-hidden />
            O que mais aparece
          </div>
          <div className="flex flex-wrap gap-1.5">
            {resumo.porCategoria.map((item) => (
              <span
                key={item.categoria}
                className="rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] text-foreground/75"
              >
                {categoriaMeta(item.categoria).emoji} {categoriaMeta(item.categoria).label}: {item.total.toLocaleString("pt-BR")}
                {item.valor ? ` · ${valorBRL(item.valor)}` : ""}
              </span>
            ))}
          </div>
          {resumo.fontes.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              <span>Fontes do mês:</span>
              {resumo.fontes.map((fonte) => (
                <FonteBadge key={fonte.sourceId} fonte={fonteIdSeguro(fonte.sourceId)} />
              ))}
            </div>
          )}
        </div>

        {resumo.recomendados.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold">Comece por estes acontecimentos do mês</h3>
            <div className="mt-2 divide-y divide-border/50 overflow-hidden rounded-md border border-border/50">
              {resumo.recomendados.slice(0, 5).map((evento) => {
                const composto = comporEvento(evento);
                return (
                  <Link
                    key={evento.id}
                    href={`/evento/${evento.id}`}
                    className="grid gap-1 bg-background/60 px-3 py-2.5 text-sm transition-colors hover:bg-muted/60"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate font-medium">{composto.titulo}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      <TipoInformacaoBadge tipo={composto.tipoInformacao} size="xs" />
                      <span>{fonteLabel(evento.sourceId)}</span>
                      <span>{dataExtensa(evento.dataEvento ?? evento.publishedAt?.toISOString().slice(0, 10) ?? null)}</span>
                      {composto.valorLabel && <span>{composto.valorLabel}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {resumo.leitura.limitacoes.join(" ")} Depois deste resumo, o radar continua com os acontecimentos mais recentes.
        </p>
      </div>
    </section>
  );
}

function ResumoMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function dataCurta(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function fonteIdSeguro(sourceId: string): FonteId {
  const ids = new Set<FonteId>([
    "pncp",
    "tce-sp",
    "cgu-transparencia",
    "querido-diario",
    "diario-americana",
    "transparencia-americana",
    "receita-cnpj",
    "camara-americana",
    "tse",
    "sinteticos",
  ]);
  return ids.has(sourceId as FonteId) ? sourceId as FonteId : "sinteticos";
}
