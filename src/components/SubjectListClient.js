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
} from "lucide-react";
import { getAvailableExerciseLists, getStudentStudyOverview } from "../utils/exerciseRepository";
import { getSubject, getSubjectsFromDB, resolveSubject } from "../utils/subjects";
import {
  getMaterials,
  getCategoryInfo,
  formatFileSize,
  detectMediaType,
} from "../utils/materialRepository";
import MaterialViewerModal from "./MaterialViewerModal";
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
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'exercises' | 'materials'
  const [exerciseLists, setExerciseLists] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [studyOverview, setStudyOverview] = useState({
    completedMap: {},
    recentSessions: [],
    needsReview: [],
  });
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Filters
  const [filterYear, setFilterYear] = useState("");
  const [filterMediaType, setFilterMediaType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [dbSubjects, lists, mats, overview] = await Promise.all([
        getSubjectsFromDB(true),
        getAvailableExerciseLists(subjectId),
        getMaterials({ subjectId, publishedOnly: true, childId: child?.id }),
        getStudentStudyOverview(child?.id, user?.id),
      ]);

      const matched = dbSubjects.find((s) => s.id === subjectId);
      if (matched) setSubject(matched);

      setExerciseLists(lists);
      setMaterials(mats);
      setStudyOverview(overview);
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

  const uniqueYears = Array.from(
    new Set([...exerciseLists.map((l) => l.ano_letivo), ...materials.map((m) => m.ano_letivo)].filter(Boolean))
  );

  // Filter lists & materials
  const filteredLists = exerciseLists.filter((l) => {
    return filterYear ? l.ano_letivo === filterYear : true;
  });

  const filteredMaterials = materials.filter((m) => {
    const matchYear = filterYear ? m.ano_letivo === filterYear : true;
    const media = m.media_type || detectMediaType(m.file_type, m.file_name);
    const matchType = filterMediaType === "all" ? true : media === filterMediaType;
    return matchYear && matchType;
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
            {subject?.tag || "Explore listas de exercícios, videoaulas, áudios e apostilas organizadas para você."}
          </p>

          {/* Quick Progress Metrics */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5 text-xs font-bold">
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
            Tudo ({exerciseLists.length + materials.length})
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
          {uniqueYears.length > 0 && (
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="rounded-xl border border-lilac/20 bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink outline-none"
            >
              <option value="">Todos os Anos</option>
              {uniqueYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          )}

          {activeTab !== "exercises" && (
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
          {/* ==================== 1. MATERIAIS DE APOIO ==================== */}
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

                    return (
                      <motion.div key={mat.id} variants={cardVariants}>
                        <div
                          onClick={() => setSelectedMaterial(mat)}
                          className={cn(
                            "clay group relative flex flex-col justify-between p-4 sm:p-5 transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer h-full",
                            isViewed && "bg-emerald-50/20 ring-1 ring-emerald-400/40"
                          )}
                        >
                          <div>
                            {/* Top Badges */}
                            <div className="flex items-start justify-between gap-2 mb-2.5">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-ink shadow-sm">
                                {getMediaIcon(mediaType)}
                                <span>{catInfo.label}</span>
                              </span>

                              {isViewed ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  {mat.accessStatus?.downloaded ? "Baixado" : "Visto"}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-lilac/15 px-2 py-0.5 text-[10px] font-bold text-lilac">
                                  <Sparkles className="h-3 w-3" />
                                  Novo
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

          {/* ==================== 2. LISTAS DE EXERCÍCIOS ==================== */}
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
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              {sessionInfo ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                  Melhor nota: {sessionInfo.bestScore}%
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-lilac/15 px-2.5 py-0.5 text-xs font-bold text-lilac">
                                  <Sparkles className="h-3 w-3" />
                                  Pendente
                                </span>
                              )}

                              {list.ano_letivo && (
                                <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-bold text-ink-soft shadow-sm">
                                  {list.ano_letivo}
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
    </div>
  );
}
