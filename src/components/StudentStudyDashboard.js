"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  CalendarDays,
  ListChecks,
  ArrowRight,
  FolderDown,
  Play,
  RotateCcw,
  AlertTriangle,
  Award,
  Video,
  Music,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  TrendingUp,
  Target,
  Flame,
  Star,
  BookOpen,
  Gamepad2,
  Trophy,
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
  formatFileSize,
  detectMediaType,
} from "../utils/materialRepository";
import { getGames } from "../utils/gameRepository";
import SubjectCard from "./SubjectCard";
import MaterialViewerModal from "./MaterialViewerModal";
import { GameViewerModal } from "./GameComponents";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Sticker from "./ui/Sticker";
import { useAuth } from "../hooks/useAuth";
import { getPoints } from "../utils/points";
import { cn } from "../utils/cn";

const gridVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 20 } },
};

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

  const studentName = child?.display_name || user?.user_metadata?.display_name || "Estudante";
  const points = getPoints();

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

  function getMediaIcon(mediaType) {
    switch (mediaType) {
      case "video":
        return <Video className="h-4 w-4 text-[#A370FF]" />;
      case "audio":
        return <Music className="h-4 w-4 text-[#4CC9F0]" />;
      case "image":
        return <ImageIcon className="h-4 w-4 text-[#FF70A6]" />;
      case "document":
      default:
        return <FileText className="h-4 w-4 text-[#06D6A0]" />;
    }
  }

  // Count exercises & materials per subject
  const subjectStatsMap = {};
  for (const s of subjects) {
    const subjectMaterials = allMaterials.filter((m) => m.subject_id === s.id);
    const subjectGames = games.filter((g) => g.subject_id === s.id);
    subjectStatsMap[s.id] = {
      lists: latestLists.filter((l) => l.subject === s.id).length,
      materials: subjectMaterials.length,
      games: subjectGames.length,
      unseenMaterials: subjectMaterials.filter(
        (m) => !m.accessStatus?.viewed && !m.accessStatus?.downloaded
      ).length,
    };
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:pt-10 space-y-10">
      {/* ---------- Hero Greeting & Quick Stats ---------- */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#FFE3F0] via-[#EEE6FF] to-[#E1F6FD] p-6 sm:p-10 shadow-[0_12px_36px_-12px_rgba(163,112,255,0.3)]">
        <div className="bg-dots absolute inset-0 opacity-30 pointer-events-none" />
        <Sticker className="right-4 top-4 text-5xl sm:text-6xl" anim="float">
          🦄
        </Sticker>

        <div className="relative max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1 text-xs font-bold text-ink shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-candy" />
            <span>Meu Painel de Estudos</span>
          </div>

          <h1 className="font-display text-2xl font-bold leading-tight text-ink sm:text-4xl">
            Olá, <span className="text-gradient">{studentName}</span>! Vamos aprender hoje? ✨
          </h1>
          <p className="mt-2 text-sm text-ink-soft sm:text-base">
            Jogue minijogos divertidos, resolva exercícios e ganhe estrelas de conhecimento!
          </p>

          {/* Quick Metrics Badges */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white/90 px-3.5 py-2 text-xs font-bold text-ink shadow-sm">
              <Star className="h-4 w-4 fill-[#FFD166] text-[#FFD166]" />
              <span>{points} Estrelas</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white/90 px-3.5 py-2 text-xs font-bold text-ink shadow-sm">
              <Gamepad2 className="h-4 w-4 text-indigo-600" />
              <span>{games.length} Minijogos</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white/90 px-3.5 py-2 text-xs font-bold text-ink shadow-sm">
              <BookOpen className="h-4 w-4 text-lilac" />
              <span>{subjects.length} Matérias</span>
            </span>
          </div>
        </div>
      </section>

      {/* ---------- 1. STEAM-LIKE MINIJOGOS EDUCATIVOS ---------- */}
      {games.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                <Gamepad2 className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">
                    Minijogos Educativos
                  </h2>
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-extrabold text-indigo-700">
                    Jogar & Ganhar ⭐
                  </span>
                </div>
                <p className="text-xs text-ink-soft">
                  Jogos interativos estilo arcade para aprender brincando
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g) => {
              const subjectObj = subjects.find((s) => s.id === g.subject_id);
              const played = g.playStatus?.played;

              return (
                <div
                  key={g.id}
                  onClick={() => setSelectedGame(g)}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#1e1b4b] to-[#0f172a] p-0 text-white shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl cursor-pointer border border-indigo-900/50"
                >
                  {/* Game Cover / Banner (Steam style) */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                    {g.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={g.cover_url}
                        alt={g.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 text-5xl">
                        🎮
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b4b] via-transparent to-black/30" />

                    {/* Top badging */}
                    <div className="absolute left-3 top-3 flex items-center gap-1.5">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold shadow-md backdrop-blur-sm"
                        style={{
                          backgroundColor: `${subjectObj?.hex || "#A370FF"}EE`,
                          color: "#ffffff",
                        }}
                      >
                        {subjectObj?.emoji} {subjectObj?.name || g.subject_id}
                      </span>
                    </div>

                    <div className="absolute right-3 top-3">
                      {!played ? (
                        <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-pink-300 bg-[#ff477e] px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-md">
                          <Sparkles className="h-3 w-3" /> NOVO JOGO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-300 backdrop-blur-sm">
                          <Trophy className="h-3 w-3 text-emerald-400" /> {g.playStatus?.bestScore} pts
                        </span>
                      )}
                    </div>

                    {/* Play Button Overlay in Center */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-black/30 backdrop-blur-[2px]">
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-tr from-[#ffe381] to-[#ffb45f] text-slate-950 shadow-2xl transition-transform group-hover:scale-110">
                        <Play className="ml-1 h-7 w-7 fill-current" />
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-display text-lg font-bold text-white group-hover:text-[#ffe381] transition-colors line-clamp-1">
                        {g.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {g.description || "Divirta-se e teste suas habilidades neste minijogo educativo!"}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="mt-4 flex items-center justify-between border-t border-indigo-900/60 pt-3 text-xs">
                      <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                        <span>{g.ano_letivo || "Ensino Fundamental"}</span>
                        <span>&middot;</span>
                        <span className="text-[#ffd166] font-bold">Até {g.max_score || 100} pts</span>
                      </div>

                      <span className="press inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition">
                        <Play className="h-3.5 w-3.5 fill-current" /> Jogar
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ---------- 2. ONDE VOCÊ PAROU / RECOMENDAÇÃO DE ESTUDO ---------- */}
      {(studyOverview.lastSession || studyOverview.needsReview.length > 0) && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-candy/15 text-candy">
                <Flame className="h-4 w-4" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold text-ink">
                  Continue de Onde Parou
                </h2>
                <p className="text-xs text-ink-soft">
                  Revisões pendentes e seu último tópico praticado
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Last active list */}
            {studyOverview.lastSession && (
              <div className="clay flex flex-col justify-between p-5 bg-gradient-to-br from-white to-mint-soft/20">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="rounded-full bg-mint-soft px-2.5 py-0.5 text-xs font-bold text-[#05795b]">
                      Última lista praticada
                    </span>
                    <span className="text-[11px] text-ink-soft">
                      {new Date(studyOverview.lastSession.completed_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-ink line-clamp-1">
                    {studyOverview.lastSession.list_title}
                  </h3>
                  <p className="mt-1 text-xs text-ink-soft">
                    Você acertou {studyOverview.lastSession.correct_count} de{" "}
                    {studyOverview.lastSession.total_questions} questões.
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-lilac/10 pt-3">
                  <span className="text-xs font-bold text-mint">
                    {Math.round(
                      (studyOverview.lastSession.correct_count /
                        (studyOverview.lastSession.total_questions || 1)) *
                        100
                    )}
                    % de acerto
                  </span>
                  <Link
                    href={`/materias/${studyOverview.lastSession.list_subject}/lista?listId=${studyOverview.lastSession.list_slug}`}
                    className="press inline-flex items-center gap-1.5 rounded-xl bg-mint px-4 py-2 text-xs font-bold text-white shadow-sm"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Praticar Novamente
                  </Link>
                </div>
              </div>
            )}

            {/* Need review recommendation */}
            {studyOverview.needsReview.length > 0 ? (
              <div className="clay flex flex-col justify-between p-5 bg-gradient-to-br from-white to-candy-soft/20">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-candy-soft px-2.5 py-0.5 text-xs font-bold text-[#a62f5f]">
                      <AlertTriangle className="h-3 w-3" /> Recomendado Estudar
                    </span>
                    <span className="text-[11px] text-[#a62f5f] font-bold">
                      {studyOverview.needsReview[0].lastScore}% no último treino
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-ink line-clamp-1">
                    {studyOverview.needsReview[0].title}
                  </h3>
                  <p className="mt-1 text-xs text-ink-soft">
                    Revise este conteúdo para melhorar sua pontuação e fixar o aprendizado!
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-lilac/10 pt-3">
                  <span className="text-xs font-semibold text-ink-soft">
                    {studyOverview.needsReview[0].wrongCount} erros registrados
                  </span>
                  <Link
                    href={`/materias/${studyOverview.needsReview[0].subject}/lista?listId=${studyOverview.needsReview[0].slug}`}
                    className="press inline-flex items-center gap-1.5 rounded-xl bg-candy px-4 py-2 text-xs font-bold text-white shadow-sm"
                  >
                    <Play className="h-3.5 w-3.5" /> Refazer Lista
                  </Link>
                </div>
              </div>
            ) : (
              <div className="clay flex flex-col justify-center items-center p-6 text-center bg-gradient-to-br from-white to-sky-soft/20">
                <span className="text-3xl mb-1">🌟</span>
                <p className="font-display text-sm font-bold text-ink">
                  Ótimo aproveitamento!
                </p>
                <p className="text-xs text-ink-soft mt-0.5 max-w-xs">
                  Você não tem nenhum ponto fraco pendente. Continue praticando as matérias abaixo!
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---------- 3. EXPLORAR POR MATÉRIA (CARDS COMPACTOS) ---------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-lilac/15 text-lilac">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                Matérias Escolares
              </h2>
              <p className="text-xs text-ink-soft">
                Selecione uma matéria para abrir seu dashboard interativo
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="clay h-32 animate-pulse p-4" />
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-3"
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

      {/* ---------- 4. MATERIAIS DE ESTUDO RECENTES (MULTIMÍDIA) ---------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky/15 text-sky">
              <FolderDown className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                Materiais de Apoio & Multimídia
              </h2>
              <p className="text-xs text-ink-soft">
                Vídeos, podcasts, resumos e PDFs recentes para você estudar
              </p>
            </div>
          </div>
        </div>

        {latestMaterials.length === 0 ? (
          <div className="clay p-8 text-center text-ink-soft text-xs">
            Nenhum material de apoio publicado ainda. Em breve novos vídeos e resumos!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {latestMaterials.map((mat) => {
              const catInfo = getCategoryInfo(mat.category);
              const subjectObj = subjects.find((s) => s.id === mat.subject_id);
              const mediaType =
                mat.media_type || detectMediaType(mat.file_type, mat.file_name);
              const isViewed = mat.accessStatus?.viewed || mat.accessStatus?.downloaded;
              const isVideo = mediaType === "video";
              const isAudio = mediaType === "audio";

              return (
                <div
                  key={mat.id}
                  onClick={() => setSelectedMaterial(mat)}
                  className={cn(
                    "clay group relative flex cursor-pointer flex-col justify-between overflow-hidden p-4 transition-all hover:-translate-y-1 hover:shadow-xl sm:p-5",
                    isViewed && "bg-emerald-50/20 ring-1 ring-emerald-400/40",
                    isVideo && "bg-[#18181b] text-white",
                    isAudio && "bg-gradient-to-br from-[#24133f] via-[#4c1d95] to-[#0f766e] text-white"
                  )}
                >
                  {isVideo && (
                    <div className="relative -mx-4 -mt-4 mb-4 h-28 overflow-hidden bg-gradient-to-br from-[#312e81] via-[#7c3aed] to-[#db2777] sm:-mx-5 sm:-mt-5">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.35),transparent_35%),linear-gradient(135deg,transparent_45%,rgba(0,0,0,.25))]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="grid h-12 w-12 place-items-center rounded-full bg-white/95 text-[#7c3aed] shadow-xl transition-transform group-hover:scale-110">
                          <Play className="ml-0.5 h-5 w-5 fill-current" />
                        </span>
                      </div>
                      <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white">
                        VÍDEO
                      </span>
                    </div>
                  )}

                  {isAudio && (
                    <div className="relative -mx-4 -mt-4 mb-4 flex h-28 items-center gap-3 overflow-hidden bg-black/15 px-4 sm:-mx-5 sm:-mt-5 sm:px-5">
                      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#2dd4bf] text-3xl shadow-lg ring-1 ring-white/30">
                        🎧
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-white/80">PODCAST DE ESTUDO</p>
                        <p className="mt-0.5 truncate font-display text-sm font-bold text-white">Toque para ouvir</p>
                        <div className="mt-2 flex h-5 items-center gap-0.5 opacity-90">
                          {[3, 8, 14, 7, 18, 10, 5, 13, 8, 16, 6, 11, 4, 9, 15].map((height, index) => (
                            <span key={index} className="w-1 rounded-full bg-white/80" style={{ height: `${height}px` }} />
                          ))}
                        </div>
                      </div>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#4c1d95] shadow-lg transition-transform group-hover:scale-110">
                        <Play className="h-4 w-4 fill-current" />
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="mb-2.5 flex items-start justify-between gap-2">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm",
                        isVideo || isAudio ? "bg-white/15 text-white" : "bg-white/90 text-ink"
                      )}>
                        {getMediaIcon(mediaType)}
                        <span>{catInfo.label}</span>
                      </span>

                      {!isViewed && (
                        <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-[#ffb3ca] bg-[#ff477e] px-2.5 py-1 text-[10px] font-extrabold text-white shadow-[0_3px_0_#bd1f58]">
                          <Sparkles className="h-3 w-3" />
                          NOVO
                        </span>
                      )}
                    </div>

                    <h3 className={cn(
                      "font-display text-base font-bold transition-colors line-clamp-2",
                      isVideo || isAudio ? "text-white group-hover:text-white/80" : "text-ink group-hover:text-lilac"
                    )}>
                      {mat.title}
                    </h3>
                    {mat.description && (
                      <p className={cn(
                        "mt-1 text-xs line-clamp-2",
                        isVideo || isAudio ? "text-white/65" : "text-ink-soft"
                      )}>
                        {mat.description}
                      </p>
                    )}
                  </div>

                  <div className={cn(
                    "mt-4 flex items-center justify-between border-t pt-3 text-[11px]",
                    isVideo || isAudio ? "border-white/15 text-white/70" : "border-lilac/10 text-ink-soft"
                  )}>
                    <span className="font-bold">
                      {subjectObj?.emoji} {subjectObj?.name || mat.subject_id}
                    </span>
                    <span
                      className="rounded-xl px-2.5 py-1 font-bold text-white shadow-sm transition"
                      style={{ backgroundColor: subjectObj?.hex || "#A370FF" }}
                    >
                      Abrir
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------- 5. ÚLTIMAS LISTAS DE EXERCÍCIOS PUBLICADAS ---------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-candy/15 text-candy">
              <ListChecks className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                Exercícios Recentes
              </h2>
              <p className="text-xs text-ink-soft">
                Desafios e revisões prontos para jogar e ganhar estrelas
              </p>
            </div>
          </div>
        </div>

        {latestLists.length === 0 ? (
          <div className="clay p-8 text-center text-ink-soft text-xs">
            Nenhuma lista de exercícios encontrada.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {latestLists.map((list) => {
              const theme =
                subjects.find((s) => s.id === list.subject) ||
                getSubject(list.subject) ||
                resolveSubject({ id: list.subject, name: list.materia || list.subject });

              const isCompleted = studyOverview.completedMap[`${list.subject}/${list.slug}`];

              return (
                <Link
                  key={`${list.subject}-${list.slug}`}
                  href={`/materias/${list.subject}/lista?listId=${list.slug}`}
                  className="clay group flex items-start justify-between gap-3.5 p-4 sm:p-5 transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl shadow-sm"
                      style={{ backgroundColor: `${theme?.hex || "#A370FF"}22` }}
                    >
                      {theme?.emoji || "📖"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs font-bold text-ink-soft">
                          {theme?.name || list.subject}
                        </span>
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            {isCompleted.bestScore}%
                          </span>
                        ) : (
                          <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-[#ffb3ca] bg-[#ff477e] px-2.5 py-1 text-[10px] font-extrabold text-white shadow-[0_3px_0_#bd1f58]">
                            <Sparkles className="h-3 w-3" /> NOVO
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-base font-bold text-ink group-hover:text-lilac transition-colors line-clamp-1">
                        {list.title}
                      </h3>
                      <span className="text-[11px] text-ink-soft font-semibold">
                        {list.questionCount} questões &middot; {new Date(list.date + "T12:00:00").toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  <span
                    className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white shadow-sm transition-transform group-hover:translate-x-1"
                    style={{ color: theme?.hex || "#A370FF" }}
                  >
                    <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Material Viewer Modal */}
      <AnimatePresence>
        {selectedMaterial && (
          <MaterialViewerModal
            material={selectedMaterial}
            onClose={() => setSelectedMaterial(null)}
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
