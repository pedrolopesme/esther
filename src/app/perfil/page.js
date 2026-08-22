import { Suspense } from "react";
import ProfileForm from "../../components/ProfileForm";

export const metadata = {
  title: "Meu Perfil · Esther",
  description: "Gerencie seu perfil na Esther",
};

export default function PerfilPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-ink-soft">Carregando...</div>}>
      <ProfileForm />
    </Suspense>
  );
}
