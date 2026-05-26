/**
 * Badges cívicos — núcleo do "sistema de confiança visível" (TRUST-01..05).
 *
 * Regras dos componentes (docs/components/civicos.md):
 *  - Nunca usar SÓ cor — label de texto + ícone são reforço obrigatório.
 *  - `TipoInformacaoBadge` separa fato, explicação, sinal, opinião, notícia.
 *  - `ConfiancaBadge` é sobre a FONTE/coleta (não sobre a entidade).
 *  - `FonteBadge` aceita `isSynthetic` — sintéticos SEMPRE marcados.
 */
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  Newspaper,
  MessageCircle,
  ShieldAlert,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  EstadoFonte,
  FonteId,
  NivelConfianca,
  TipoInformacao,
} from "@/lib/civic-types";

// ── TipoInformacaoBadge ───────────────────────────────────────────────────────
const TIPO_INFO: Record<
  TipoInformacao,
  { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }
> = {
  fato_oficial: {
    label: "Fato oficial",
    cls: "bg-[var(--oficial-soft)] text-[var(--oficial)] ring-[var(--oficial)]/20",
    icon: CheckCircle2,
  },
  explicacao_ia: {
    label: "Explicação por IA",
    cls: "bg-violet-50 text-violet-700 ring-violet-200/80",
    icon: Bot,
  },
  sinal_atencao: {
    label: "Sinal de atenção",
    cls: "bg-[var(--atencao-soft)] text-[var(--atencao)] ring-[var(--atencao)]/30",
    icon: ShieldAlert,
  },
  noticia: {
    label: "Notícia",
    cls: "bg-slate-50 text-slate-700 ring-slate-200/80",
    icon: Newspaper,
  },
  opiniao: {
    label: "Opinião",
    cls: "bg-stone-50 text-stone-700 ring-stone-200/80",
    icon: MessageCircle,
  },
  dado_incompleto: {
    label: "Dado incompleto",
    cls: "bg-amber-50 text-amber-700 ring-amber-200/80",
    icon: AlertTriangle,
  },
  revisao_pendente: {
    label: "Revisão pendente",
    cls: "bg-sky-50 text-sky-700 ring-sky-200/80",
    icon: HelpCircle,
  },
};

export function TipoInformacaoBadge({
  tipo,
  size = "sm",
  className,
}: {
  tipo: TipoInformacao;
  size?: "xs" | "sm";
  className?: string;
}) {
  const cfg = TIPO_INFO[tipo];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full ring-1 font-medium uppercase tracking-wide",
        size === "xs" ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5",
        cfg.cls,
        className,
      )}
      aria-label={`Tipo de informação: ${cfg.label}`}
    >
      <Icon className={size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3"} aria-hidden />
      {cfg.label}
    </span>
  );
}

// ── ConfiancaBadge ────────────────────────────────────────────────────────────
const CONFIANCA: Record<NivelConfianca, { label: string; descricao: string; cls: string }> = {
  fonte_oficial: {
    label: "Fonte oficial",
    descricao: "Coleta direta da fonte oficial responsável.",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
  },
  copia_verificada: {
    label: "Cópia verificada",
    descricao: "Dado conferido por verificação técnica.",
    cls: "bg-emerald-50/60 text-emerald-700/90 ring-emerald-200/70",
  },
  verificacao_pendente: {
    label: "Verificação pendente",
    descricao: "Coleta automática ainda não revisada.",
    cls: "bg-sky-50 text-sky-700 ring-sky-200/80",
  },
  fonte_atrasada: {
    label: "Fonte atrasada",
    descricao: "A fonte está com defasagem desde a última coleta.",
    cls: "bg-amber-50 text-amber-700 ring-amber-200/80",
  },
  incompleto: {
    label: "Incompleto",
    descricao: "A fonte não informa todos os campos esperados.",
    cls: "bg-amber-50 text-amber-700 ring-amber-200/80",
  },
  contraditorio: {
    label: "Contraditório",
    descricao: "Dois cruzamentos da mesma informação divergem.",
    cls: "bg-rose-50 text-rose-700 ring-rose-200/80",
  },
};

