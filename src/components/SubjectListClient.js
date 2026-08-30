"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Filter,
  X,
  CalendarDays,
  GraduationCap,
  ChevronRight,
  ListChecks,
  FolderDown,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Download,
  Eye,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Play,
  Award,
  Target,
  Flame,
  Star,
  BookOpen,
  LayoutGrid,
  Gamepad2,
  Trophy,
} from "lucide-react";
import { getAvailableExerciseLists, getStudentStudyOverview } from "../utils/exerciseRepository";
import { getSubject, getSubjectsFromDB, resolveSubject } from "../utils/subjects";
import {
  getMaterials,
  getCategoryInfo,
  formatFileSize,
  detectMediaType,
} from "../utils/materialRepository";
import { getGames } from "../utils/gameRepository";
import { getSupabaseBrowserClient } from "../utils/supabase";
import MaterialViewerModal from "./MaterialViewerModal";
import { GameViewerModal } from "./GameComponents";
import { useAuth } from "../hooks/useAuth";
import { cn } from "../utils/cn";
import Badge from "./ui/Badge";
import Sticker from "./ui/Sticker";
import Button from "./ui/Button";

const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 20 } },
};

export default function SubjectListClient({ subjectId }) {
  const { child, user } = useAuth();
  const [subject, setSubject] = useState(
    getSubject(subjectId) || resolveSubject({ id: subjectId, name: subjectId })
  );
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'games' | 'materials' | 'exercises'
  const [exerciseLists, setExerciseLists] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [games, setGames] = useState([]);
  const [studyOverview, setStudyOverview] = useState({
    completedMap: {},
    recentSessions: [],
    needsReview: [],
  });
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);

  // Filters
