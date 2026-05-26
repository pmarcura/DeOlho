/**
 * Cards cívicos — EntidadeCard, EventoPublicoCard, ContratoCard, SinalAtencaoCard.
 *
 * Regra de ouro: TODO card público expõe tipo, fonte e confiança quando
 * aplicável. SinalAtencao SEMPRE traz aviso obrigatório no corpo.
 * Nunca: linguagem acusatória, ranking, like ou comentário livre.
 */
import Link from "next/link";
import { ArrowUpRight, BookmarkPlus, FileText, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ContratoUI,
  EntidadeRef,
  EventoPublico,
  SinalAtencao,
} from "@/lib/civic-types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TipoInformacaoBadge, ConfiancaBadge, FonteBadge } from "./badges";
import { EntidadeAvatar } from "./entidade-avatar";
import { SinalAvisoObrigatorio, BlocoLimitacaoDado } from "./blocos";

// ── EntidadeCard ─────────────────────────────────────────────────────────────
export function EntidadeCard({
  entidade,
  subtitulo,
  isSynthetic = true,
}: {
  entidade: EntidadeRef;
  subtitulo?: string;
  isSynthetic?: boolean;
}) {
  const inner = (
    <Card size="sm" className="hover:shadow-sm transition-shadow">
      <CardContent className="flex items-center gap-3 py-1">
        <EntidadeAvatar tipo={entidade.tipo} nome={entidade.nome} size="md" isSynthetic={isSynthetic} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {labelTipo(entidade.tipo)}
          </p>
          <p className="text-sm font-medium truncate leading-snug">{entidade.nome}</p>
          {subtitulo && (
            <p className="text-xs text-muted-foreground truncate">{subtitulo}</p>
          )}
        </div>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
      </CardContent>
    </Card>
  );
  if (entidade.href) {
    return (
      <Link
        href={entidade.href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-xl"
        aria-label={`Abrir página de ${labelTipo(entidade.tipo)}: ${entidade.nome}`}
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

function labelTipo(tipo: EntidadeRef["tipo"]): string {
  switch (tipo) {
    case "empresa":
      return "Empresa";
    case "orgao":
      return "Órgão público";
    case "unidade_orgao":
      return "Unidade de órgão";
    case "pessoa_publica":
      return "Agente público";
    case "contrato":
      return "Contrato";
    case "obra":
      return "Obra";
    case "lei":
      return "Lei";
    case "documento":
      return "Documento";
    case "territorio":
      return "Território";
    case "tema":
      return "Tema";
  }
}

// ── EventoPublicoCard ────────────────────────────────────────────────────────
export function EventoPublicoCard({
  evento,
  className,
}: {
  evento: EventoPublico;
  className?: string;
}) {
  const ts = new Date(evento.timestamp);
  const dataCurta = ts.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const entidadePrimaria = evento.entidades[0];

  const content = (
    <Card size="sm" className="hover:shadow-sm transition-shadow">
      <CardContent className="flex flex-col gap-3">
        {/* topo: tipo + timestamp */}
        <div className="flex items-center justify-between gap-2">
          <TipoInformacaoBadge tipo={evento.tipoInformacao} size="xs" />
          <span className="text-[10px] text-muted-foreground tabular-nums">{dataCurta}</span>
        </div>

        {/* corpo */}
        <div className="flex items-start gap-3">
          {entidadePrimaria && (
            <EntidadeAvatar
              tipo={entidadePrimaria.tipo}
              nome={entidadePrimaria.nome}
              size="md"
              isSynthetic={evento.fonte.isSynthetic}
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug">{evento.titulo}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{evento.resumo}</p>
          </div>
        </div>

        {/* rodapé: badges de fonte/confiança + indicador (NÃO link aninhado:
            o card inteiro já é o link quando há href) */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <FonteBadge
              fonte={evento.fonte.id}
              estadoFonte={evento.fonte.estado}
              isSynthetic={evento.fonte.isSynthetic}
            />
            <ConfiancaBadge nivel={evento.confianca} />
          </div>
          {evento.href && (
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--political)]">
              Ver evidência
              <ArrowUpRight className="w-3 h-3" aria-hidden />
            </span>
          )}
        </div>

        {evento.limitacoes?.length ? <BlocoLimitacaoDado limitacoes={evento.limitacoes} /> : null}
      </CardContent>
    </Card>
  );

  if (evento.href) {
    return (
      <Link
        href={evento.href}
        className={cn("block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-xl", className)}
        aria-label={evento.titulo}
      >
        {content}
      </Link>
    );
  }
  return <div className={className}>{content}</div>;
}

// ── ContratoCard ─────────────────────────────────────────────────────────────
export function ContratoCard({ contrato, className }: { contrato: ContratoUI; className?: string }) {
  const valorTexto = contrato.valorTexto
    ?? (contrato.valor != null
      ? contrato.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "Valor não informado");
  const semValor = contrato.valor == null && !contrato.valorTexto;

  return (
    <Link
      href={`/contrato/${contrato.id}`}
      className={cn("block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded-xl", className)}
      aria-label={`Contrato ${contrato.numero}: ${contrato.objeto}`}
    >
      <Card size="sm" className="hover:shadow-sm transition-shadow">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">{contrato.numero}</span>
            <TipoInformacaoBadge tipo={contrato.tipoInformacao} size="xs" />
          </div>

          <p className="text-sm font-medium leading-snug line-clamp-2">{contrato.objeto}</p>

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Valor contratado</p>
              <p
                className={cn(
                  "font-semibold tracking-tight tabular-nums",
                  semValor ? "text-muted-foreground text-sm" : "text-primary text-lg",
                )}
              >
                {valorTexto}
              </p>
            </div>
            {contrato.empresa && (
              <div className="text-right min-w-0">
                <p className="text-[10px] text-muted-foreground">Fornecedor</p>
                <p className="text-xs font-medium truncate max-w-[10rem]">{contrato.empresa.nome}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <FonteBadge
              fonte={contrato.fonte.id}
              estadoFonte={contrato.fonte.estado}
              isSynthetic={contrato.fonte.isSynthetic}
            />
            <ConfiancaBadge nivel={contrato.confianca} />
            {contrato.status && (
              <span className="text-[10px] text-muted-foreground ml-auto">{contrato.status}</span>
            )}
          </div>

          {contrato.limitacoes?.length ? (
            <BlocoLimitacaoDado limitacoes={contrato.limitacoes} />
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}

// ── SinalAtencaoCard ─────────────────────────────────────────────────────────
export function SinalAtencaoCard({ sinal, className }: { sinal: SinalAtencao; className?: string }) {
  // severidade NUNCA significa moral — só ajusta a intensidade visual do ícone.
  const ringByVisual: Record<NonNullable<SinalAtencao["severidadeVisual"]>, string> = {
    baixa: "ring-amber-200/60",
    media: "ring-amber-300/70",
    alta: "ring-amber-400/80",
  };
  return (
    <Card
      size="sm"
      className={cn(
        "border-amber-200/60 bg-amber-50/40",
        ringByVisual[sinal.severidadeVisual ?? "baixa"],
        className,
      )}
    >
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-px" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-950 leading-snug">{sinal.titulo}</p>
            <p className="text-xs text-amber-900/80 mt-0.5">{sinal.descricao}</p>
          </div>
        </div>

        <SinalAvisoObrigatorio />

        <div className="text-[11px] text-amber-900/80">
          <p className="font-medium uppercase tracking-wide text-amber-700/70 mb-1">Método</p>
          <p>{sinal.metodo}</p>
        </div>

        {sinal.evidencias.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700/70">
              Evidências
            </p>
            {sinal.evidencias.map((ev, i) => (
              <Link
                key={i}
                href={ev.href}
                className="text-xs text-amber-950 hover:underline flex items-center gap-1.5"
              >
                <FileText className="w-3 h-3" aria-hidden />
                {ev.titulo}
                <FonteBadge fonte={ev.fonte} />
              </Link>
            ))}
          </div>
        )}

        {sinal.limitacoes?.length ? <BlocoLimitacaoDado limitacoes={sinal.limitacoes} /> : null}
      </CardContent>
    </Card>
  );
}
