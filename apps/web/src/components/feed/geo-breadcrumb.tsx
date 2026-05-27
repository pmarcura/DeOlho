/**
 * GeoBreadcrumb — drill-down territorial (Brasil → SP → Americana → bairro).
 *
 * Mobile-first: chips conectados por chevron, scroll horizontal se passar da
 * largura. Cada nível clicável volta o foco pra aquela camada. O nível ativo
 * vem em destaque suave (sem cor primary forte, pra não competir com o feed).
 */
import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GeoNivel {
  label: string;
  href: string;
  ativo?: boolean;
}

export function GeoBreadcrumb({
  niveis,
  className,
}: {
  niveis: GeoNivel[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Onde você está"
      className={cn("-mx-4 px-4 overflow-x-auto", className)}
    >
      <ol className="flex items-center gap-1 text-xs">
        {niveis.map((n, i) => (
          <li key={i} className="flex items-center gap-1 shrink-0">
            {i === 0 && <MapPin className="w-3 h-3 text-muted-foreground" aria-hidden />}
            <Link
              href={n.href}
              aria-current={n.ativo ? "location" : undefined}
              className={cn(
                "px-2 py-1 rounded-full transition-colors",
                n.ativo
                  ? "bg-foreground/8 text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {n.label}
            </Link>
            {i < niveis.length - 1 && (
              <ChevronRight className="w-3 h-3 text-muted-foreground/50" aria-hidden />
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
