import Link from "next/link";
import { Eye, Search, FileText, Building2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-svh gap-8 px-4 py-16">
      <div className="flex flex-col items-center gap-3 text-center max-w-2xl">
        <div className="flex items-center gap-2 text-[var(--political)] font-semibold text-sm tracking-wide uppercase">
          <Eye className="w-4 h-4" />
          DeOlho
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-balance">
          Transparência cívica para qualquer cidadão
        </h1>
        <p className="text-muted-foreground text-lg text-balance">
          Transformamos dados públicos difíceis em conhecimento verificável.
          Contratos, vereadores, obras e licitações — tudo com fonte, data e grau de confiança.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <Button size="lg">
            <Search className="w-4 h-4" />
            Buscar contrato
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/financas">Ver Americana — SP</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-4">
        <FeatureCard icon={FileText} label="Contratos públicos" description="PNCP · Portal da Transparência" />
        <FeatureCard icon={Building2} label="Câmara Municipal" description="Vereadores · Votações · Projetos" />
        <FeatureCard icon={MapPin} label="Território" description="Bairros · Obras · Impacto" />
      </div>

      <p className="text-xs text-muted-foreground">
        Piloto: <strong>Americana, SP</strong> · IBGE 3501608 · Open source
      </p>
    </main>
  );
}

function FeatureCard({
  icon: Icon,
  label,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border border-border/60 bg-card p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow cursor-default">
      <div className="w-10 h-10 rounded-xl bg-[var(--political-soft)] flex items-center justify-center">
        <Icon className="w-5 h-5 text-[var(--political)]" />
      </div>
      <div>
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
