/**
 * TrustHint — confiança da fonte como ÍCONE sutil, não chip berrante.
 *
 * Alternativa compacta ao TipoInformacaoBadge em superfícies densas. A intenção
 * é deixar a confiança presente e clicável sem dominar a hierarquia visual.
 *
 * Quando precisar de label completo, usar TipoInformacaoBadge (em páginas de
 * detalhe técnicas).
 */
import { BadgeCheck, AlertTriangle, Bot, FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

export type TrustLevel = "oficial" | "incompleto" | "explicacao_ia" | "revisao_pendente";

const HINT: Record<
  TrustLevel,
  { icon: React.ComponentType<{ className?: string }>; cls: string; label: string }
> = {
  oficial: {
    icon: BadgeCheck,
    cls: "text-emerald-600",
    label: "Fonte oficial",
  },
  incompleto: {
    icon: AlertTriangle,
    cls: "text-amber-600",
    label: "Dado incompleto",
  },
  explicacao_ia: {
    icon: Bot,
    cls: "text-violet-600",
    label: "Explicação por IA",
  },
  revisao_pendente: {
    icon: FileQuestion,
    cls: "text-sky-600",
    label: "Revisão pendente",
  },
};

export function TrustHint({
  level,
  className,
}: {
  level: TrustLevel;
  className?: string;
}) {
  const cfg = HINT[level];
  const Icon = cfg.icon;
  return (
    <span
      title={cfg.label}
      aria-label={cfg.label}
      className={cn("inline-flex items-center", cfg.cls, className)}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden />
    </span>
  );
}
