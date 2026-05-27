/**
 * EmptyState — substitui o "ainda não temos isso" sem cara de erro.
 *
 * Mostra ícone + frase amigável + uma nota honesta de limitação (qual fonte
 * está faltando). Sempre orientado a próximo passo verificável.
 */
import { cn } from "@/lib/utils";

export function EmptyState({
  icone,
  titulo,
  descricao,
  acao,
  className,
}: {
  icone: React.ReactNode;
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-muted/40 px-5 py-10 flex flex-col items-center text-center gap-3",
        className,
      )}
    >
      <span className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center text-3xl">
        {icone}
      </span>
      <h3 className="text-base font-semibold tracking-tight">{titulo}</h3>
      {descricao && (
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{descricao}</p>
      )}
      {acao}
    </div>
  );
}
