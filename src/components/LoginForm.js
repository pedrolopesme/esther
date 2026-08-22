"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogIn, UserPlus, Sparkles, ArrowLeft } from "lucide-react";
import { getSupabaseBrowserClient } from "../utils/supabase";
import { logChildEvent } from "../utils/childEvents";

const inputClass =
  "w-full rounded-2xl border-2 border-lilac/15 bg-white/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-lilac focus:ring-4 focus:ring-lilac/10";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [mode, setMode] = useState(searchParams.get("tab") === "register" ? "register" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "login") {
        // Child login: username without @ → child_login RPC
        if (!email.includes("@")) {
          const { data: childData, error: childError } = await supabase.rpc("child_login", {
            p_username: email.trim().toLowerCase(),
            p_password: password,
          });
          if (childError) throw childError;
          if (!childData.ok) {
            setError(childData.error);
            setIsSubmitting(false);
            return;
          }
          localStorage.setItem("esther_child", JSON.stringify({
            id: childData.child_id,
            display_name: childData.display_name,
            parent_id: childData.parent_id,
          }));
          logChildEvent({
            childId: childData.child_id,
            eventType: "login",
          });
          router.push("/");
          return;
        }

        // Parent/admin login via Supabase Auth
        const { error: loginError, data: loginData } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;
        setSuccess("Você entrou! Redirecionando...");

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", loginData.user.id)
          .single();
        if (profile?.role === "admin") {
          router.push("/admin");
        } else if (profile?.role === "parent") {
          router.push("/responsavel");
        } else {
          router.push("/");
        }
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split("@")[0], role },
          },
        });
        if (signUpError) throw signUpError;
        setSuccess("Conta criada com sucesso! Agora é só entrar.");
        setMode("login");
        setPassword("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-12">
      <motion.div
        className="clay bg-white/80 p-6 sm:p-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <Link
          href="/"
          className="press mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-sm font-semibold text-ink shadow-sm backdrop-blur hover:-translate-x-0.5 hover:text-lilac"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Voltar
        </Link>

        <div className="mb-6 text-center">
          <div className="mb-3 text-5xl">{mode === "login" ? "🎒" : "🌟"}</div>
          <h1 className="font-display text-2xl font-bold text-ink">
            {mode === "login" ? "Entrar na Esther" : "Criar conta"}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            {mode === "login"
              ? "Pronto para mais uma aventura de estudos?"
              : "Junte-se à aventura de estudos da Esther!"}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-ink">Seu nome ou apelido</span>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="Ex: Esther"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </label>

              <div>
                <span className="mb-2 block text-sm font-semibold text-ink">Quem é você?</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`press flex flex-col items-center gap-1 rounded-2xl border-2 px-4 py-3 text-center transition ${
                      role === "student"
                        ? "border-lilac bg-lilac-soft text-[#5B2FB0] shadow-[0_4px_0_rgba(163,112,255,0.4)]"
                        : "border-lilac/15 bg-white/80 text-ink-soft hover:border-lilac/40"
                    }`}
                  >
                    <span className="text-2xl">🎒</span>
                    <span className="text-sm font-bold">Estudante</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("parent")}
                    className={`press flex flex-col items-center gap-1 rounded-2xl border-2 px-4 py-3 text-center transition ${
                      role === "parent"
                        ? "border-candy bg-candy-soft text-[#a62f5f] shadow-[0_4px_0_rgba(255,112,166,0.4)]"
                        : "border-lilac/15 bg-white/80 text-ink-soft hover:border-candy/40"
                    }`}
                  >
                    <span className="text-2xl">👨‍👩‍👧</span>
                    <span className="text-sm font-bold">Responsável</span>
                  </button>
                </div>
              </div>
            </>
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">E-mail ou usuário</span>
            <input
              className={inputClass}
              type="text"
              autoComplete="email"
              placeholder={mode === "login" ? "seuemail@exemplo.com ou seuusuario" : "seuemail@exemplo.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Senha</span>
            <input
              className={inputClass}
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {mode === "register" && (
              <p className="mt-1 text-xs text-ink-soft">No mínimo 6 caracteres.</p>
            )}
          </label>

          {error && (
            <p className="rounded-2xl bg-candy-soft px-3 py-2 text-sm font-semibold text-[#a62f5f]">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-2xl bg-mint/15 px-3 py-2 text-sm font-semibold text-[#078d6d]">
              {success}
            </p>
          )}

          <button
            className="press flex w-full items-center justify-center gap-2 rounded-2xl bg-lilac px-4 py-3 font-display font-bold text-white shadow-md disabled:cursor-wait disabled:opacity-60"
            disabled={isSubmitting}
          >
            {mode === "login" ? (
              <>
                <LogIn className="h-5 w-5" />
                {isSubmitting ? "Entrando..." : "Entrar"}
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                {isSubmitting ? "Criando conta..." : "Criar minha conta"}
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          {mode === "login" ? (
            <p className="text-sm text-ink-soft">
              Ainda não tem conta?{" "}
              <button
                className="font-bold text-lilac hover:underline"
                onClick={() => {
                  setMode("register");
                  setError(null);
                  setSuccess(null);
                }}
              >
                Criar agora
              </button>
            </p>
          ) : (
            <p className="text-sm text-ink-soft">
              Já tem uma conta?{" "}
              <button
                className="font-bold text-lilac hover:underline"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setSuccess(null);
                }}
              >
                Entrar
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
