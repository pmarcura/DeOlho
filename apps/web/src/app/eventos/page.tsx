/**
 * /eventos foi unificado no Início (/). Esta rota só redireciona para evitar
 * duas superfícies públicas concorrentes.
 */
import { redirect } from "next/navigation";

export default function EventosPage() {
  redirect("/");
}
