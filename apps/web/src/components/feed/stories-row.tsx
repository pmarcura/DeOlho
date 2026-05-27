/**
 * StoriesRow — fila horizontal de círculos no topo, ao estilo das stories do
 * Instagram, mas para CIDADES, BAIRROS e TEMAS (não pessoas).
 *
 * Visual: avatar redondo com anel suave (ou gradiente quente quando "novo
 * conteúdo"). Label embaixo. Scroll horizontal nativo mobile com snap.
 *
 * Comportamento: cada item é um link (a /, /tema/[id], /bairro/[id], etc.).
 */
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface StoryItem {
  id: string;
  label: string;
  href: string;
  /** Inicial / sigla pra desenhar dentro do círculo quando não há ícone. */
  iniciais?: string;
  /** Quando true, mostra anel gradiente quente — indicando conteúdo novo. */
  novo?: boolean;
  /** Override de paleta determinística. */
  bg?: string;
  fg?: string;
  /** Ícone opcional como conteúdo do círculo. */
  icon?: React.ReactNode;
}

const PALETAS = [
  { bg: "bg-rose-100", fg: "text-rose-700" },
  { bg: "bg-amber-100", fg: "text-amber-700" },
  { bg: "bg-emerald-100", fg: "text-emerald-700" },
  { bg: "bg-sky-100", fg: "text-sky-700" },
  { bg: "bg-violet-100", fg: "text-violet-700" },
  { bg: "bg-orange-100", fg: "text-orange-700" },
];

function paletaDe(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return PALETAS[Math.abs(h) % PALETAS.length]!;
}

export function StoriesRow({
  items,
  ariaLabel = "Categorias para explorar",
  className,
}: {
  items: StoryItem[];
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <nav aria-label={ariaLabel} className={cn("-mx-4 px-4 overflow-x-auto", className)}>
      <ul className="flex items-start gap-4 pb-2 snap-x snap-mandatory">
        {items.map((it) => {
          const pal = it.bg
            ? { bg: it.bg, fg: it.fg ?? "text-foreground" }
            : paletaDe(it.id);
          const conteudo = it.icon ?? (
            <span className="text-base font-semibold leading-none">
              {it.iniciais ?? it.label.slice(0, 2).toUpperCase()}
            </span>
          );
          return (
            <li key={it.id} className="snap-start shrink-0">
              <Link
                href={it.href}
                className="flex flex-col items-center gap-1.5 w-16 group"
                aria-label={it.label}
              >
                <span
                  className={cn(
                    "relative w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-[1.02]",
                    pal.bg,
                    pal.fg,
                  )}
                >
                  {it.novo && (
                    <span
                      aria-hidden
                      className="absolute inset-[-3px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-400 to-violet-500 -z-10"
                      style={{ padding: 3 }}
                    />
                  )}
                  {it.novo && (
                    <span
                      aria-hidden
                      className="absolute inset-[-3px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-400 to-violet-500"
                      style={{
                        padding: "3px",
                        WebkitMask:
                          "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        WebkitMaskComposite: "xor",
                        maskComposite: "exclude",
                      }}
                    />
                  )}
                  {conteudo}
                </span>
                <span className="text-[11px] text-foreground/80 line-clamp-1 max-w-16 text-center leading-tight">
                  {it.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
