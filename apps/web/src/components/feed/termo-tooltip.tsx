"use client";

/**
 * TermoTooltip — termo técnico clicável que abre popover inline com definição.
 *
 * Mobile-first: tap no termo → cresce um bloco logo abaixo com a definição
 * em linguagem leiga. Tap fora ou no termo de novo fecha. Sem libraries,
 * só useState + posicionamento absoluto fluido.
 */
import { useState } from "react";
import { Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function TermoTooltip({
  termo,
  definicao,
  className,
  children,
}: {
  termo: string;
  definicao: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-label={`Definição de ${termo}`}
        className={cn(
          "inline-flex items-baseline gap-0.5 rounded px-1 py-0.5 text-[0.92em]",
          "bg-sky-50 text-sky-800 ring-1 ring-sky-200/70",
          "hover:bg-sky-100 transition-colors cursor-pointer",
          open && "bg-sky-100 ring-sky-300/70",
          className,
        )}
      >
        <span className="underline decoration-sky-400/40 decoration-dotted underline-offset-2">
          {children ?? termo}
        </span>
        <Info className="w-2.5 h-2.5 shrink-0 opacity-60" aria-hidden />
      </button>
      {open && (
        <span className="block mt-2 mb-2 rounded-2xl bg-sky-50/80 ring-1 ring-sky-200/60 px-3 py-2.5 text-[13px] text-sky-950 leading-relaxed">
          <span className="flex items-center justify-between gap-2 mb-1">
            <strong className="font-semibold text-sky-800">{termo}</strong>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false); }}
              aria-label="Fechar"
              className="text-sky-600 hover:text-sky-900"
            >
              <X className="w-3.5 h-3.5" aria-hidden />
            </button>
          </span>
          {definicao}
        </span>
      )}
    </span>
  );
}
