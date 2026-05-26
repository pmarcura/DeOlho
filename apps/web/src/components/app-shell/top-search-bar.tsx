"use client";

/**
 * TopSearchBar — barra de busca persistente no topo.
 *
 * Mobile-first: input visível no topo. Ao focar, sobre uma camada de busca
 * em tela cheia com sugestões por tipo (entidade/contrato/cidade/documento).
 *
 * Esta é uma versão minimalista do UniversalCommandSearch — sem cmdk para
 * manter dependências leves. Quando o universal-command for instalado, este
 * componente serve de trigger.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Search, X, FileText, Building2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGESTOES = [
  { tipo: "Contrato", label: "CT-2026/118 — Manutenção escolar", href: "/contrato/ct-sint-001" },
  { tipo: "Empresa", label: "Construtora Sintética Alfa", href: "/entidade/empresa/construtora-sintetica-alfa" },
  { tipo: "Órgão", label: "Município de Americana", href: "/entidade/orgao/municipio-americana" },
  { tipo: "Cidade", label: "Americana — SP", href: "/cidade/americana" },
];

export function TopSearchBar() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // ESC fecha
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function submit() {
    if (q.trim()) router.push(`/explorar?q=${encodeURIComponent(q.trim())}`);
    setOpen(false);
  }

  const filtradas = q
    ? SUGESTOES.filter((s) => s.label.toLowerCase().includes(q.toLowerCase()))
    : SUGESTOES;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30",
          "bg-card/90 backdrop-blur-md border-b border-border/60",
          "pt-[env(safe-area-inset-top)]",
        )}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-1.5 shrink-0" aria-label="DeOlho — início">
            <Eye className="w-5 h-5 text-[var(--political)]" />
            <span className="font-bold tracking-tight text-sm hidden xs:inline">DeOlho</span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex-1 flex items-center gap-2 px-3 h-9 rounded-full bg-muted/80 text-muted-foreground text-sm hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            aria-label="Abrir busca universal"
          >
            <Search className="w-4 h-4 shrink-0" aria-hidden />
            <span className="text-left flex-1 truncate">Buscar contrato, empresa, vereador, cidade…</span>
          </button>
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Busca"
        >
          <div className="border-b border-border/70 px-4 py-3 flex items-center gap-2 pt-[env(safe-area-inset-top)]">
            <Search className="w-4 h-4 text-muted-foreground" aria-hidden />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="O que você quer ver com seus olhos?"
              className="flex-1 bg-transparent text-base focus:outline-none placeholder:text-muted-foreground/70"
              aria-label="Campo de busca"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted"
              aria-label="Fechar busca"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto px-4 py-4 flex flex-col gap-1">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground px-2 pb-1">
              Sugestões sintéticas
            </p>
            {filtradas.length === 0 && (
              <p className="text-sm text-muted-foreground px-2 py-6 text-center">
                Nenhum resultado para &quot;{q}&quot;. Tente outro termo.
              </p>
            )}
            {filtradas.map((s, i) => {
              const Icon = s.tipo === "Empresa" || s.tipo === "Órgão" ? Building2 : s.tipo === "Cidade" ? MapPin : FileText;
              return (
                <Link
                  key={i}
                  href={s.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <span className="w-9 h-9 rounded-lg bg-muted/70 ring-1 ring-border/40 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-muted-foreground" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.tipo}</p>
                    <p className="text-sm font-medium truncate">{s.label}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          <p className="text-[10px] text-muted-foreground/70 px-6 pb-4 pt-2 border-t border-border/40">
            Resultados sintéticos para demonstração. A busca real entra após a ingestão.
          </p>
        </div>
      )}
    </>
  );
}
