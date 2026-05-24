"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Building2,
  FileText,
  TrendingUp,
  Wallet,
  ArrowLeft,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  MUNICIPIO,
  receitaOrigem,
  despesaSecretaria,
  contratosPorMes,
  topEmpresas,
  ultimosContratos,
  formatBRL,
  formatBRLFull,
} from "@/lib/americana-data";

const CHART_ORANGE = "#e05a00";
const CHART_ORANGE_SOFT = "#f07830";

// ── Secretaria color dots ─────────────────────────────────────────────────────
const SECRETARIA_DOT: Record<string, string> = {
  "Saúde":              "bg-emerald-500",
  "Educação":           "bg-blue-500",
  "Infraestrutura":     "bg-amber-500",
  "Administração":      "bg-slate-400",
  "Assistência Social": "bg-violet-500",
  "Transportes":        "bg-orange-500",
  "Meio Ambiente":      "bg-teal-500",
  "Segurança":          "bg-red-500",
};

function secretariaDot(s: string) {
  return SECRETARIA_DOT[s] ?? "bg-muted-foreground/40";
}

// ── Company avatar helpers ─────────────────────────────────────────────────────
function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const AVATAR_PALETTES = [
  "bg-blue-50 text-blue-700 ring-blue-200/80",
  "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
  "bg-violet-50 text-violet-700 ring-violet-200/80",
  "bg-amber-50 text-amber-700 ring-amber-200/80",
  "bg-rose-50 text-rose-700 ring-rose-200/80",
  "bg-teal-50 text-teal-700 ring-teal-200/80",
  "bg-indigo-50 text-indigo-700 ring-indigo-200/80",
  "bg-orange-50 text-orange-700 ring-orange-200/80",
];

function avatarPalette(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTES[Math.abs(h) % AVATAR_PALETTES.length];
}

// ── Source badge ──────────────────────────────────────────────────────────────
function FonteBadge({ source }: { source: "pncp" | "portal" }) {
  const cfg =
    source === "pncp"
      ? { label: "PNCP", cls: "bg-blue-50 text-blue-600 ring-blue-200/80" }
      : { label: "Portal Transparência", cls: "bg-emerald-50 text-emerald-600 ring-emerald-200/80" };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ring-1",
        cfg.cls
      )}
    >
      <FileText className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
              accent ? "bg-primary/10 text-primary" : "bg-muted/80 text-muted-foreground/60"
            )}
          >
            <Icon className="w-[18px] h-[18px]" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground text-right leading-tight">
            {label}
          </p>
        </div>
        <p
          className={cn(
            "text-[1.875rem] font-bold tracking-tight leading-none",
            accent ? "text-primary" : "text-foreground"
          )}
        >
          {value}
        </p>
        {sub && <p className="text-[11px] text-muted-foreground mt-2">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5 text-sm shadow-md">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground">
          {p.name === "valor" ? formatBRL(p.value) : `${p.value} contratos`}
        </p>
      ))}
    </div>
  );
}

