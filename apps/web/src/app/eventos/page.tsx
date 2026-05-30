/**
 * /eventos foi UNIFICADO no Início (/). Esta rota agora só redireciona, pra não
 * ter duas superfícies de feed (feedback do Pedro: "tudo isso ser 1").
 */
import { redirect } from "next/navigation";

export default function EventosPage() {
  redirect("/");
}
