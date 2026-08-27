"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Play,
  Star,
  Gamepad2,
  Trophy,
  Wand2,
  Headphones,
  Clapperboard,
  Rocket,
  Compass,
} from "lucide-react";
import {
  getLatestExerciseLists,
  getStudentStudyOverview,
} from "../utils/exerciseRepository";
import {
  SUBJECTS as STATIC_SUBJECTS,
  getSubjectsFromDB,
  getSubject,
  resolveSubject,
} from "../utils/subjects";
import {
  getMaterials,
  getCategoryInfo,
  detectMediaType,
} from "../utils/materialRepository";
import { getGames } from "../utils/gameRepository";
import SubjectCard from "./SubjectCard";
import MaterialViewerModal from "./MaterialViewerModal";
import { GameViewerModal } from "./GameComponents";
import Sticker from "./ui/Sticker";
import { useAuth } from "../hooks/useAuth";
import { getPoints, POINTS_EVENT } from "../utils/points";
import { getChildAvatar } from "../utils/avatars";
import { cn } from "../utils/cn";

const gridVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const popVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.94 },
  show: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 250, damping: 20 } },
};

/** Decorative clouds: [left%, top rem, size rem, animation delay s, opacity] */
const CLOUDS = [
  { top: "3rem", size: "5rem", delay: "0s", opacity: 0.75 },
  { top: "11rem", size: "3.25rem", delay: "-14s", opacity: 0.55 },
  { top: "22rem", size: "4rem", delay: "-26s", opacity: 0.4 },
];

/** Decorative twinkling stars: [left%, top%, size px, delay s] */
const TWINKLES = [
  { left: "8%", top: "12%", size: 12, delay: "0s" },
  { left: "23%", top: "34%", size: 8, delay: "-0.8s" },
  { left: "41%", top: "8%", size: 10, delay: "-1.6s" },
  { left: "58%", top: "28%", size: 7, delay: "-2.2s" },
  { left: "72%", top: "14%", size: 11, delay: "-1.1s" },
  { left: "88%", top: "38%", size: 9, delay: "-2.8s" },
  { left: "15%", top: "62%", size: 9, delay: "-1.9s" },
  { left: "80%", top: "68%", size: 8, delay: "-0.4s" },
];

/**
 * Tilted ribbon heading that opens each "world" of the playground.
 * Keeps the sections visually distinct without repeating markup.
 */
function WorldSign({ icon, title, subtitle, hex, tilt = "-1.4deg" }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span
        aria-hidden="true"
        className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-[3px] border-white text-2xl shadow-md"
        style={{ backgroundColor: `${hex}33`, boxShadow: `0 5px 0 ${hex}55` }}
      >
        {icon}
      </span>
      <div
        className="anim-swing min-w-0 rounded-2xl border-[3px] border-white px-4 py-2 shadow-md"
        style={{
          transform: `rotate(${tilt})`,
          backgroundImage: `linear-gradient(100deg, ${hex}2A, #ffffff 85%)`,
          boxShadow: `0 5px 0 ${hex}44`,
        }}
      >
        <h2 className="font-display text-lg font-bold leading-tight text-ink sm:text-xl">
          {title}
        </h2>
        <p className="text-[11px] font-semibold text-ink-soft sm:text-xs">{subtitle}</p>
      </div>
    </div>
  );
}

