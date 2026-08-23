"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Sparkles, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  CHILD_AVATARS,
  DEFAULT_CHILD_AVATAR,
  getChildAvatar,
  persistChildAvatar,
} from "../utils/avatars";
import { cn } from "../utils/cn";

const inputClass =
  "w-full rounded-2xl border-2 border-lilac/15 bg-white/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-lilac focus:ring-4 focus:ring-lilac/10";

export default function ProfileForm() {
  const { user, profile, child, isChild, isLoading, supabase, refresh, updateChild } = useAuth();
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_CHILD_AVATAR.id);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setName(child?.display_name || profile?.display_name || "");
    setSelectedAvatar(getChildAvatar(child?.avatar).id);
  }, [child, profile]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (isChild && child?.id) {
      setSaving(true);
      setError(null);
      setSaved(false);
      persistChildAvatar(child.id, selectedAvatar);
      updateChild({ avatar: selectedAvatar });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return;
    }

    if (!name.trim() || !user) return;
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

  if (!user && !isChild) {
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
            {isChild ? getChildAvatar(selectedAvatar).emoji : <User className="h-8 w-8 text-lilac" />}
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">
            {isChild ? "Editar meu avatar" : "Meu Perfil"}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {isChild ? "Escolha um companheiro para sua aventura!" : user.email}
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {isChild ? (
            <fieldset>
              <legend className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                <Sparkles className="h-4 w-4 text-sun" /> Escolha sua foto
              </legend>
              <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6" aria-label="Avatares disponíveis">
                {CHILD_AVATARS.map((avatar) => {
                  const selected = selectedAvatar === avatar.id;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      aria-label={avatar.label}
                      aria-pressed={selected}
                      onClick={() => {
                        setSelectedAvatar(avatar.id);
                        setSaved(false);
                      }}
                      className={cn(
                        "press grid aspect-square min-h-12 place-items-center rounded-2xl border-2 bg-white text-3xl shadow-sm transition focus:outline-none focus:ring-4 focus:ring-lilac/20",
                        selected
                          ? "border-lilac bg-lilac/10 shadow-md ring-4 ring-lilac/15"
                          : "border-transparent hover:-translate-y-0.5 hover:border-lilac/30 hover:bg-lilac/5",
                      )}
                    >
                      <span aria-hidden="true">{avatar.emoji}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-ink-soft">Você pode trocar quando quiser.</p>
            </fieldset>
          ) : (
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
              <p className="mt-1 text-xs text-ink-soft">Máximo 30 caracteres.</p>
            </label>
          )}

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
              ✅ {isChild ? "Avatar salvo!" : "Nome salvo!"}
            </motion.p>
          )}

          <button
            type="submit"
            className="press flex w-full items-center justify-center gap-2 rounded-2xl bg-lilac px-4 py-3 font-display font-bold text-white shadow-md disabled:cursor-wait disabled:opacity-60"
            disabled={saving || (!isChild && !name.trim())}
          >
            <Check className="h-5 w-5" />
            {saving ? "Salvando..." : "Salvar perfil"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
