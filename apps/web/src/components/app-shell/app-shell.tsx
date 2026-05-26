/**
 * AppShell — composição do layout cívico mobile-first.
 *
 * Estrutura:
 *  - Top search bar (sticky, persistente).
 *  - Conteúdo (children) com max-width pra leitura confortável.
 *  - Mobile bottom nav (md:hidden, com safe-area-inset).
 *  - (Futuro: desktop sidebar + painel de evidência lateral.)
 */
import type { ReactNode } from "react";
import { TopSearchBar } from "./top-search-bar";
import { MobileBottomNav } from "./mobile-bottom-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col bg-background text-foreground">
      <TopSearchBar />
      <div className="flex-1 w-full pb-[calc(env(safe-area-inset-bottom)+4.5rem)] md:pb-0">
        <div className="max-w-3xl mx-auto px-4 py-4">{children}</div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