// ── Donut center label ─────────────────────────────────────────────────────────
function DonutLabel({ cx, cy, total }: { cx: number; cy: number; total: number }) {
  return (
    <>
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        className="fill-foreground"
        style={{ fontSize: 20, fontWeight: 700 }}
      >
        {formatBRL(total)}
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        className="fill-muted-foreground"
        style={{ fontSize: 10 }}
      >
        orçamento 2025
      </text>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FinancasPage() {
  const totalContratos = contratosPorMes.reduce((s, m) => s + m.contratos, 0);
  const totalValorContratos = contratosPorMes.reduce((s, m) => s + m.valor, 0);
  const ticketMedio = totalValorContratos / totalContratos;

  return (
    <div className="min-h-svh bg-background text-foreground">

      {/* ── Topbar ───────────────────────────────────────────────────────────── */}
      <header className="border-b border-border/50 bg-card/90 backdrop-blur-sm sticky top-0 z-10 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold text-sm">Americana — SP</span>
              <Badge variant="outline" className="text-xs font-mono font-normal hidden sm:inline-flex">
                {MUNICIPIO.ibge}
              </Badge>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1.5 text-xs font-medium">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Dados sintéticos
          </Badge>
        </div>
      </header>

      {/* ── Contexto do município ────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              {/* Slot de imagem — exibe foto da Wikipedia quando disponível */}
              <div className="w-14 h-14 rounded-xl bg-muted border border-border/40 flex items-center justify-center shrink-0 overflow-hidden">
                <MapPin className="w-6 h-6 text-muted-foreground/30" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight">Americana</h1>
                <p className="text-sm text-muted-foreground">
                  São Paulo, Brasil &middot; {MUNICIPIO.populacao.toLocaleString("pt-BR")} hab.
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] font-mono font-normal py-0">
                    IBGE {MUNICIPIO.ibge}
                  </Badge>
                  <FonteBadge source="pncp" />
                  <FonteBadge source="portal" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-5 flex flex-col gap-5">

        {/* ── KPIs ─────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Orçamento 2025"
            value={formatBRL(MUNICIPIO.orcamento_2025)}
            sub="Previsão LOA"
            icon={Wallet}
            accent
          />
          <KpiCard
            label="Contratos PNCP"
            value={totalContratos.toString()}
            sub="Out/2024 – Mai/2026"
            icon={FileText}
          />
          <KpiCard
            label="Valor contratado"
            value={formatBRL(totalValorContratos)}
            sub="Período monitorado"
            icon={TrendingUp}
          />
          <KpiCard
            label="Ticket médio"
            value={formatBRL(ticketMedio)}
            sub="Por contrato"
            icon={Building2}
          />
        </div>

        {/* ── Contratos por mês ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Contratos por mês</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <CardDescription>Valor total contratado — out/2024 a mai/2026</CardDescription>
              <FonteBadge source="pncp" />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={contratosPorMes}
                barSize={14}
                margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
              >
                <XAxis
                  dataKey="mes"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatBRL(v)}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={68}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                <Bar dataKey="valor" name="valor" fill={CHART_ORANGE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── Donut charts ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Despesa por secretaria</CardTitle>
              <CardDescription>Distribuição do orçamento 2025</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={despesaSecretaria}
                    dataKey="valor"
                    nameKey="secretaria"
                    cx="50%"
                    cy="44%"
                    innerRadius={68}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {despesaSecretaria.map((entry, i) => (
                      <Cell key={i} fill={entry.cor} />
                    ))}
                    <DonutLabel cx={160} cy={114} total={MUNICIPIO.orcamento_2025} />
                  </Pie>
                  <Legend
                    iconType="circle"
                    iconSize={7}
                    formatter={(value) => (
                      <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{value}</span>
                    )}
                  />
                  <Tooltip
                    formatter={(value) => [formatBRLFull(Number(value)), ""]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Receita por origem</CardTitle>
              <CardDescription>Principais fontes de arrecadação 2025</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={receitaOrigem}
                    dataKey="valor"
                    nameKey="categoria"
                    cx="50%"
                    cy="44%"
                    innerRadius={68}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {receitaOrigem.map((entry, i) => (
                      <Cell key={i} fill={entry.cor} />
                    ))}
                    <DonutLabel
                      cx={160}
                      cy={114}
                      total={receitaOrigem.reduce((s, r) => s + r.valor, 0)}
                    />
                  </Pie>
                  <Legend
                    iconType="circle"
                    iconSize={7}
                    formatter={(value) => (
                      <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{value}</span>
                    )}
                  />
                  <Tooltip
                    formatter={(value) => [formatBRLFull(Number(value)), ""]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 10,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ── Maiores contratadas ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Maiores contratadas</CardTitle>
            <div className="flex items-center gap-2">
              <CardDescription>Por valor total de contratos no período</CardDescription>
              <FonteBadge source="pncp" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {topEmpresas.map((e, i) => {
                const pct = (e.valor / topEmpresas[0].valor) * 100;
                const palette = avatarPalette(e.cnpj);
                return (
                  <div key={i}>
                    <div className="flex items-center gap-3">
                      {/* Avatar com iniciais */}
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ring-1",
                          palette
                        )}
                      >
                        {getInitials(e.empresa)}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium truncate">{e.empresa}</span>
                          <span className="text-sm font-semibold text-primary shrink-0">
                            {formatBRL(e.valor)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 mt-0.5">
                          <span className="text-[10px] text-muted-foreground font-mono">{e.cnpj}</span>
                          <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                            {e.contratos} contratos
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Barra de progresso */}
                    <div className="mt-2 ml-11 h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          i === 0 ? "bg-primary" : "bg-primary/35"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Últimos contratos ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Últimos contratos</CardTitle>
            <div className="flex items-center gap-2">
              <CardDescription>Publicados recentemente no PNCP</CardDescription>
              <FonteBadge source="pncp" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              {ultimosContratos.map((c, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-3 py-3.5",
                    i < ultimosContratos.length - 1 && "border-b border-border/40"
                  )}
                >
                  {/* Ponto colorido por secretaria */}
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full mt-[7px] shrink-0",
                      secretariaDot(c.secretaria)
                    )}
                  />
                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate leading-snug">{c.objeto}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{c.contratada}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[10px] font-mono text-muted-foreground/60">
                            {c.numero}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                            {c.secretaria}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            {c.modalidade}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-primary">{formatBRL(c.valor)}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(c.data).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Rodapé de fonte ──────────────────────────────────────────────────── */}
        <div className="flex items-start gap-2.5 text-xs text-muted-foreground/70 pb-4 pt-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400/70 shrink-0 mt-px" />
          <span>
            <strong className="text-muted-foreground font-medium">Dados sintéticos</strong> — estrutura
            baseada no PNCP (
            <code className="text-[10px] bg-muted px-1 py-0.5 rounded font-mono">
              codigoMunicipio=3501608
            </code>
            ) e Portal da Transparência. Valores reais entram após o scraper de Americana entrar em operação.
          </span>
        </div>
      </main>
    </div>
  );
}
