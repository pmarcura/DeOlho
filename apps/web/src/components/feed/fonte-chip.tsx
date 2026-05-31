/**
 * FonteChip — fonte inline, discreta. Alternativa compacta ao FonteBadge.
 *
 * Estilo: "@handle" sutil, sem bloco de cor. Vira link quando há url. Usado
 * principalmente DENTRO do EventoCard pra não competir com o conteúdo.
 */
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export function FonteChip({
  label,
  url,
  className,
}: {
  label: string;
  url?: string;
  className?: string;
}) {
  const inner = (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium",
        url && "hover:text-foreground transition-colors",
        className,
      )}
    >
      {label}
      {url && <ExternalLink className="w-2.5 h-2.5 opacity-60" aria-hidden />}
    </span>
  );
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded"
        aria-label={`Abrir fonte: ${label}`}
      >
        {inner}
      </a>
    );
  }
  return inner;
}
