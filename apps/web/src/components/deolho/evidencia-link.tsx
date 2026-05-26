/**
 * EvidenciaLink — link estruturado para uma fonte/documento.
 *
 * Regra: nunca usar "clique aqui". O texto do link deve explicar destino +
 * fonte. Datas de publicação/coleta visíveis quando disponíveis.
 */
import { ExternalLink, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FonteId } from "@/lib/civic-types";
import { FonteBadge } from "./badges";

export interface EvidenciaItem {
  titulo: string;
  fonte: FonteId;
  url?: string;
  tipoDocumento?: string;
  dataPublicacao?: string;
  dataColeta?: string;
  estado?: "disponivel" | "indisponivel" | "atrasado" | "parcial" | "sintetico";
}

export function EvidenciaLink({ ev, className }: { ev: EvidenciaItem; className?: string }) {
  const indisponivel = ev.estado === "indisponivel";
  const sintetico = ev.estado === "sintetico";
  const body = (
    <div className="flex items-start gap-2 min-w-0">
      <FileText className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium truncate", indisponivel && "line-through text-muted-foreground")}>
          {ev.titulo}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <FonteBadge fonte={ev.fonte} isSynthetic={sintetico} />
          {ev.dataPublicacao && (
            <span className="text-[10px] text-muted-foreground">
              pub. {new Date(ev.dataPublicacao).toLocaleDateString("pt-BR")}
            </span>
          )}
          {ev.dataColeta && (
            <span className="text-[10px] text-muted-foreground/70">
              coleta {new Date(ev.dataColeta).toLocaleDateString("pt-BR")}
            </span>
          )}
          {indisponivel && (
            <span className="text-[10px] text-rose-700">fonte indisponível</span>
          )}
        </div>
      </div>
      {ev.url && !indisponivel && (
        <ExternalLink className="w-3.5 h-3.5 mt-1 shrink-0 text-muted-foreground" aria-hidden />
      )}
    </div>
  );

  const baseCls = cn(
    "block rounded-xl border border-border/60 bg-card px-3 py-2.5 transition-colors",
    !indisponivel && "hover:bg-muted/60",
    className,
  );
  if (ev.url && !indisponivel) {
    return (
      <a
        href={ev.url}
        target="_blank"
        rel="noopener noreferrer"
        className={baseCls}
        aria-label={`Abrir ${ev.titulo} na fonte ${ev.fonte}`}
      >
        {body}
      </a>
    );
  }
  return <div className={baseCls}>{body}</div>;
}