export function ConfiancaBadge({
  nivel,
  ultimaVerificacao,
  className,
}: {
  nivel: NivelConfianca;
  ultimaVerificacao?: string;
  className?: string;
}) {
  const cfg = CONFIANCA[nivel];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full ring-1 text-[10px] font-medium px-2 py-0.5",
        cfg.cls,
        className,
      )}
      title={
        ultimaVerificacao
          ? `${cfg.descricao} Última verificação: ${ultimaVerificacao}`
          : cfg.descricao
      }
      aria-label={`Confiança: ${cfg.label}. ${cfg.descricao}`}
    >
      <ShieldAlert className="w-3 h-3" aria-hidden />
      {cfg.label}
    </span>
  );
}

// ── FonteBadge ────────────────────────────────────────────────────────────────
const FONTE_CFG: Record<FonteId, { label: string; cls: string }> = {
  pncp: { label: "PNCP", cls: "bg-blue-50 text-blue-700 ring-blue-200/80" },
  "tce-sp": { label: "TCE-SP", cls: "bg-indigo-50 text-indigo-700 ring-indigo-200/80" },
  "cgu-transparencia": {
    label: "CGU Transparência",
    cls: "bg-purple-50 text-purple-700 ring-purple-200/80",
  },
  "querido-diario": {
    label: "Querido Diário",
    cls: "bg-teal-50 text-teal-700 ring-teal-200/80",
  },
  "diario-americana": {
    label: "Diário de Americana",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
  },
  "transparencia-americana": {
    label: "Transp. Americana",
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
  },
  "receita-cnpj": {
    label: "Receita Federal",
    cls: "bg-slate-50 text-slate-700 ring-slate-200/80",
  },
  "camara-americana": {
    label: "Câmara de Americana",
    cls: "bg-amber-50 text-amber-700 ring-amber-200/80",
  },
  tse: { label: "TSE", cls: "bg-rose-50 text-rose-700 ring-rose-200/80" },
  sinteticos: {
    label: "Dados sintéticos",
    cls: "bg-stone-100 text-stone-700 ring-stone-200/80",
  },
};

const ESTADO_LABEL: Record<EstadoFonte, string> = {
  fresh: "atualizada",
  delayed: "atrasada",
  unavailable: "indisponível",
  partial: "parcial",
  synthetic: "sintética",
};

export function FonteBadge({
  fonte,
  url,
  estadoFonte,
  dataColeta,
  isSynthetic,
  className,
}: {
  fonte: FonteId;
  url?: string;
  estadoFonte?: EstadoFonte;
  dataColeta?: string;
  isSynthetic?: boolean;
  className?: string;
}) {
  const cfg = isSynthetic ? FONTE_CFG.sinteticos : FONTE_CFG[fonte];
  const estado = estadoFonte ? ` · ${ESTADO_LABEL[estadoFonte]}` : "";
  const tooltip = `${cfg.label}${estado}${dataColeta ? ` · coleta ${dataColeta}` : ""}`;
  const inner = (
    <>
      <FileText className="w-3 h-3" aria-hidden />
      {cfg.label}
      {isSynthetic && <Sparkles className="w-2.5 h-2.5 opacity-70" aria-hidden />}
    </>
  );
  const baseCls = cn(
    "inline-flex items-center gap-1 rounded-full ring-1 text-[10px] font-medium px-2 py-0.5",
    cfg.cls,
    className,
  );
  if (url && !isSynthetic) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(baseCls, "hover:underline")}
        title={tooltip}
        aria-label={`Abrir fonte ${cfg.label}`}
      >
        {inner}
        <ExternalLink className="w-2.5 h-2.5" aria-hidden />
      </a>
    );
  }
  return (
    <span className={baseCls} title={tooltip} aria-label={tooltip}>
      {inner}
    </span>
  );
}

// ── ChipDataColeta (proveniência temporal) ───────────────────────────────────
// Usado dentro de fichas pra deixar "publicado em" / "coletado em" visível
// sem virar ruído.
export function ChipDataColeta({
  label,
  data,
  icon: Icon = Clock,
}: {
  label: string;
  data: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const fmt = new Date(data).toLocaleDateString("pt-BR");
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
      aria-label={`${label}: ${fmt}`}
    >
      <Icon className="w-3 h-3" aria-hidden />
      {label} {fmt}
    </span>
  );
}
