import { Suspense } from "react";
import ParentDashboard from "../../components/ParentDashboard";

export const metadata = {
  title: "Painel do Responsável · Esther",
  description: "Acompanhe o progresso de estudos dos seus filhos",
};

export default function ResponsavelPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center text-ink-soft">
          Carregando painel...
        </div>
      }
    >
      <ParentDashboard />
    </Suspense>
  );
}
