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
import { Home, Compass, Map } from "lucide-react";
import { cn } from "@/lib/utils";

// Pedro 28/05: 3 itens, sem FAB (+). "Nenhum usuário vai adicionar nada."
const ITEMS = [
  { href: "/", label: "Início", icon: Home },
  { href: "/explorar", label: "Explorar", icon: Compass },
  { href: "/mapa", label: "Mapa", icon: Map },
] as const;

export function MobileBottomNav() {
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
      <ul className="grid grid-cols-3 items-center max-w-md mx-auto">
        {ITEMS.map((it) => (
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