const [filterYear, setFilterYear] = useState("");
  const [filterMediaType, setFilterMediaType] = useState("all");
  const [gradeLevels, setGradeLevels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
const supabase = getSupabaseBrowserClient();
      const [dbSubjects, lists, mats, gamesData, overview, gradeLevelsRes] = await Promise.all([
        getSubjectsFromDB(true),
        getAvailableExerciseLists(subjectId),
        getMaterials({ subjectId, publishedOnly: true, childId: child?.id }),
        getGames({ subjectId, publishedOnly: true, childId: child?.id }),
        getStudentStudyOverview(child?.id, user?.id),
        supabase.from("grade_levels").select("id, name, stage, sort_order").order("sort_order"),
      ]);

      const matched = dbSubjects.find((s) => s.id === subjectId);
      if (matched) setSubject(matched);

      setExerciseLists(lists);
      setMaterials(mats);
setGames(gamesData);
      setStudyOverview(overview);
      setGradeLevels(gradeLevelsRes.data || []);
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar dashboard da matéria:", err);
      setError("Não foi possível carregar os dados. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [subjectId, child?.id, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const Icon = subject?.icon ?? BookOpen;

  // Compute stats for this subject
  const completedCount = useMemo(() => {
    return exerciseLists.filter((l) => studyOverview.completedMap[`${subjectId}/${l.slug}`]).length;
  }, [exerciseLists, studyOverview.completedMap, subjectId]);

  const materialsViewedCount = useMemo(() => {
    return materials.filter((m) => m.accessStatus?.viewed || m.accessStatus?.downloaded).length;
  }, [materials]);

  const gamesPlayedCount = useMemo(() => {
    return games.filter((g) => g.playStatus?.played).length;
  }, [games]);

const uniqueGradeIds = Array.from(
    new Set([
      ...exerciseLists.map((l) => l.grade_level_id),
      ...materials.map((m) => m.grade_level_id),
      ...games.map((g) => g.grade_level_id),
    ].filter(Boolean))
  );

  // Filter lists, materials & games
  const filteredLists = exerciseLists.filter((l) => {
    return filterYear ? l.grade_level_id === filterYear : true;
  });

  const filteredMaterials = materials.filter((m) => {
    const matchYear = filterYear ? m.grade_level_id === filterYear : true;
    const media = m.media_type || detectMediaType(m.file_type, m.file_name);
    const matchType = filterMediaType === "all" ? true : media === filterMediaType;
    return matchYear && matchType;
  });

  const filteredGames = games.filter((g) => {
    return filterYear ? g.grade_level_id === filterYear : true;
  });

  function handleAccessLogged(materialId, action) {
    setMaterials((prev) =>
      prev.map((m) => {
        if (m.id === materialId) {
          const status = m.accessStatus || { viewed: false, downloaded: false };
          return {
            ...m,
            accessStatus: {
              ...status,
              viewed: action === "view" ? true : status.viewed,
              downloaded: action === "download" ? true : status.downloaded,
            },
          };
        }
        return m;
      })
    );
  }

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

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-6 space-y-8">
      {/* Back Link */}
      <Link
        href="/"
        className="press inline-flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-2 text-xs font-bold text-ink shadow-sm backdrop-blur hover:-translate-x-0.5 hover:text-lilac"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Início
      </Link>

      {/* Hero Header as Interactive Subject Banner */}
      <motion.header
        className={cn(
          "clay relative overflow-hidden bg-gradient-to-br p-6 text-white sm:p-8 shadow-xl",
          subject?.gradient
        )}
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
      >
        <div className="bg-dots absolute inset-0 opacity-30 pointer-events-none" />
        <Sticker className="right-4 top-4 text-5xl sm:text-6xl" anim="float">
          {subject?.emoji}
        </Sticker>

        <div className="relative max-w-2xl">
          <div className="flex items-center gap-3.5 mb-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-3xl border-4 border-white/80 bg-white/95 shadow-lg">
              <Icon className="h-7 w-7" strokeWidth={2.3} style={{ color: subject?.hex }} />
            </span>
            <div>
              <span className="rounded-full bg-white/25 px-3 py-0.5 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                Matéria Escolar
              </span>
              <h1 className="font-display text-3xl font-bold drop-shadow-sm sm:text-4xl">
                {subject?.name}
              </h1>
            </div>
          </div>

          <p className="text-white/90 text-sm sm:text-base font-medium">
            {subject?.tag || "Explore minijogos educativos, listas de exercícios e materiais de apoio organizados para você."}
          </p>

          {/* Quick Progress Metrics */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5 text-xs font-bold">
            <span className="rounded-2xl bg-white/95 px-3.5 py-1.5 text-ink shadow-sm flex items-center gap-1.5">
              <Gamepad2 className="h-4 w-4 text-indigo-600" />
              <span>{gamesPlayedCount} de {games.length} jogos jogados</span>
            </span>

            <span className="rounded-2xl bg-white/95 px-3.5 py-1.5 text-ink shadow-sm flex items-center gap-1.5">
              <ListChecks className="h-4 w-4 text-lilac" />
              <span>{completedCount} de {exerciseLists.length} listas concluídas</span>
            </span>

            <span className="rounded-2xl bg-white/95 px-3.5 py-1.5 text-ink shadow-sm flex items-center gap-1.5">
              <FolderDown className="h-4 w-4 text-sky" />
              <span>{materialsViewedCount} de {materials.length} materiais vistos</span>
            </span>
          </div>
        </div>
      </motion.header>

      {/* Nav Tabs & Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-lilac/15 pb-4">
        {/* View Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "press cursor-pointer flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs sm:text-sm font-bold transition",
              activeTab === "all"
                ? "bg-lilac text-white shadow-md"
                : "bg-white/80 text-ink hover:bg-white"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            Tudo ({games.length + exerciseLists.length + materials.length})
          </button>
          <button
            onClick={() => setActiveTab("games")}
            className={cn(
              "press cursor-pointer flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs sm:text-sm font-bold transition",
              activeTab === "games"
                ? "bg-lilac text-white shadow-md"
                : "bg-white/80 text-ink hover:bg-white"
            )}
          >
            <Gamepad2 className="h-4 w-4 text-candy" />
            Minijogos ({games.length})
          </button>
          <button
            onClick={() => setActiveTab("materials")}
            className={cn(
              "press cursor-pointer flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs sm:text-sm font-bold transition",
              activeTab === "materials"
                ? "bg-lilac text-white shadow-md"
                : "bg-white/80 text-ink hover:bg-white"
            )}
          >
            <FolderDown className="h-4 w-4" />
            Materiais ({materials.length})
          </button>
          <button
            onClick={() => setActiveTab("exercises")}
            className={cn(
              "press cursor-pointer flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs sm:text-sm font-bold transition",
              activeTab === "exercises"
                ? "bg-lilac text-white shadow-md"
                : "bg-white/80 text-ink hover:bg-white"
            )}
          >
            <ListChecks className="h-4 w-4" />
            Exercícios ({exerciseLists.length})
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
{uniqueGradeIds.length > 0 && (
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="rounded-xl border border-lilac/20 bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink outline-none"
            >
              <option value="">Todas as Séries</option>
              {uniqueGradeIds.map((gid) => {
                const gl = gradeLevels.find((l) => l.id === gid);
                return (
                  <option key={gid} value={gid}>
                    {gl?.name || gid}
</option>
                  );
                })}
              </select>
          )}

          {activeTab === "materials" && (
            <select
              value={filterMediaType}
              onChange={(e) => setFilterMediaType(e.target.value)}
              className="rounded-xl border border-lilac/20 bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink outline-none"
            >
              <option value="all">Todas as Mídias</option>
              <option value="video">🎬 Vídeos</option>
              <option value="audio">🎧 Áudios</option>
              <option value="image">🖼️ Imagens</option>
              <option value="document">📄 Documentos / PDFs</option>
            </select>
          )}

          {(filterYear || filterMediaType !== "all") && (
            <button
              onClick={() => {
                setFilterYear("");
                setFilterMediaType("all");
              }}
              className="press rounded-xl bg-candy-soft px-3 py-1.5 text-xs font-bold text-[#b03b6e]"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="clay flex min-h-60 items-center justify-center p-8 text-center text-ink-soft">
          <span className="animate-pulse">Carregando conteúdo da matéria...</span>
        </div>
      ) : error ? (
        <div className="clay bg-candy-soft p-6 text-center text-sm font-semibold text-[#a62f5f]">
          {error}
        </div>
      ) : (
        <div className="space-y-10">
          {/* ==================== 1. MINIJOGOS EDUCATIVOS ==================== */}
          {(activeTab === "all" || activeTab === "games") && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-500/15 text-indigo-600">
                    <Gamepad2 className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-bold text-ink">
                      Minijogos de {subject?.name} ({filteredGames.length})
                    </h2>
                    <p className="text-xs text-ink-soft">
                      Jogos interativos estilo Steam/arcade para fixar o aprendizado
                    </p>
                  </div>
                </div>
              </div>

              {filteredGames.length === 0 ? (
                <div className="clay p-8 text-center text-ink-soft text-xs">
                  Nenhum minijogo encontrado para esta matéria com os filtros atuais.
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                  variants={listVariants}
                  initial="hidden"
                  animate="show"
                >
                  {filteredGames.map((g) => {
                    const played = g.playStatus?.played;

                    return (
                      <motion.div key={g.id} variants={cardVariants}>
                        <div
                          onClick={() => setSelectedGame(g)}
                          className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-b from-[#1e1b4b] to-[#0f172a] p-0 text-white shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl cursor-pointer border border-indigo-900/50 h-full"
                        >
                          {/* Banner / Cover */}
                          <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                            {g.cover_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={g.cover_url}
                                alt={g.title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 text-4xl">
                                🎮
                              </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b4b] via-transparent to-black/30" />

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

                            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-black/30 backdrop-blur-[2px]">
                              <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-tr from-[#ffe381] to-[#ffb45f] text-slate-950 shadow-2xl transition-transform group-hover:scale-110">
                                <Play className="ml-0.5 h-6 w-6 fill-current" />
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="font-display text-base font-bold text-white group-hover:text-[#ffe381] transition-colors line-clamp-1">
                                {g.title}
                              </h3>
                              <p className="mt-1 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                                {g.description || "Divirta-se e aprenda com este minijogo!"}
                              </p>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-indigo-900/60 pt-3 text-xs">
                              <span className="text-[#ffd166] font-bold text-[11px]">
                                Até {g.max_score || 100} pts
                              </span>

                              <span className="press inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1 text-xs font-bold text-white shadow-md transition">
                                <Play className="h-3 w-3 fill-current" /> Jogar
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </section>
          )}

          {/* ==================== 2. MATERIAIS DE APOIO ==================== */}
          {(activeTab === "all" || activeTab === "materials") && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky/15 text-sky">
                    <FolderDown className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-bold text-ink">
                      Materiais de Apoio & Multimídia ({filteredMaterials.length})
                    </h2>
                    <p className="text-xs text-ink-soft">
                      Vídeos, podcasts, resumos e PDFs para estudar o conteúdo
                    </p>
                  </div>
                </div>
              </div>

              {filteredMaterials.length === 0 ? (
                <div className="clay p-8 text-center text-ink-soft text-xs">
                  Nenhum material de apoio encontrado para esta matéria com os filtros atuais.
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
                  variants={listVariants}
                  initial="hidden"
                  animate="show"
                >
                  {filteredMaterials.map((mat) => {
                    const catInfo = getCategoryInfo(mat.category);
                    const mediaType =
                      mat.media_type || detectMediaType(mat.file_type, mat.file_name);
                    const isViewed = mat.accessStatus?.viewed || mat.accessStatus?.downloaded;
                    const isVideo = mediaType === "video";
                    const isAudio = mediaType === "audio";

                    return (
                      <motion.div key={mat.id} variants={cardVariants}>
                        <div
                          onClick={() => setSelectedMaterial(mat)}
                          className={cn(
                            "clay group relative flex flex-col justify-between p-4 sm:p-5 transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer h-full",
                            isViewed && "bg-emerald-50/20 ring-1 ring-emerald-400/40"
                          )}
                        >
                          {isVideo && (
                            <div className="relative -mx-4 -mt-4 mb-4 h-24 overflow-hidden rounded-t-[1.8rem] bg-gradient-to-br from-[#312e81] via-[#7c3aed] to-[#db2777] sm:-mx-5 sm:-mt-5">
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.35),transparent_35%),linear-gradient(135deg,transparent_45%,rgba(0,0,0,.25))]" />
                              <span className="absolute inset-0 grid place-items-center">
                                <span className="grid h-11 w-11 place-items-center rounded-full bg-white/95 text-[#7c3aed] shadow-xl transition-transform group-hover:scale-110">
                                  <Play className="ml-0.5 h-5 w-5 fill-current" />
                                </span>
                              </span>
                              <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white">
                                VÍDEO
                              </span>
                            </div>
                          )}

                          {isAudio && (
                            <div className="relative -mx-4 -mt-4 mb-4 flex h-24 items-center gap-3 overflow-hidden rounded-t-[1.8rem] bg-gradient-to-r from-[#24133f] via-[#4c1d95] to-[#0f766e] px-4 sm:-mx-5 sm:-mt-5 sm:px-5">
                              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#2dd4bf] text-2xl shadow-lg ring-1 ring-white/30">
                                🎧
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[10px] font-extrabold tracking-wider text-white/75">
                                  PODCAST DE ESTUDO
                                </p>
                                <div className="mt-2 flex h-4 items-center gap-0.5 opacity-90">
                                  {[3, 8, 14, 7, 18, 10, 5, 13, 8, 16, 6, 11].map((height, index) => (
                                    <span
                                      key={index}
                                      className="w-1 rounded-full bg-white/80"
                                      style={{ height: `${height}px` }}
                                    />
                                  ))}
                                </div>
                              </div>
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-[#4c1d95] shadow-lg transition-transform group-hover:scale-110">
                                <Play className="h-3.5 w-3.5 fill-current" />
                              </span>
                            </div>
                          )}

                          <div>
                            {/* Top Badges */}
                            <div className="flex items-start justify-between gap-2 mb-2.5">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-ink shadow-sm">
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

                            {/* Title & Description */}
                            <h3 className="font-display text-base font-bold text-ink group-hover:text-lilac transition-colors line-clamp-2">
                              {mat.title}
                            </h3>

                            {mat.description && (
                              <p className="mt-1 text-xs text-ink-soft line-clamp-2">
                                {mat.description}
                              </p>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="mt-4 flex items-center justify-between border-t border-lilac/10 pt-3 text-[11px] font-semibold text-ink-soft">
                            <span>{formatFileSize(mat.file_size)}</span>
                            <span
                              className="rounded-xl px-2.5 py-1 font-bold text-white shadow-sm transition"
                              style={{ backgroundColor: subject?.hex || "#A370FF" }}
                            >
                              Visualizar
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </section>
          )}

          {/* ==================== 3. LISTAS DE EXERCÍCIOS ==================== */}
          {(activeTab === "all" || activeTab === "exercises") && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-candy/15 text-candy">
                    <ListChecks className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-bold text-ink">
                      Listas de Exercícios ({filteredLists.length})
                    </h2>
                    <p className="text-xs text-ink-soft">
                      Desafios interativos para treinar, ganhar estrelas e testar seu conhecimento
                    </p>
                  </div>
                </div>
              </div>

              {filteredLists.length === 0 ? (
                <div className="clay p-8 text-center text-ink-soft text-xs">
                  Nenhuma lista de exercícios encontrada para esta matéria com os filtros atuais.
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                  variants={listVariants}
                  initial="hidden"
                  animate="show"
                >
                  {filteredLists.map((list) => {
                    const sessionInfo = studyOverview.completedMap[`${subjectId}/${list.slug}`];
                    const dateStr = list.date
                      ? new Date(list.date + "T12:00:00").toLocaleDateString("pt-BR")
                      : "";

                    return (
                      <motion.div key={list.id} variants={cardVariants}>
                        <Link
                          href={`/materias/${subjectId}/lista?listId=${list.id}`}
                          className="clay group flex items-start justify-between gap-3.5 p-5 transition-all hover:-translate-y-1 hover:shadow-xl h-full"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              {sessionInfo ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                  Melhor nota: {sessionInfo.bestScore}%
                                </span>
                              ) : (
                                <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-[#ffb3ca] bg-[#ff477e] px-2.5 py-1 text-[10px] font-extrabold text-white shadow-[0_3px_0_#bd1f58]">
                                  <Sparkles className="h-3 w-3" /> NOVO
                                </span>
                              )}

{list.grade_level_id && (
                                <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-bold text-ink-soft shadow-sm">
                                  {gradeLevels.find((g) => g.id === list.grade_level_id)?.name || "—"}
                                </span>
                              )}
                            </div>

                            <h3 className="font-display text-lg font-bold text-ink group-hover:text-lilac transition-colors line-clamp-1">
                              {list.title}
                            </h3>

                            {list.description && (
                              <p className="mt-1 text-xs text-ink-soft line-clamp-2">
                                {list.description}
                              </p>
                            )}

                            <div className="mt-4 flex items-center gap-3 text-[11px] text-ink-soft font-semibold">
                              <span>{list.questionCount} questões</span>
                              {dateStr && (
                                <>
                                  <span>&middot;</span>
                                  <span>{dateStr}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <span
                            className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white shadow-sm transition-transform group-hover:translate-x-1"
                            style={{ color: subject?.hex || "#A370FF" }}
                          >
                            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                          </span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Material Viewer Modal */}
      <AnimatePresence>
        {selectedMaterial && (
          <MaterialViewerModal
            material={selectedMaterial}
            onClose={() => setSelectedMaterial(null)}
            onAccessLogged={handleAccessLogged}
          />
        )}
      </AnimatePresence>

      {/* Game Viewer Modal */}
      <AnimatePresence>
        {selectedGame && (
          <GameViewerModal
            game={selectedGame}
            onClose={() => setSelectedGame(null)}
            onGameCompleted={() => loadData()}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
