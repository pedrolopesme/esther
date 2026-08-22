import { Suspense } from "react";
import LoginForm from "../../components/LoginForm";

export const metadata = {
  title: "Entrar · Esther",
  description: "Acesse sua conta na Esther para resolver exercícios",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-ink-soft">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
