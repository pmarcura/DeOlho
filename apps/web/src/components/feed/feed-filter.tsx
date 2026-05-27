/**
 * FeedFilter — chips de categoria no topo do feed (Instagram explore-style).
 *
 * Cada chip linka para a mesma página com ?cat=X via Next Link — o filtro é
 * server-side (a Home re-renderiza com átomos filtrados). Sem state cliente.
 */
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { CategoriaFeed } from "@/lib/atoms";

interface ChipConfig {
  id: CategoriaFeed;
  label: string;
  emoji: string;
}

const CHIPS: ChipConfig[] = [
  { id: "tudo", label: "tudo", emoji: "✨" },
  { id: "dinheiro", label: "dinheiro", emoji: "💰" },
  { id: "leis", label: "leis", emoji: "📜" },
  { id: "atos", label: "atos", emoji: "📃" },
  { id: "convenios", label: "convênios", emoji: "🤝" },
];

export function FeedFilter({
  ativo,
  basePath = "/",
  className,
}: {
  ativo: CategoriaFeed;
  basePath?: string;
  className?: string;
}) {
  return (
    <nav
      aria-label="Filtrar feed por categoria"
      className={cn("-mx-4 px-4 overflow-x-auto", className)}
    >
      <ul className="flex items-center gap-2 pb-1">
        {CHIPS.map((c) => {
          const isActive = c.id === ativo;
          const href = c.id === "tudo" ? basePath : `${basePath}?cat=${c.id}`;
          return (
            <li key={c.id} className="shrink-0">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-foreground text-background"
                    : "bg-foreground/5 text-foreground/80 hover:bg-foreground/10",
                )}
              >
                <span className="leading-none" aria-hidden>
                  {c.emoji}
                </span>
                {c.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
