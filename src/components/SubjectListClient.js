"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
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
} from "lucide-react";
import { getAvailableExerciseLists } from "../utils/exerciseLoader";
import { getSubject, getSubjectsFromDB, resolveSubject } from "../utils/subjects";
import {
  getMaterials,
  getCategoryInfo,
  formatFileSize,
  detectMediaType,
} from "../utils/materialRepository";
import MaterialViewerModal from "./MaterialViewerModal";
import { cn } from "../utils/cn";
import Badge from "./ui/Badge";
import Sticker from "./ui/Sticker";

const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden: { y: 22, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 240, damping: 20 } },
};

export default function SubjectListClient({ subjectId }) {
  const [subject, setSubject] = useState(
    getSubject(subjectId) || resolveSubject({ id: subjectId, name: subjectId })
  );
  const [activeTab, setActiveTab] = useState("exercises"); // 'exercises' | 'materials'
  const [exerciseLists, setExerciseLists] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  // Filters
  const [filterYear, setFilterYear] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterMaterialCategory, setFilterMaterialCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [dbSubjects, lists, mats] = await Promise.all([
        getSubjectsFromDB(true),
        getAvailableExerciseLists(subjectId),
        getMaterials({ subjectId, publishedOnly: true }),
      ]);

      const matched = dbSubjects.find((s) => s.id === subjectId);
      if (matched) setSubject(matched);

      setExerciseLists(lists);
      setMaterials(mats);
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar dados da matéria:", err);
      setError("Não foi possível carregar os dados. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const Icon = subject?.icon ?? ListChecks;

  // Filter exercises
  const uniqueYears = Array.from(new Set(exerciseLists.map((l) => l.ano_letivo).filter(Boolean)));
  const filteredLists = exerciseLists.filter((l) => {
    const matchesYear = filterYear ? l.ano_letivo === filterYear : true;
    const listDate = l.date ? new Date(l.date).toISOString().slice(0, 10) : "";
    const matchesFrom = filterDateFrom ? listDate >= filterDateFrom : true;
    const matchesTo = filterDateTo ? listDate <= filterDateTo : true;
    return matchesYear && matchesFrom && matchesTo;
  });

  // Filter materials
  const filteredMaterials = materials.filter((m) => {
    const matchesCategory = filterMaterialCategory ? m.category === filterMaterialCategory : true;
    const matchesYear = filterYear ? m.ano_letivo === filterYear : true;
    return matchesCategory && matchesYear;
  });

  const hasFilters =
    activeTab === "exercises"
      ? filterYear || filterDateFrom || filterDateTo
      : filterYear || filterMaterialCategory;

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
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-6">
      {/* Back */}
      <Link
        href="/"
        className="press mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-ink shadow-sm backdrop-blur hover:-translate-x-0.5 hover:text-lilac"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Voltar
      </Link>

      {/* Subject hero */}
      <motion.header
        className={cn(
          "clay relative mb-8 overflow-hidden bg-gradient-to-br p-6 text-white sm:p-8",
          subject?.gradient
        )}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
      >
        <div className="bg-dots absolute inset-0 opacity-30" />
        <Sticker className="right-4 top-3 text-5xl" anim="float">
          {subject?.emoji}
        </Sticker>
        <div className="relative flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl border-4 border-white/80 bg-white/95 shadow-lg">
            <Icon className="h-8 w-8" strokeWidth={2.3} style={{ color: subject?.hex }} />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold drop-shadow-sm sm:text-4xl">
              {subject?.name}
            </h1>
            <p className="text-white/90">{subject?.tag}</p>
          </div>
        </div>
      </motion.header>

      {/* Section Tabs: Exercícios vs Materiais de Apoio */}
      <div className="mb-6 flex gap-2 border-b border-lilac/15 pb-4">
        <button
          onClick={() => setActiveTab("exercises")}
          className={cn(
            "press cursor-pointer flex items-center gap-2 rounded-2xl px-5 py-3 font-display text-sm font-bold transition",
            activeTab === "exercises"
              ? "bg-lilac text-white shadow-md"
              : "bg-white/75 text-ink hover:bg-white"
          )}
        >
          <ListChecks className="h-4 w-4" />
          Exercícios ({exerciseLists.length})
        </button>
        <button
          onClick={() => setActiveTab("materials")}
          className={cn(
            "press cursor-pointer flex items-center gap-2 rounded-2xl px-5 py-3 font-display text-sm font-bold transition",
            activeTab === "materials"
              ? "bg-lilac text-white shadow-md"
              : "bg-white/75 text-ink hover:bg-white"
          )}
        >
          <FolderDown className="h-4 w-4" />
          Materiais de Estudo ({materials.length})
        </button>
      </div>

      {/* Filters */}
      <motion.div
        className="clay-sm mb-6 bg-white/85 p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold text-ink">
            <Filter className="h-4 w-4 text-lilac" />
            <span>Filtrar {activeTab === "exercises" ? "exercícios" : "materiais"}</span>
          </div>
          {hasFilters && (
            <button
              onClick={() => {
                setFilterYear("");
                setFilterDateFrom("");
                setFilterDateTo("");
                setFilterMaterialCategory("");
              }}
              className="press inline-flex items-center gap-1 rounded-full bg-candy-soft px-3 py-2 text-sm font-bold text-[#b03b6e] hover:-translate-y-0.5"
            >
              <X className="h-3.5 w-3.5" /> Limpar filtros
            </button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Year */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-soft">Ano letivo</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full rounded-xl border border-lilac/20 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-lilac"
            >
              <option value="">Todos os anos</option>
              {uniqueYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {activeTab === "exercises" ? (
            <>
              {/* Date from */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-soft">Data inicial</label>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-full rounded-xl border border-lilac/20 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-lilac"
                />
              </div>

              {/* Date to */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink-soft">Data final</label>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-full rounded-xl border border-lilac/20 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-lilac"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-soft">Tipo de Material</label>
              <select
                value={filterMaterialCategory}
                onChange={(e) => setFilterMaterialCategory(e.target.value)}
                className="w-full rounded-xl border border-lilac/20 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-lilac"
              >
                <option value="">Todos os tipos</option>
                <option value="video">🎬 Vídeos</option>
                <option value="audio">🎧 Áudios / Podcasts</option>
                <option value="imagem">🖼️ Imagens / Infográficos</option>
                <option value="apostila">📖 Apostilas</option>
                <option value="resumo">📝 Resumos</option>
                <option value="livro">📚 Livros</option>
                <option value="exercicios">📋 Exercícios PDF</option>
                <option value="prova">🎯 Simulados / Provas</option>
              </select>
            </div>
          )}
        </div>
      </motion.div>

      {/* Content Rendering */}
      {isLoading ? (
        <div className="clay flex min-h-60 items-center justify-center p-8 text-center text-ink-soft">
          <span className="animate-pulse">Carregando conteúdo...</span>
        </div>
      ) : error ? (
        <div className="clay bg-candy-soft p-6 text-center text-sm font-semibold text-[#a62f5f]">
          {error}
        </div>
      ) : activeTab === "exercises" ? (
        /* ==================== TAB 1: EXERCISES ==================== */
        filteredLists.length === 0 ? (
          <div className="clay p-10 text-center">
            <div className="mb-2 text-4xl">🔍</div>
            <p className="font-display text-lg font-bold text-ink">Nenhuma lista encontrada</p>
            <p className="mt-1 text-sm text-ink-soft">
              {hasFilters
                ? "Tente ajustar os filtros de ano ou data acima."
                : "Ainda não há exercícios publicados para esta matéria."}
            </p>
          </div>
        ) : (
          <motion.div
            className="space-y-4"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            {filteredLists.map((list) => {
              const dateStr = list.date
                ? new Date(list.date + "T12:00:00").toLocaleDateString("pt-BR")
                : "";
              return (
                <motion.div key={list.id} variants={cardVariants}>
                  <Link
                    href={`/materias/${subjectId}/lista?listId=${list.id}`}
                    className="clay group relative block p-6 transition-all hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {list.ano_letivo && (
                            <Badge variant="soft" color={subject?.hex}>
                              <GraduationCap className="mr-1 inline h-3.5 w-3.5" />
                              {list.ano_letivo}
                            </Badge>
                          )}
                          {dateStr && (
                            <Badge variant="subtle">
                              <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
                              {dateStr}
                            </Badge>
                          )}
                          {typeof list.questionCount === "number" && (
                            <Badge color={subject?.hex}>
                              <ListChecks className="mr-1 inline h-3.5 w-3.5" />
                              {list.questionCount} {list.questionCount === 1 ? "questão" : "questões"}
                            </Badge>
                          )}
                        </div>

                        <h2 className="font-display text-xl font-bold text-ink group-hover:text-lilac transition-colors">
                          {list.title}
                        </h2>

                        {list.description && (
                          <p className="mt-2 text-sm text-ink-soft line-clamp-2">
                            {list.description}
                          </p>
                        )}
                      </div>

                      <span
                        className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white shadow-md transition-transform duration-200 group-hover:translate-x-1"
                        style={{ color: subject?.hex }}
                      >
                        <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )
      ) : (
        /* ==================== TAB 2: STUDY MATERIALS ==================== */
        filteredMaterials.length === 0 ? (
          <div className="clay p-10 text-center">
            <div className="mb-2 text-4xl">📂</div>
            <p className="font-display text-lg font-bold text-ink">Nenhum material encontrado</p>
            <p className="mt-1 text-sm text-ink-soft">
              {hasFilters
                ? "Tente ajustar os filtros de categoria ou ano letivo."
                : "Ainda não há materiais de estudo publicados para esta matéria."}
            </p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
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
                      "clay group relative flex flex-col justify-between p-5 transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer",
                      isViewed && "ring-2 ring-emerald-400/60 bg-emerald-50/20"
                    )}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-ink shadow-sm">
                          {getMediaIcon(mediaType)}
                          <span>{catInfo.label}</span>
                        </span>

                        {isViewed ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 shadow-sm">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            {mat.accessStatus?.downloaded ? "Baixado" : "Visualizado"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-lilac/15 px-2.5 py-0.5 text-[11px] font-bold text-lilac">
                            <Sparkles className="h-3 w-3" />
                            Novo
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-display text-lg font-bold text-ink group-hover:text-lilac transition-colors line-clamp-2">
                        {mat.title}
                      </h3>

                      {mat.description && (
                        <p className="mt-1.5 text-xs text-ink-soft line-clamp-2">
                          {mat.description}
                        </p>
                      )}
                    </div>

                    {/* Footer Info & Action */}
                    <div className="mt-4 flex items-center justify-between border-t border-lilac/10 pt-3">
                      <div className="text-[11px] font-semibold text-ink-soft">
                        <span>{formatFileSize(mat.file_size)}</span>
                        {mat.ano_letivo && (
                          <>
                            <span className="mx-1">&middot;</span>
                            <span>{mat.ano_letivo}</span>
                          </>
                        )}
                      </div>

                      <span
                        className="press inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-white shadow-sm transition"
                        style={{ backgroundColor: subject?.hex || "#A370FF" }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Abrir
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )
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
