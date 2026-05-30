import Dashboard, { type DashboardData } from "./_dashboard";
import {
  contratosPorMes,
  topEmpresas,
  ultimosContratos,
} from "@/lib/americana-data";
import { loadPncpDados } from "@/lib/pncp-transform";

function loadDashboardData(): DashboardData {
  const pncp = loadPncpDados();
  if (pncp) return pncp;

  return {
    fonte: "sintetico",
    coletadoEm: null,
    totalContratos: contratosPorMes.reduce((s, m) => s + m.contratos, 0),
    totalValor: contratosPorMes.reduce((s, m) => s + m.valor, 0),
    contratosPorMes,
    topEmpresas,
    ultimosContratos,
  };
}

export default function FinancasPage() {
  return <Dashboard data={loadDashboardData()} />;
}