export default function StudentStudyDashboard() {
  const { user, child } = useAuth();
  const [subjects, setSubjects] = useState(STATIC_SUBJECTS.map(resolveSubject));
  const [latestLists, setLatestLists] = useState([]);
  const [allMaterials, setAllMaterials] = useState([]);
  const [latestMaterials, setLatestMaterials] = useState([]);
  const [games, setGames] = useState([]);
  const [studyOverview, setStudyOverview] = useState({
    recentSessions: [],
    completedMap: {},
    needsReview: [],
    lastSession: null,
  });
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [points, setPointsState] = useState(0);

  const studentName = child?.display_name || user?.user_metadata?.display_name || "Estudante";
  const avatar = getChildAvatar(child?.avatar);

  // Read points after mount: getPoints() returns 0 on the server, so reading it
  // during render would desync hydration. Also keeps the counter live.
  useEffect(() => {
    setPointsState(getPoints());
    const sync = () => setPointsState(getPoints());
    window.addEventListener(POINTS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(POINTS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [dbSubjects, lists, mats, gamesData, overview] = await Promise.all([
        getSubjectsFromDB(false),
        getLatestExerciseLists(6),
        getMaterials({ publishedOnly: true, childId: child?.id }),
        getGames({ publishedOnly: true, childId: child?.id }),
        getStudentStudyOverview(child?.id, user?.id),
      ]);

      setSubjects(dbSubjects);
      setLatestLists(lists);
      setAllMaterials(mats);
      setLatestMaterials(mats.slice(0, 6));
      setGames(gamesData);
      setStudyOverview(overview);
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar dashboard de estudo:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [child?.id, user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const subjectStatsMap = useMemo(() => {
    const map = {};
    for (const s of subjects) {
      const subjectMaterials = allMaterials.filter((m) => m.subject_id === s.id);
      map[s.id] = {
        lists: latestLists.filter((l) => l.subject === s.id).length,
        materials: subjectMaterials.length,
        games: games.filter((g) => g.subject_id === s.id).length,
        unseenMaterials: subjectMaterials.filter(
          (m) => !m.accessStatus?.viewed && !m.accessStatus?.downloaded
        ).length,
      };
    }
    return map;
  }, [subjects, allMaterials, latestLists, games]);

  /** Adventure progress across all three pillars. */
  const progress = useMemo(() => {
    const doneLists = latestLists.filter(
      (l) => studyOverview.completedMap[`${l.subject}/${l.slug}`]
    ).length;
    const doneGames = games.filter((g) => g.playStatus?.played).length;
    const doneMaterials = allMaterials.filter(
      (m) => m.accessStatus?.viewed || m.accessStatus?.downloaded
    ).length;
    const done = doneLists + doneGames + doneMaterials;
    const total = latestLists.length + games.length + allMaterials.length;
    return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [latestLists, games, allMaterials, studyOverview.completedMap]);

  /**
   * The single next thing the child should do, in priority order:
   * shore up a weak topic, then new list, new game, new material.
   * This is what turns a wall of cards into actual guidance.
   */
  const mission = useMemo(() => {
    const review = studyOverview.needsReview?.[0];
    if (review) {
      const theme = getSubject(review.subject);
      return {
        kind: "review",
        emoji: "🩹",
        eyebrow: "Hora de reforçar!",
        title: review.title,
        hint: `Você fez ${review.lastScore}% na última vez. Bora melhorar essa nota?`,
        cta: "Tentar de novo",
        hex: theme?.hex || "#FF70A6",
        href: `/materias/${review.subject}/lista?listId=${review.slug}`,
      };
    }

    const freshList = latestLists.find(
      (l) => !studyOverview.completedMap[`${l.subject}/${l.slug}`]
    );
    if (freshList) {
      const theme = getSubject(freshList.subject);
      return {
        kind: "list",
        emoji: theme?.emoji || "✏️",
        eyebrow: "Aventura nova!",
        title: freshList.title,
        hint: `${freshList.questionCount} desafios esperando por você.`,
        cta: "Começar",
        hex: theme?.hex || "#A370FF",
        href: `/materias/${freshList.subject}/lista?listId=${freshList.slug}`,
      };
    }

    const freshGame = games.find((g) => !g.playStatus?.played);
    if (freshGame) {
      return {
        kind: "game",
        emoji: "🕹️",
        eyebrow: "Jogo novo na área!",
        title: freshGame.title,
        hint: `Vale até ${freshGame.max_score || 100} pontos de conhecimento.`,
        cta: "Jogar agora",
        hex: "#4CC9F0",
        onClick: () => setSelectedGame(freshGame),
      };
    }

    const freshMaterial = allMaterials.find(
      (m) => !m.accessStatus?.viewed && !m.accessStatus?.downloaded
    );
    if (freshMaterial) {
      return {
        kind: "material",
        emoji: "🔍",
        eyebrow: "Descobrir algo novo!",
        title: freshMaterial.title,
        hint: "Um material fresquinho acabou de chegar pra você.",
        cta: "Abrir",
        hex: "#06D6A0",
        onClick: () => setSelectedMaterial(freshMaterial),
      };
    }

    return {
      kind: "done",
      emoji: "🏆",
      eyebrow: "Você arrasou!",
      title: "Tudo completo por aqui!",
      hint: "Já fez todas as aventuras disponíveis. Que tal treinar de novo pra subir a nota?",
      cta: null,
      hex: "#FFD166",
    };
  }, [studyOverview.needsReview, studyOverview.completedMap, latestLists, games, allMaterials]);

  const nextStarGoal = Math.max(100, (Math.floor(points / 100) + 1) * 100);
  const starPct = Math.round((points / nextStarGoal) * 100);

  return (
    <div className="relative">
      {/* ============ Decorative sky ============ */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[46rem] overflow-hidden"
        style={{
          // Fade the whole layer out, otherwise the confetti and gradient
          // cut off in a hard horizontal seam at the container's edge.
          maskImage: "linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 62%, transparent 100%)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#DFF3FF] via-[#F4E9FF] to-transparent" />
        <div className="bg-confetti absolute inset-0 opacity-45" />

        {/* Drifting clouds */}
        {CLOUDS.map((c, i) => (
          <span
            key={i}
            className="anim-drift absolute select-none"
            style={{ top: c.top, fontSize: c.size, animationDelay: c.delay, opacity: c.opacity }}
          >
            ☁️
          </span>
        ))}

        {/* Twinkling stars */}
        {TWINKLES.map((t, i) => (
          <span
            key={i}
            className="anim-twinkle absolute rounded-full bg-white"
            style={{
              left: t.left,
              top: t.top,
              width: t.size,
              height: t.size,
              animationDelay: t.delay,
              boxShadow: "0 0 10px 2px rgba(255,255,255,.9)",
            }}
          />
        ))}

        {/* Soft rainbow arc */}
        <div
          className="absolute -right-24 top-10 h-72 w-72 rounded-full opacity-30 blur-2xl"
          style={{
            background:
              "conic-gradient(from 200deg, #FF70A6, #FFD166, #06D6A0, #4CC9F0, #A370FF, #FF70A6)",
          }}
        />
      </div>

      <div className="mx-auto max-w-5xl space-y-12 px-4 pb-24 pt-6 sm:pt-10">
        {/* ============ Hero: greeting + mission ============ */}
        <section className="space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            {/* Avatar orb */}
            <motion.span
              aria-hidden="true"
              className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-[4px] border-white bg-gradient-to-br from-[#FFE3F0] to-[#E1F6FD] text-4xl shadow-[0_8px_0_rgba(163,112,255,.28)] sm:h-24 sm:w-24 sm:text-5xl"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 14 }}
            >
              {avatar.emoji}
            </motion.span>

            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-bold leading-tight text-ink sm:text-4xl">
                Oi, <span className="text-gradient">{studentName}</span>!
              </h1>
              <p className="mt-1 text-sm font-semibold text-ink-soft sm:text-base">
                Bem-vindo ao seu mundo de aventuras ✨
              </p>
            </div>

            {/* Star pouch */}
            <div className="relative shrink-0 rounded-[1.6rem] border-[3px] border-white bg-cloud px-4 py-3 shadow-[0_6px_0_rgba(255,209,102,.55)]">
              <Sticker className="-right-2 -top-3 text-lg" anim="sparkle">✨</Sticker>
              <div className="flex items-center gap-2">
                <Star className="h-6 w-6 fill-[#FFD166] text-[#FFD166]" />
                <div>
                  <p className="font-display text-xl font-bold leading-none text-ink">{points}</p>
                  <p className="text-[10px] font-bold text-ink-soft">estrelinhas</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-sun-soft">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#FFD166] to-[#FF9770]"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, starPct)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="mt-1 text-[9px] font-bold text-ink-soft">
                faltam {Math.max(0, nextStarGoal - points)} p/ {nextStarGoal} ⭐
              </p>
            </div>
          </div>

          {/* ---- Missão de hoje ---- */}
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.1 }}
            className="anim-rainbow relative overflow-hidden rounded-[2.3rem] p-[7px] shadow-[0_14px_34px_-12px_rgba(163,112,255,.55)]"
            style={{
              backgroundImage: `linear-gradient(115deg, ${mission.hex} 0%, #FFD166 26%, #06D6A0 48%, #4CC9F0 70%, #A370FF 88%, ${mission.hex} 100%)`,
            }}
          >
            <div className="relative overflow-hidden rounded-[1.95rem] bg-cream p-5 sm:p-7">
              <Sticker className="right-5 top-4 text-4xl sm:text-5xl" anim="float">
                {mission.emoji}
              </Sticker>

              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-sm"
                style={{ backgroundColor: mission.hex }}
              >
                <Compass className="h-3.5 w-3.5" />
                Missão de hoje
              </span>

              <p className="mt-3 font-display text-lg font-bold text-ink-soft sm:text-xl">
                {mission.eyebrow}
              </p>
              <h2 className="pr-16 font-display text-xl font-bold leading-tight text-ink sm:text-3xl">
                {mission.title}
              </h2>
              <p className="mt-2 max-w-xl pr-12 text-xs font-semibold text-ink-soft sm:text-sm">
                {mission.hint}
              </p>

              {mission.cta && (
                <div className="mt-5">
                  {mission.href ? (
                    <Link
                      href={mission.href}
                      className="press inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-display text-sm font-bold text-white outline-none transition focus-visible:ring-4 focus-visible:ring-lilac/40 sm:text-base"
                      style={{ backgroundColor: mission.hex, boxShadow: `0 6px 0 ${mission.hex}99` }}
                    >
                      <Rocket className="h-5 w-5" />
                      {mission.cta}
                    </Link>
                  ) : (
                    <button
                      onClick={mission.onClick}
                      className="press inline-flex items-center gap-2 rounded-2xl px-6 py-3 font-display text-sm font-bold text-white outline-none transition focus-visible:ring-4 focus-visible:ring-lilac/40 sm:text-base"
                      style={{ backgroundColor: mission.hex, boxShadow: `0 6px 0 ${mission.hex}99` }}
                    >
                      <Rocket className="h-5 w-5" />
                      {mission.cta}
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* ---- Trilha de progresso ---- */}
          {progress.total > 0 && (
            <div className="rounded-[1.8rem] border-[3px] border-white bg-cloud/85 p-4 shadow-[0_6px_0_rgba(163,112,255,.2)]">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-sm font-bold text-ink">
                  🗺️ Sua trilha de aventuras
                </p>
                <p className="text-xs font-bold text-ink-soft">
                  {progress.done} de {progress.total} concluídas
                </p>
              </div>
              <div className="relative h-7 w-full rounded-full bg-lilac-soft/70 p-1">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#06D6A0] via-[#4CC9F0] to-[#A370FF]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.pct}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                />
                <motion.span
                  aria-hidden="true"
                  className="absolute top-[-9px] grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-cloud text-lg shadow-md"
                  initial={{ left: 0 }}
                  animate={{ left: `calc(${progress.pct}% - 18px)` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                >
                  {avatar.emoji}
                </motion.span>
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className="rounded-[1.6rem] border-[3px] border-white bg-candy-soft p-5 text-center text-sm font-bold text-[#a62f5f] shadow-md">
            Ops! Algo deu errado ao carregar suas aventuras. Tente recarregar a página. 🙈
          </div>
        )}

        {/* ============ Mundo das matérias ============ */}
        <section>
          <WorldSign
            icon="🪐"
            title="Mundo das Matérias"
            subtitle="Escolha um planeta pra explorar"
            hex="#A370FF"
            tilt="-1.4deg"
          />

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-[1.9rem] bg-white/60" />
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6"
              variants={gridVariants}
              initial="hidden"
              animate="show"
            >
              {subjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  listCount={subjectStatsMap[subject.id]?.lists ?? 0}
                  materialCount={subjectStatsMap[subject.id]?.materials ?? 0}
                  unseenMaterialCount={subjectStatsMap[subject.id]?.unseenMaterials ?? 0}
                />
              ))}
            </motion.div>
          )}
        </section>

        {/* ============ Fliperama ============ */}
        {games.length > 0 && (
          <section>
            <WorldSign
              icon="🕹️"
              title="Fliperama Mágico"
              subtitle="Joguinhos pra aprender brincando"
              hex="#4CC9F0"
              tilt="1.2deg"
            />

            <motion.div
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              variants={gridVariants}
              initial="hidden"
              animate="show"
            >
              {games.map((g) => {
                const subjectObj = subjects.find((s) => s.id === g.subject_id);
                const played = g.playStatus?.played;
                const hex = subjectObj?.hex || "#4CC9F0";

                return (
                  <motion.div key={g.id} variants={popVariants}>
                    <motion.button
                      type="button"
                      onClick={() => setSelectedGame(g)}
                      whileHover={{ y: -8, rotate: 1 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 320, damping: 18 }}
                      aria-label={`Jogar ${g.title}`}
                      className="group relative w-full overflow-hidden rounded-[2rem] border-[4px] border-white bg-cloud text-left outline-none focus-visible:ring-4 focus-visible:ring-sky/50"
                      style={{ boxShadow: `0 9px 0 ${hex}55, 0 18px 30px -16px ${hex}` }}
                    >
                      {/* Arcade screen */}
                      <div
                        className="relative h-40 w-full overflow-hidden"
                        style={{ backgroundImage: `linear-gradient(150deg, ${hex}, #A370FF)` }}
                      >
                        {g.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={g.cover_url}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <span className="grid h-full w-full place-items-center text-5xl">🎮</span>
                        )}

                        {/* Glossy arcade shine */}
                        <div
                          aria-hidden="true"
                          className="absolute inset-0"
                          style={{
                            background:
                              "radial-gradient(circle at 22% 12%, rgba(255,255,255,.5), transparent 42%)",
                          }}
                        />

                        <span
                          className="absolute left-3 top-3 rounded-full border-2 border-white/70 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm"
                          style={{ backgroundColor: `${hex}EE` }}
                        >
                          {subjectObj?.emoji} {subjectObj?.name || g.subject_id}
                        </span>

                        <span className="absolute right-3 top-3">
                          {played ? (
                            <span className="inline-flex items-center gap-1 rounded-full border-2 border-white bg-[#06D6A0] px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                              <Trophy className="h-3 w-3" /> {g.playStatus?.bestScore} pts
                            </span>
                          ) : (
                            <span className="anim-bob inline-flex items-center gap-1 rounded-full border-2 border-white bg-[#ff477e] px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                              <Sparkles className="h-3 w-3" /> NOVO
                            </span>
                          )}
                        </span>

                        {/* Big play bubble */}
                        <span className="absolute inset-0 grid place-items-center">
                          <span className="grid h-16 w-16 place-items-center rounded-full border-[4px] border-white bg-gradient-to-br from-[#FFE381] to-[#FF9770] text-ink shadow-xl transition-transform duration-300 group-hover:scale-115">
                            <Play className="ml-1 h-7 w-7 fill-current" />
                          </span>
                        </span>
                      </div>

                      {/* Cabinet body */}
                      <div className="p-4">
                        <h3 className="font-display text-base font-bold leading-tight text-ink line-clamp-1">
                          {g.title}
                        </h3>
                        <p className="mt-1 text-xs font-semibold text-ink-soft line-clamp-2">
                          {g.description || "Um desafio divertido esperando por você!"}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[11px] font-extrabold text-[#d49911]">
                            ⭐ até {g.max_score || 100} pts
                          </span>
                          <span
                            className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-white"
                            style={{ backgroundColor: hex, boxShadow: `0 4px 0 ${hex}99` }}
                          >
                            <Play className="h-3 w-3 fill-current" /> Jogar
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  </motion.div>
                );
              })}
            </motion.div>
          </section>
        )}

        {/* ============ Desafios ============ */}
        <section>
          <WorldSign
            icon="✏️"
            title="Trilha de Desafios"
            subtitle="Resolva e colecione estrelinhas"
            hex="#FF70A6"
            tilt="-1deg"
          />

          {latestLists.length === 0 ? (
            <div className="rounded-[1.8rem] border-[3px] border-white bg-cloud/85 p-8 text-center shadow-md">
              <span className="text-4xl">🌱</span>
              <p className="mt-2 font-display text-base font-bold text-ink">
                Nenhum desafio por aqui ainda!
              </p>
              <p className="mt-1 text-xs font-semibold text-ink-soft">
                Logo vão aparecer aventuras novas pra você.
              </p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 gap-3.5 sm:grid-cols-2"
              variants={gridVariants}
              initial="hidden"
              animate="show"
            >
              {latestLists.map((list) => {
                const theme =
                  subjects.find((s) => s.id === list.subject) ||
                  getSubject(list.subject) ||
                  resolveSubject({ id: list.subject, name: list.materia || list.subject });
                const hex = theme?.hex || "#A370FF";
                const isCompleted = studyOverview.completedMap[`${list.subject}/${list.slug}`];

                return (
                  <motion.div key={`${list.subject}-${list.slug}`} variants={popVariants}>
                    <motion.div
                      whileHover={{ y: -6, rotate: -0.8 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 320, damping: 18 }}
                    >
                      <Link
                        href={`/materias/${list.subject}/lista?listId=${list.slug}`}
                        className="group flex items-center gap-4 rounded-[1.9rem] border-[4px] border-white bg-cloud p-4 outline-none focus-visible:ring-4 focus-visible:ring-candy/40"
                        style={{ boxShadow: `0 8px 0 ${hex}44, 0 16px 26px -18px ${hex}` }}
                      >
                        <span
                          aria-hidden="true"
                          className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-2xl shadow-inner transition-transform duration-300 group-hover:scale-110"
                          style={{
                            background: `radial-gradient(circle at 32% 28%, #ffffff, ${hex}55)`,
                          }}
                        >
                          {theme?.emoji || "📖"}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-extrabold text-ink-soft">
                              {theme?.name || list.subject}
                            </span>
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#06D6A0] px-2 py-0.5 text-[10px] font-extrabold text-white">
                                ⭐ {isCompleted.bestScore}%
                              </span>
                            ) : (
                              <span className="anim-bob inline-flex items-center gap-1 rounded-full bg-[#ff477e] px-2 py-0.5 text-[10px] font-extrabold text-white">
                                <Sparkles className="h-2.5 w-2.5" /> NOVO
                              </span>
                            )}
                          </div>

                          <h3 className="font-display text-base font-bold leading-tight text-ink line-clamp-1">
                            {list.title}
                          </h3>
                          <p className="text-[11px] font-semibold text-ink-soft">
                            {list.questionCount} desafios
                          </p>
                        </div>

                        <span
                          aria-hidden="true"
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white transition-transform duration-300 group-hover:translate-x-1"
                          style={{ backgroundColor: hex, boxShadow: `0 4px 0 ${hex}99` }}
                        >
                          <ArrowRight className="h-5 w-5" strokeWidth={3} />
                        </span>
                      </Link>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>

        {/* ============ Cineminha & Fones ============ */}
        <section>
          <WorldSign
            icon="🎬"
            title="Cineminha & Fones"
            subtitle="Vídeos, áudios e resumos pra curtir"
            hex="#06D6A0"
            tilt="1.4deg"
          />

          {latestMaterials.length === 0 ? (
            <div className="rounded-[1.8rem] border-[3px] border-white bg-cloud/85 p-8 text-center shadow-md">
              <span className="text-4xl">🍿</span>
              <p className="mt-2 font-display text-base font-bold text-ink">
                A sessão ainda não começou!
              </p>
              <p className="mt-1 text-xs font-semibold text-ink-soft">
                Em breve vídeos e áudios novinhos aqui.
              </p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              variants={gridVariants}
              initial="hidden"
              animate="show"
            >
              {latestMaterials.map((mat) => {
                const catInfo = getCategoryInfo(mat.category);
                const subjectObj = subjects.find((s) => s.id === mat.subject_id);
                const mediaType =
                  mat.media_type || detectMediaType(mat.file_type, mat.file_name);
                const isViewed = mat.accessStatus?.viewed || mat.accessStatus?.downloaded;
                const hex = subjectObj?.hex || "#06D6A0";

                const stage = {
                  video: { emoji: "🎬", label: "Vídeo", icon: Clapperboard, from: "#A370FF", to: "#FF70A6" },
                  audio: { emoji: "🎧", label: "Áudio", icon: Headphones, from: "#4CC9F0", to: "#06D6A0" },
                  image: { emoji: "🖼️", label: "Imagem", icon: Wand2, from: "#FFD166", to: "#FF9770" },
                  document: { emoji: "📄", label: "Resumo", icon: Wand2, from: "#06D6A0", to: "#4CC9F0" },
                }[mediaType] || { emoji: "📄", label: "Resumo", icon: Wand2, from: "#06D6A0", to: "#4CC9F0" };
                const StageIcon = stage.icon;

                return (
                  <motion.div key={mat.id} variants={popVariants}>
                    <motion.button
                      type="button"
                      onClick={() => setSelectedMaterial(mat)}
                      whileHover={{ y: -8, rotate: -1 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 320, damping: 18 }}
                      aria-label={`Abrir ${mat.title}`}
                      className="group relative w-full overflow-hidden rounded-[2rem] border-[4px] border-white bg-cloud text-left outline-none focus-visible:ring-4 focus-visible:ring-mint/50"
                      style={{ boxShadow: `0 9px 0 ${hex}44, 0 18px 30px -18px ${hex}` }}
                    >
                      {/* Playful stage */}
                      <div
                        className="relative grid h-28 place-items-center"
                        style={{ backgroundImage: `linear-gradient(135deg, ${stage.from}, ${stage.to})` }}
                      >
                        <div
                          aria-hidden="true"
                          className="absolute inset-0"
                          style={{
                            background:
                              "radial-gradient(circle at 24% 18%, rgba(255,255,255,.55), transparent 45%)",
                          }}
                        />
                        <span aria-hidden="true" className="anim-bob text-5xl drop-shadow-md">
                          {stage.emoji}
                        </span>

                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border-2 border-white/70 bg-white/25 px-2 py-0.5 text-[10px] font-extrabold text-white backdrop-blur-sm">
                          <StageIcon className="h-3 w-3" />
                          {stage.label}
                        </span>

                        {!isViewed && (
                          <span className="anim-bob absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border-2 border-white bg-[#ff477e] px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                            <Sparkles className="h-2.5 w-2.5" /> NOVO
                          </span>
                        )}
                        {isViewed && (
                          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border-2 border-white bg-[#06D6A0] px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                            ✓ visto
                          </span>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="font-display text-base font-bold leading-tight text-ink line-clamp-2">
                          {mat.title}
                        </h3>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="truncate text-[11px] font-extrabold text-ink-soft">
                            {subjectObj?.emoji} {subjectObj?.name || mat.subject_id}
                          </span>
                          <span
                            className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold text-white"
                            style={{ backgroundColor: hex, boxShadow: `0 4px 0 ${hex}99` }}
                          >
                            {catInfo.label}
                          </span>
                        </div>
                      </div>
                    </motion.button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>

        {/* ============ Closing cheer ============ */}
        <section className="relative overflow-hidden rounded-[2.2rem] border-[4px] border-white bg-gradient-to-r from-[#FFE3F0] via-[#FFF0C9] to-[#D3F1FB] p-6 text-center shadow-[0_10px_0_rgba(163,112,255,.18)] sm:p-8">
          <Sticker className="left-6 top-4 text-3xl" anim="float">🎈</Sticker>
          <Sticker className="right-6 top-6 text-3xl" anim="float-slow">🌈</Sticker>
          <Sticker className="bottom-4 left-1/3 text-2xl" anim="sparkle">⭐</Sticker>

          <p className="relative font-display text-lg font-bold text-ink sm:text-2xl">
            Cada estrelinha é uma coisa nova que você aprendeu! 🌟
          </p>
          <p className="relative mt-1 text-xs font-semibold text-ink-soft sm:text-sm">
            Continue explorando — tem sempre uma aventura nova esperando por você.
          </p>
        </section>
      </div>

      {/* Material Viewer Modal */}
      <AnimatePresence>
        {selectedMaterial && (
          <MaterialViewerModal
            material={selectedMaterial}
            onClose={() => setSelectedMaterial(null)}
            onAccessLogged={() => loadDashboardData()}
          />
        )}
      </AnimatePresence>

      {/* Game Viewer Modal */}
      <AnimatePresence>
        {selectedGame && (
          <GameViewerModal
            game={selectedGame}
            onClose={() => setSelectedGame(null)}
            onGameCompleted={() => loadDashboardData()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
