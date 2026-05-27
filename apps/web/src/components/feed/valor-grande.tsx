/**
 * ValorGrande — número público em tipo grande + subtexto conversacional.
 *
 * Usado quando o valor é a primeira pergunta do usuário ("quanto?"). Tom
 * leve, sem terminologia contábil. Âncora comparativa opcional, sempre
 * com fonte indicada.
 */
import { cn } from "@/lib/utils";

export function ValorGrande({
  valor,
  subtexto,
  ancora,
  ancoraFonte,
  className,
}: {
  /** Texto formatado pronto: "R$ 1,24 milhão" ou "R$ 312 mil". */
  valor: string;
  /** "para manutenção de escolas" — frase curta em sentence case. */
  subtexto?: string;
  /** "equivale a 0,7% do orçamento de educação". Opcional. */
  ancora?: string;
  /** "calculado a partir da LOA 2026" — fonte da âncora. */
  ancoraFonte?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <p className="text-[var(--political)] text-4xl font-bold tracking-tight tabular-nums leading-none">
        {valor}
      </p>
      {subtexto && <p className="text-base text-foreground/80">{subtexto}</p>}
      {ancora && (
        <p className="text-xs text-muted-foreground mt-1.5">
          {ancora}
          {ancoraFonte && (
            <span className="text-muted-foreground/60"> · {ancoraFonte}</span>
          )}
        </p>
      )}
    </div>
  );
}
