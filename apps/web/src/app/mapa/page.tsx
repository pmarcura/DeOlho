/**
 * /mapa — placeholder honesto até existir tipagem geo nos atos.
 *
 * Quando a fonte (PNCP, TCE-SP ou SIAFIC municipal) publicar território
 * impactado, esta tela carrega o leaflet com obras/contratos por bairro.
 * Por enquanto, mostra honestamente o que falta.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Map as MapIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { EmptyState } from "@/components/feed/empty-state";
import { GeoBreadcrumb } from "@/components/feed/geo-breadcrumb";

export const metadata: Metadata = {
  title: "Mapa — DeOlho",
};

export default function MapaPage() {
  return (
    <AppShell>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden />
        voltar
      </Link>

      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight leading-tight">Mapa</h1>
        <p className="text-sm text-foreground/70 mt-0.5">
          Onde a coisa pública está acontecendo na cidade.
        </p>
      </header>

      <GeoBreadcrumb
        niveis={[
          { label: "Brasil", href: "/explorar" },
          { label: "SP", href: "/explorar?uf=SP" },
          { label: "Americana", href: "/", ativo: true },
        ]}
        className="mb-4"
      />

      <EmptyState
        icone="🗺️"
        titulo="Mapa em construção"
        descricao="Vamos plotar obras, contratos e atos por bairro de Americana assim que a fonte (PNCP, TCE ou SIAFIC) publicar a localização — o PNCP hoje não traz território impactado, e o portal municipal está com a seção SIAFIC marcada 'em breve'."
        acao={
          <Link
            href="/radar"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--political)] mt-1"
          >
            ver o radar
            <MapIcon className="w-3.5 h-3.5" aria-hidden />
          </Link>
        }
      />
    </AppShell>
  );
}
