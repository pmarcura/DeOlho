// Financas route uses dark mode — matches the dashboard design system
export default function FinancasLayout({ children }: { children: React.ReactNode }) {
  return <div className="dark">{children}</div>;
}
