import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ cat?: string; ordem?: string }>;
}

export default async function ExplorarPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  params.set("ordem", sp.ordem === "recentes" ? "recentes" : "semana");
  if (sp.cat) params.set("cat", sp.cat);
  redirect(`/?${params.toString()}`);
}
