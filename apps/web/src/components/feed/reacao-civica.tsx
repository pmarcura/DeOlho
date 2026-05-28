"use client";

/**
 * ReacaoCivica — emoji-reações em OBJETOS (uma lei, um contrato, uma sanção).
 *
 * NUNCA em pessoas. As reações são sinais coletivos, não juízo moral:
 *  - 👀  curioso        — "vi, quero ver mais"
 *  - 🤔  não entendi    — "preciso de explicação/contexto"
 *  - 💸  toca no bolso  — "isso afeta a minha vida"
 *  - 🚩  vale revisão   — "vale auditoria/checagem formal"
 *
 * Display-only otimista nesta fase (sem auth). Tap = incrementa localmente.
 * Quando pseudônimo verificado existir, vira persistente + dedup por usuário.
 */
import { useState } from "react";
import { cn } from "@/lib/utils";

type Reacao = "curioso" | "duvida" | "bolso" | "revisao";

const REACOES: { key: Reacao; emoji: string; label: string }[] = [
  { key: "curioso", emoji: "👀", label: "Curioso" },
  { key: "duvida", emoji: "🤔", label: "Não entendi" },
  { key: "bolso", emoji: "💸", label: "Toca no meu bolso" },
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
    curioso: contagem?.curioso ?? 0,
    duvida: contagem?.duvida ?? 0,
    bolso: contagem?.bolso ?? 0,
    revisao: contagem?.revisao ?? 0,
  }));
  const [mine, setMine] = useState<Record<Reacao, boolean>>({
    curioso: false,
    duvida: false,
    bolso: false,
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
          title={r.label}
          className={cn(
            "inline-flex items-center gap-1 px-2 h-9 rounded-full text-sm transition-all",
            "active:scale-95",
            mine[r.key]
              ? "bg-[var(--political)]/8 text-[var(--political)] ring-1 ring-[var(--political)]/15"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          <span className="text-base leading-none" aria-hidden>
            {r.emoji}
          </span>
          <span className="tabular-nums text-xs">{state[r.key]}</span>
        </button>
      ))}
    </div>
  );
}
