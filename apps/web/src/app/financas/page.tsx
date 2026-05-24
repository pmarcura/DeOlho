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
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

const ORANGE = "#e05a00";
const ORANGE_SOFT = "#f07830";

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
    <Card className="border-border/50">
      <CardContent className="pt-6 pb-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`rounded-md p-2 ${accent ? "bg-primary/15" : "bg-muted"}`}>
            <Icon className={`w-4 h-4 ${accent ? "text-primary" : "text-muted-foreground"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground">
          {p.name === "valor" ? formatBRL(p.value) : `${p.value} contratos`}
        </p>
      ))}
    </div>
  );
}

// ── Donut Label ────────────────────────────────────────────────────────────────
function DonutLabel({ cx, cy, total }: { cx: number; cy: number; total: number }) {
  return (
    <>
      <text x={cx} y={cy - 8} textAnchor="middle" className="fill-foreground" style={{ fontSize: 22, fontWeight: 700 }}>
        {formatBRL(total)}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 11 }}>
        orçamento 2025
      </text>
    </>
  );
}

export default function FinancasPage() {
  const totalContratos = contratosPorMes.reduce((s, m) => s + m.contratos, 0);
  const totalValorContratos = contratosPorMes.reduce((s, m) => s + m.valor, 0);
  const ticketMedio = totalValorContratos / totalContratos;

  return (
    <div className="min-h-svh bg-background text-foreground">
      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <header className="border-b border-border/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Americana — SP</span>
              <Badge variant="outline" className="text-xs font-normal">IBGE {MUNICIPIO.ibge}</Badge>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1.5 text-xs">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Dados sintéticos — aguardando scraper
          </Badge>
        </div>
      </header>

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-2">
        <h1 className="text-2xl font-bold">Dinheiro público em Americana</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Orçamento 2025 · Contratos via PNCP desde out/2024 · {MUNICIPIO.populacao.toLocaleString("pt-BR")} habitantes
        </p>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-6">

        {/* ── KPIs ───────────────────────────────────────────────────────────── */}
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

        {/* ── Contratos por mês ──────────────────────────────────────────────── */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contratos por mês</CardTitle>
            <CardDescription>Valor total contratado via PNCP — out/2024 a mai/2026</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={contratosPorMes} barSize={18} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                <XAxis
                  dataKey="mes"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatBRL(v)}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={72}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="valor" name="valor" fill={ORANGE} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── Donut charts row ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Despesa por secretaria */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Despesa por secretaria</CardTitle>
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
                    innerRadius={70}
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
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{value}</span>
                    )}
                  />
                  <Tooltip
                    formatter={(value) => [formatBRLFull(Number(value)), ""]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Receita por origem */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Receita por origem</CardTitle>
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
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {receitaOrigem.map((entry, i) => (
                      <Cell key={i} fill={entry.cor} />
                    ))}
                    <DonutLabel cx={160} cy={114} total={receitaOrigem.reduce((s, r) => s + r.valor, 0)} />
                  </Pie>
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{value}</span>
                    )}
                  />
                  <Tooltip
                    formatter={(value) => [formatBRLFull(Number(value)), ""]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ── Top empresas ────────────────────────────────────────────────────── */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Maiores contratadas</CardTitle>
            <CardDescription>Por valor total de contratos no período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {topEmpresas.map((e, i) => {
                const max = topEmpresas[0].valor;
                const pct = (e.valor / max) * 100;
                return (
                  <div key={i} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}</span>
                        <span className="font-medium truncate">{e.empresa}</span>
                        <span className="text-xs text-muted-foreground hidden sm:block font-mono shrink-0">{e.cnpj}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground">{e.contratos} contratos</span>
                        <span className="font-semibold text-primary">{formatBRL(e.valor)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: i === 0 ? ORANGE : ORANGE_SOFT, opacity: 1 - i * 0.08 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Últimos contratos ────────────────────────────────────────────────── */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Últimos contratos</CardTitle>
            <CardDescription>Publicados recentemente no PNCP</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y divide-border/50">
              {ultimosContratos.map((c, i) => (
                <div key={i} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{c.numero}</span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0">{c.secretaria}</Badge>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">{c.modalidade}</Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{c.objeto}</p>
                    <p className="text-xs text-muted-foreground">{c.contratada}</p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className="text-sm font-semibold text-primary">{formatBRL(c.valor)}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.data).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Fonte ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pb-4">
          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
          <span>
            <strong className="text-foreground">Dados sintéticos</strong> — estrutura baseada no PNCP (
            <code className="text-xs">codigoMunicipio=3501608</code>) e Portal da Transparência.
            Valores reais entram após o scraper de Americana entrar em operação.
          </span>
        </div>
      </main>
    </div>
  );
}
