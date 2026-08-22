"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogIn, UserPlus, Sparkles, ArrowLeft } from "lucide-react";
import { getSupabaseBrowserClient } from "../utils/supabase";

const inputClass =
  "w-full rounded-2xl border-2 border-lilac/15 bg-white/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-lilac focus:ring-4 focus:ring-lilac/10";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();
  const [mode, setMode] = useState(searchParams.get("tab") === "register" ? "register" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
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
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;
        setSuccess("Você entrou! Redirecionando...");
        window.location.href = "/";
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split("@")[0] },
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
          )}

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">E-mail</span>
            <input
              className={inputClass}
              type="email"
              autoComplete="email"
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
