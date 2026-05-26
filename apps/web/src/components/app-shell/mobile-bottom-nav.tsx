"use client";

/**
 * MobileBottomNav — navegação inferior do mobile.
 *
 * Itens: Início · Radar · (+) · Explorar · Mapa
 * O botão "+" abre o ContextualActionDrawer (não é "criar post" — é ações
 * permitidas por rota: acompanhar, reportar erro, contribuir contexto,
 * exportar, citar página).
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Radar, Compass, Map, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Início", icon: Home },
  { href: "/radar", label: "Radar", icon: Radar },
  { href: "/explorar", label: "Explorar", icon: Compass },
  { href: "/mapa", label: "Mapa", icon: Map },
] as const;

export function MobileBottomNav({ onPlus }: { onPlus?: () => void }) {
  const pathname = usePathname() ?? "/";

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "md:hidden fixed bottom-0 inset-x-0 z-40",
        "bg-card/95 backdrop-blur-md border-t border-border/70",
        "pb-[max(env(safe-area-inset-bottom),0.25rem)]",
      )}
    >
      <ul className="grid grid-cols-5 items-center max-w-md mx-auto">
        {ITEMS.slice(0, 2).map((it) => (
          <NavItem key={it.href} {...it} active={isActive(it.href)} />
        ))}
        <li className="flex items-center justify-center">
          <button
            type="button"
            onClick={onPlus}
            aria-label="Ações contextuais"
            className={cn(
              "w-12 h-12 -mt-5 rounded-full bg-[var(--political)] text-white shadow-lg ring-4 ring-card",
              "flex items-center justify-center hover:bg-[var(--political)]/90 transition-colors",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--political)]/30",
            )}
          >
            <Plus className="w-5 h-5" aria-hidden />
          </button>
        </li>
        {ITEMS.slice(2).map((it) => (
          <NavItem key={it.href} {...it} active={isActive(it.href)} />
        ))}
      </ul>
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors",
          "min-h-12", // alvo de toque
          active ? "text-[var(--political)]" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Icon className="w-5 h-5" aria-hidden />
        <span className="text-[10px] font-medium leading-none">{label}</span>
      </Link>
    </li>
  );
}
