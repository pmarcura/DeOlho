import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ResultadoColeta } from "../types.js";

const DATA_DIR = path.resolve(
  fileURLToPath(new URL("../../data/", import.meta.url))
);

export async function salvar(resultado: ResultadoColeta): Promise<string> {
  const dir = path.join(DATA_DIR, resultado.fonte);
  await fs.mkdir(dir, { recursive: true });

  const arquivo = path.join(dir, `${resultado.coletadoEm.replace(/[:.]/g, "-")}.json`);
  await fs.writeFile(arquivo, JSON.stringify(resultado, null, 2), "utf-8");
  return arquivo;
}

export async function salvarLatest(resultado: ResultadoColeta): Promise<string> {
  const dir = path.join(DATA_DIR, resultado.fonte);
  await fs.mkdir(dir, { recursive: true });

  const arquivo = path.join(dir, "latest.json");
  await fs.writeFile(arquivo, JSON.stringify(resultado, null, 2), "utf-8");
  return arquivo;
}
