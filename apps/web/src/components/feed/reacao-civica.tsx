"use client";

/**
 * ReacaoCivica — reacoes estruturadas em objetos publicos.
 *
 * NUNCA em pessoas. Reacoes sao opinioes de usuario, nao fatos oficiais.
 * Nesta fase sao otimistas e locais; persistencia exige auth e moderacao.
 */
import { useState } from "react";
import { CircleHelp, Scale, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReacaoCivicaTipo = "apoio" | "parcial" | "contra" | "faltou_informacao";

const REACOES: {
  key: ReacaoCivicaTipo;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "apoio", label: "Apoio", icon: ThumbsUp },
  { key: "parcial", label: "Parcial", icon: Scale },
  { key: "contra", label: "Contra", icon: ThumbsDown },
  { key: "faltou_informacao", label: "Faltou informação", icon: CircleHelp },
];

export function ReacaoCivica({
  contagem,
  className,
}: {
  contagem?: Partial<Record<ReacaoCivicaTipo, number>>;
  className?: string;
}) {
  const [state, setState] = useState<Record<ReacaoCivicaTipo, number>>(() => ({
    apoio: contagem?.apoio ?? 0,
    parcial: contagem?.parcial ?? 0,
    contra: contagem?.contra ?? 0,
    faltou_informacao: contagem?.faltou_informacao ?? 0,
  }));
  const [mine, setMine] = useState<Record<ReacaoCivicaTipo, boolean>>({
    apoio: false,
    parcial: false,
    contra: false,
    faltou_informacao: false,
  });

  function toggle(k: ReacaoCivicaTipo) {
    setMine((m) => {
      const novo = !m[k];
      setState((s) => ({ ...s, [k]: Math.max(0, s[k] + (novo ? 1 : -1)) }));
      return { ...m, [k]: novo };
    });
  }

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      aria-label="Reações cívicas: opinião de usuários, não fato oficial"
    >
      {REACOES.map((r) => {
        const Icon = r.icon;
        return (
          <button
            key={r.key}
            type="button"
            onClick={() => toggle(r.key)}
            aria-pressed={mine[r.key]}
            aria-label={`${r.label} (${state[r.key]})`}
            title={r.label}
            className={cn(
              "inline-flex h-9 items-center gap-1 rounded-full px-2 text-sm transition-all",
              "active:scale-95",
              mine[r.key]
                ? "bg-[var(--political)]/8 text-[var(--political)] ring-1 ring-[var(--political)]/15"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span className="tabular-nums text-xs">{state[r.key]}</span>
          </button>
        );
      })}
    </div>
  );
}
