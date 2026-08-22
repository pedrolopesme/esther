"use client";

import Link from "next/link";
import { Sparkles, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import Sticker from "./ui/Sticker";

export default function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-16 w-16 animate-spin rounded-full border-4 border-lilac/25 border-t-lilac" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 pb-16 pt-12">
        <motion.div
          className="clay bg-white/80 p-8 text-center"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <Sticker className="left-2 top-2 text-4xl" anim="float">🔒</Sticker>
          <div className="mb-4 text-5xl">🎒</div>
          <h1 className="font-display text-2xl font-bold text-ink">Hora de estudar!</h1>
          <p className="mt-3 text-sm text-ink-soft">
            Para resolver os exercícios e guardar sua pontuação,
            <br />
            entre com sua conta da Esther.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/login"
              className="press flex items-center justify-center gap-2 rounded-2xl bg-lilac px-5 py-3 font-display font-bold text-white shadow-md"
            >
              <LogIn className="h-5 w-5" />
              Entrar na minha conta
            </Link>
            <Link
              href="/login?tab=register"
              className="press flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-display font-bold text-ink shadow-sm"
            >
              <Sparkles className="h-5 w-5 text-candy" />
              Criar conta nova
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return children;
}
