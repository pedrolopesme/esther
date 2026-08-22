"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Check, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const inputClass =
  "w-full rounded-2xl border-2 border-lilac/15 bg-white/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-lilac focus:ring-4 focus:ring-lilac/10";

export default function ProfileForm() {
  const { user, profile, isLoading, supabase, refresh } = useAuth();
  const [name, setName] = useState(profile?.display_name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Sync name once profile loads
  if (profile?.display_name && !name && !saving) {
    setName(profile.display_name);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ display_name: name.trim() })
        .eq("id", user.id);

      if (updateError) throw updateError;

      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-ink-soft">
        Carregando perfil...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-ink-soft">
        <p>Você precisa estar logado.</p>
        <Link href="/login" className="font-bold text-lilac hover:underline">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-16 pt-12">
      <Link
        href="/"
        className="press mb-6 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-sm font-semibold text-ink shadow-sm hover:-translate-x-0.5 hover:text-lilac"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Voltar
      </Link>

      <motion.div
        className="clay bg-white/80 p-6 sm:p-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-sky-soft to-lilac-soft text-3xl shadow-md ring-3 ring-white">
            👤
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">Meu Perfil</h1>
          <p className="mt-1 text-sm text-ink-soft">{user.email}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold text-ink">Nome</span>
            <input
              className={inputClass}
              type="text"
              placeholder="Como a Esther deve te chamar?"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
              maxLength={30}
              required
            />
            <p className="mt-1 text-xs text-ink-soft">
              Máximo 30 caracteres.
            </p>
          </label>

          {error && (
            <p className="rounded-2xl bg-candy-soft px-3 py-2 text-sm font-semibold text-[#a62f5f]">
              {error}
            </p>
          )}

          {saved && (
            <motion.p
              className="rounded-2xl bg-mint/15 px-3 py-2 text-sm font-semibold text-[#078d6d]"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              ✅ Nome salvo!
            </motion.p>
          )}

          <button
            type="submit"
            className="press flex w-full items-center justify-center gap-2 rounded-2xl bg-lilac px-4 py-3 font-display font-bold text-white shadow-md disabled:cursor-wait disabled:opacity-60"
            disabled={saving || !name.trim()}
          >
            <Check className="h-5 w-5" />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
