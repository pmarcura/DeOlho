/**
 * Mapa territorial — placeholder mobile.
 *
 * Camada de mapa real (leaflet/maplibre) entra após o modelo geoespacial
 * (territórios + obras por bairro) existir. Esta tela explica o que vai aqui
 * e oferece próxima ação concreta.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Map as MapIcon } from "lucide-react";
import { AppShell } from "@/components/app-shell/app-shell";
import { TerritorialCarousel } from "@/components/deolho/territorial-carousel";
import { AvisoSintetico, BlocoLimitacaoDado } from "@/components/deolho/blocos";
import { Button } from "@/components/ui/button";
import { TERRITORIOS } from "@/lib/civic-data";

export const metadata: Metadata = {
  title: "Mapa — DeOlho",
};

export default function MapaPage() {
  return (
    <AppShell>
      <section className="flex flex-col gap-1 pb-1">
        <h1 className="text-xl font-bold tracking-tight leading-tight">Mapa territorial</h1>
        <p className="text-sm text-muted-foreground">
          Obras, contratos e atos plotados por bairro de Americana.
        </p>
      </section>

      <section className="mt-4">
        <TerritorialCarousel items={TERRITORIOS} selectedId="americana" />
      </section>

      <section className="mt-4 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-4 py-10 flex flex-col items-center text-center gap-3">
        <span className="w-14 h-14 rounded-2xl bg-[var(--political-soft)] text-[var(--political)] flex items-center justify-center">
          <MapIcon className="w-7 h-7" aria-hidden />
        </span>
        <h2 className="text-base font-semibold">Camada de mapa em construção</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Vamos plotar obras, contratos e atos por bairro de Americana assim que o modelo
          geoespacial (territórios e localização declarada) entrar no banco. A fonte PNCP
          atual não publica território impactado.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/radar">Ver radar enquanto isso</Link>
        </Button>
      </section>

      <section className="mt-5">
        <BlocoLimitacaoDado
          limitacoes={[
            {
              tipo: "dado_ausente",
              mensagem: "A fonte PNCP não informa território impactado dos contratos.",
              fonte: "pncp",
              campoAfetado: "territorio",
            },
            {
              tipo: "fonte_indisponivel",
              mensagem: "SIAFIC de Americana com despesas por território está marcada 'em breve'.",
              fonte: "transparencia-americana",
            },
          ]}
        />
      </section>

      <section className="mt-5 mb-2">
        <AvisoSintetico />
      </section>
    </AppShell>
  );
}
