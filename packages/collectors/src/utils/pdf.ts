/**
 * Extração de texto de PDF (para o Diário Oficial de Americana → menções).
 *
 * Os diários são PDFs de texto (PDF-1.6), então pdf-parse resolve sem OCR.
 * Carregamos a implementação direta (lib/) via createRequire para evitar o bloco
 * "debug mode" do index.js do pdf-parse, que sob ESM tenta ler um PDF de teste
 * e quebra a importação.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as (
  data: Buffer,
) => Promise<{ text: string; numpages: number; info?: unknown }>;

export async function baixarPdf(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; DeOlho/0.1; +transparencia)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ao baixar ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function extrairTextoPdf(buffer: Buffer): Promise<string> {
  const r = await pdfParse(buffer);
  return r.text ?? "";
}
