"use client";

/**
 * ReacaoCivica — emoji-reações em OBJETOS (uma edição, um contrato, uma sanção).
 *
 * NUNCA em pessoas. As reações são sinais de atenção coletiva, não juízo moral:
 *  - 👀  vi/observo  (curiosidade, marcação)
 *  - 🤔  fiquei na dúvida (precisa explicação/contexto)
 *  - 🚩  vale revisão (sinal de atenção formal)
 *
 * Display-only otimista nesta fase (sem auth/persistência). Tap = incrementa
 * localmente. Quando pseudônimo verificado existir, vira persistente + dedup.
 */
import { useState } from "react";
import { cn } from "@/lib/utils";

type Reacao = "ver" | "duvida" | "revisao";

const REACOES: { key: Reacao; emoji: string; label: string }[] = [
  { key: "ver", emoji: "👀", label: "Vi isso" },
  { key: "duvida", emoji: "🤔", label: "Fiquei na dúvida" },
  { key: "revisao", emoji: "🚩", label: "Vale revisão" },
];

export function ReacaoCivica({
  contagem,
  className,
}: {
  contagem?: Partial<Record<Reacao, number>>;
  className?: string;
}) {
  const [state, setState] = useState<Record<Reacao, number>>(() => ({
    ver: contagem?.ver ?? 0,
    duvida: contagem?.duvida ?? 0,
    revisao: contagem?.revisao ?? 0,
  }));
  const [mine, setMine] = useState<Record<Reacao, boolean>>({
    ver: false,
    duvida: false,
    revisao: false,
  });

  function toggle(k: Reacao) {
    setMine((m) => {
      const novo = !m[k];
      setState((s) => ({ ...s, [k]: Math.max(0, s[k] + (novo ? 1 : -1)) }));
      return { ...m, [k]: novo };
    });
  }

  return (
    <div className={cn("flex items-center gap-1", className)} aria-label="Reações cívicas">
      {REACOES.map((r) => (
        <button
          key={r.key}
          type="button"
          onClick={() => toggle(r.key)}
          aria-pressed={mine[r.key]}
          aria-label={`${r.label} (${state[r.key]})`}
          className={cn(
            "inline-flex items-center gap-1 px-2 h-8 rounded-full text-sm transition-colors",
            "min-w-12 justify-center", // alvo de toque
            mine[r.key]
              ? "bg-[var(--political)]/8 text-[var(--political)] ring-1 ring-[var(--political)]/15"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          <span className="text-base leading-none">{r.emoji}</span>
          <span className="tabular-nums text-xs">{state[r.key]}</span>
        </button>
      ))}
    </div>
  );
}
