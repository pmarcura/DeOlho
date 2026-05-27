"use client";

/**
 * Save + Share — Instagram-style ações secundárias do card.
 *
 * Save (acompanhar) = bookmark local agora; quando houver pseudônimo verificado
 * vira persistente. Share = Web Share API quando disponível, copia URL no
 * clipboard como fallback. Tudo client-side e otimista.
 */
import { useState } from "react";
import { Bookmark, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SaveShare({
  shareUrl,
  shareTitle,
  className,
}: {
  shareUrl?: string;
  shareTitle?: string;
  className?: string;
}) {
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);

  async function onShare() {
    const url = shareUrl ?? (typeof window !== "undefined" ? window.location.href : "");
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setShared(true);
      setTimeout(() => setShared(false), 1500);
    } catch {
      // share cancelado — silencioso
    }
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        onClick={() => setSaved((v) => !v)}
        aria-pressed={saved}
        aria-label={saved ? "Remover dos acompanhados" : "Acompanhar"}
        className={cn(
          "w-9 h-9 rounded-full inline-flex items-center justify-center transition-colors",
          saved
            ? "text-[var(--political)] bg-[var(--political)]/8"
            : "text-muted-foreground hover:bg-muted",
        )}
      >
        <Bookmark className={cn("w-4 h-4", saved && "fill-current")} aria-hidden />
      </button>
      <button
        type="button"
        onClick={onShare}
        aria-label={shared ? "Link copiado" : "Compartilhar"}
        className={cn(
          "w-9 h-9 rounded-full inline-flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors",
          shared && "text-emerald-600",
        )}
      >
        <Share2 className="w-4 h-4" aria-hidden />
      </button>
    </div>
  );
}
