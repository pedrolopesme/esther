"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Star, BookOpen, Brain, Trophy, ArrowRight, Heart, Zap, Shield } from "lucide-react";

const fadeUp = {
  hidden: { y: 30, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 22 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const SUBJECTS_PREVIEW = [
  { emoji: "🔢", name: "Matemática", color: "from-blue-400 to-indigo-500" },
  { emoji: "📚", name: "Português", color: "from-pink-400 to-rose-500" },
  { emoji: "🗣️", name: "Inglês", color: "from-emerald-400 to-teal-500" },
  { emoji: "🗺️", name: "Geografia", color: "from-amber-400 to-orange-500" },
  { emoji: "📜", name: "História", color: "from-violet-400 to-purple-600" },
  { emoji: "🔬", name: "Ciências", color: "from-cyan-400 to-sky-500" },
];

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-4 pb-12 pt-8 text-center">
        {/* Decorative background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-lilac/15 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-candy/15 blur-3xl" />
          <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-sky/10 blur-3xl" />
        </div>

        <motion.div
          className="relative z-10"
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Big emoji mascot */}
          <motion.div variants={fadeUp} className="mb-6 text-7xl sm:text-8xl">
            🦄
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-display text-4xl font-bold leading-tight text-ink sm:text-6xl"
          >
            Estudar nunca foi tão{" "}
            <span className="text-gradient">divertido</span> ✨
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-5 max-w-xl text-lg text-ink-soft sm:text-xl"
          >
            A Esther transforma a revisão para as provas em uma aventura colorida,
            cheia de feedback imediato e recompensas. Ideal para crianças do Ensino Fundamental.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          >
            <Link
              href="/login?tab=register"
              className="press flex items-center gap-2 rounded-full bg-gradient-to-r from-lilac to-candy px-8 py-4 font-display text-lg font-bold text-white shadow-lg shadow-lilac/30 hover:shadow-xl hover:shadow-lilac/40"
            >
              <Sparkles className="h-5 w-5" />
              Começar agora — é grátis!
            </Link>
            <Link
              href="/login"
              className="press flex items-center gap-2 rounded-full bg-white/80 px-6 py-4 font-display font-semibold text-ink shadow-md ring-1 ring-lilac/15 hover:text-lilac"
            >
              Já tenho conta
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Quick stats */}
          <motion.div
            variants={fadeUp}
            className="mx-auto mt-10 flex max-w-md items-center justify-center gap-6 text-sm text-ink-soft sm:gap-10"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-lilac">6</span>
              <span>Matérias</span>
            </div>
            <div className="h-8 w-px bg-lilac/20" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-candy">30+</span>
              <span>Listas</span>
            </div>
            <div className="h-8 w-px bg-lilac/20" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-2xl font-bold text-sky">500+</span>
              <span>Questões</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="h-6 w-4 rounded-full border-2 border-ink-soft/30">
            <div className="mx-auto mt-1 h-2 w-1 rounded-full bg-ink-soft/40" />
          </div>
        </motion.div>
      </section>

      {/* ═══════════════ SUBJECTS SHOWCASE ═══════════════ */}
      <section className="relative px-4 pb-20 pt-8">
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
          >
            <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
              Matérias que viram aventuras 🎮
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-ink-soft">
              Cada matéria tem listas temáticas com feedback instantâneo, dicas e estrelas.
            </p>
          </motion.div>

          <motion.div
            className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            {SUBJECTS_PREVIEW.map((sub) => (
              <motion.div
                key={sub.name}
                variants={fadeUp}
                whileHover={{ y: -8, scale: 1.05 }}
                className="clay flex flex-col items-center gap-3 p-5 text-center"
              >
                <div
                  className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br text-3xl shadow-md ${sub.color}`}
                >
                  {sub.emoji}
                </div>
                <span className="font-display text-sm font-bold text-ink">{sub.name}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="px-4 pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h2
            className="font-display text-3xl font-bold text-ink sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Como funciona? 🧩
          </motion.h2>

          <motion.div
            className="mt-10 grid gap-6 sm:grid-cols-3"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            {[
              {
                icon: BookOpen,
                title: "Escolha a matéria",
                desc: "Selecione entre Matemática, Português, Inglês e mais!",
                color: "text-lilac",
                bg: "bg-lilac/10",
              },
              {
                icon: Brain,
                title: "Responda os exercícios",
                desc: "Questões interativas com feedback imediato e dicas úteis.",
                color: "text-sky",
                bg: "bg-sky/10",
              },
              {
                icon: Trophy,
                title: "Ganhe estrelas",
                desc: "A cada acerto, acumule pontos e suba de nível!",
                color: "text-sun",
                bg: "bg-sun/10",
              },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <motion.div key={title} variants={fadeUp} className="clay p-6 text-center">
                <div className={`mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl ${bg}`}>
                  <Icon className={`h-7 w-7 ${color}`} strokeWidth={2} />
                </div>
                <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ BENEFITS ═══════════════ */}
      <section className="px-4 pb-20">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            className="text-center font-display text-3xl font-bold text-ink sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Por que pais e professores amam 💜
          </motion.h2>

          <motion.div
            className="mt-10 grid gap-4 sm:grid-cols-2"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            {[
              { icon: Zap, text: "Feedback instantâneo — a criança aprende com cada erro", color: "text-sun" },
              { icon: Star, text: "Gamificação — pontos, níveis e estímulos para continuar", color: "text-lilac" },
              { icon: Shield, text: "Ambiente seguro — sem anúncios, sem distrações", color: "text-mint" },
              { icon: Heart, text: "Feito com carinho para o Ensino Fundamental", color: "text-candy" },
            ].map(({ icon: Icon, text, color }) => (
              <motion.div
                key={text}
                variants={fadeUp}
                className="flex items-start gap-3 rounded-2xl bg-white/60 p-4 shadow-sm ring-1 ring-white"
              >
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} strokeWidth={2.5} />
                <span className="text-sm font-medium text-ink">{text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="px-4 pb-24 pt-4">
        <motion.div
          className="clay mx-auto max-w-2xl p-8 text-center sm:p-12"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
        >
          <div className="mb-4 text-5xl">🌈</div>
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            Pronto para a aventura?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-ink-soft">
            Crie sua conta gratuita e comece a estudar de um jeito divertido e eficiente.
          </p>
          <Link
            href="/login?tab=register"
            className="press mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-lilac to-candy px-8 py-4 font-display text-lg font-bold text-white shadow-lg"
          >
            <Sparkles className="h-5 w-5" />
            Criar conta grátis
          </Link>
        </motion.div>
      </section>

    </div>
  );
}