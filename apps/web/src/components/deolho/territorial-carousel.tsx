"use client";

/**
 * TerritorialCarousel — carrossel horizontal de territórios/temas.
 *
 * Mobile-first: scroll horizontal nativo com snap. Não esconde filtros
 * essenciais aqui — é navegação contextual, não substituto de busca.
 */
import { MapPin, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TerritorioItem } from "@/lib/civic-types";

export function TerritorialCarousel({
  items,
  selectedId,
  onSelect,
  ariaLabel = "Navegar por território ou tema",
}: {
  items: TerritorioItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  ariaLabel?: string;
}) {
  return (
    <nav aria-label={ariaLabel} className="overflow-x-auto scrollbar-thin -mx-4 px-4">
      <ul className="flex items-center gap-2 snap-x snap-mandatory pb-1">
        {items.map((it) => {
          const ativo = selectedId === it.id;
          const Icon = it.tipo === "tema" ? Tag : MapPin;
          return (
            <li key={it.id} className="snap-start shrink-0">
              <button
                type="button"
                onClick={() => onSelect?.(it.id)}
                aria-pressed={ativo}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 transition-colors",
                  ativo
                    ? "bg-[var(--territorial)] text-white ring-[var(--territorial)]"
                    : "bg-[var(--territorial-soft)] text-[var(--territorial)] ring-[var(--territorial)]/15 hover:bg-[var(--territorial)]/10",
                )}
              >
                <Icon className="w-3 h-3" aria-hidden />
                {it.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
