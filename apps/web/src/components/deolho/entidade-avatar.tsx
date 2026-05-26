/**
 * EntidadeAvatar — identidade visual compacta por tipo de entidade.
 *
 * NÃO usa foto real até existir pipeline de mídia com fonte/licença. Para
 * empresas/órgãos sintéticos: ícone + iniciais sobre paleta determinística por
 * seed. Para pessoa_publica: ícone neutro — nunca foto partidária.
 */
import {
  Building2,
  FileText,
  Hammer,
  Landmark,
  MapPin,
  ScrollText,
  Sparkles,
  Tag,
  UserCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TipoEntidade } from "@/lib/civic-types";

const ICON_BY_TIPO: Record<TipoEntidade, React.ComponentType<{ className?: string }>> = {
  empresa: Building2,
  orgao: Landmark,
  unidade_orgao: Building2,
  pessoa_publica: UserCircle2,
  contrato: FileText,
  obra: Hammer,
  lei: ScrollText,
  documento: FileText,
  territorio: MapPin,
  tema: Tag,
};

const PALETAS = [
  "bg-blue-50 text-blue-700 ring-blue-200/80",
  "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
  "bg-violet-50 text-violet-700 ring-violet-200/80",
  "bg-amber-50 text-amber-700 ring-amber-200/80",
  "bg-rose-50 text-rose-700 ring-rose-200/80",
  "bg-teal-50 text-teal-700 ring-teal-200/80",
  "bg-indigo-50 text-indigo-700 ring-indigo-200/80",
  "bg-orange-50 text-orange-700 ring-orange-200/80",
];

function paletaFromSeed(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return PALETAS[Math.abs(h) % PALETAS.length]!;
}

function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function EntidadeAvatar({
  tipo,
  nome,
  size = "md",
  isSynthetic,
  className,
}: {
  tipo: TipoEntidade;
  nome: string;
  size?: "sm" | "md" | "lg";
  isSynthetic?: boolean;
  className?: string;
}) {
  const Icon = ICON_BY_TIPO[tipo];
  const sizes = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-11 h-11 text-xs",
    lg: "w-16 h-16 text-base",
  } as const;
  // Para pessoa_publica usamos sempre paleta neutra para evitar branding partidário.
  const paleta =
    tipo === "pessoa_publica"
      ? "bg-slate-50 text-slate-700 ring-slate-200/80"
      : paletaFromSeed(nome);
  const showIniciais = tipo === "empresa" || tipo === "orgao" || tipo === "unidade_orgao";

  return (
    <div
      className={cn(
        "relative rounded-xl ring-1 flex items-center justify-center shrink-0 font-semibold",
        sizes[size],
        paleta,
        className,
      )}
      aria-label={`${tipo}: ${nome}`}
    >
      {showIniciais ? (
        iniciais(nome)
      ) : (
        <Icon className={size === "lg" ? "w-7 h-7" : size === "md" ? "w-5 h-5" : "w-4 h-4"} aria-hidden />
      )}
      {isSynthetic && (
        <span
          className="absolute -bottom-1 -right-1 bg-stone-100 ring-1 ring-stone-200 rounded-full p-0.5"
          title="Dados sintéticos"
          aria-label="Dados sintéticos"
        >
          <Sparkles className="w-2.5 h-2.5 text-stone-500" aria-hidden />
        </span>
      )}
    </div>
  );
}
