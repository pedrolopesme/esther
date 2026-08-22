import { Suspense } from "react";
import AdminPanel from "../../components/AdminPanel";

export const metadata = {
  title: "Painel Administrativo · Esther",
  description: "Gerenciar listas de exercícios",
};

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-ink-soft">Carregando painel...</div>}>
      <AdminPanel />
    </Suspense>
  );
}
