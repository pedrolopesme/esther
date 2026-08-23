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
import SubjectCard from "./SubjectCard";
import MaterialViewerModal from "./MaterialViewerModal";
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
  const [studyOverview, setStudyOverview] = useState({
    recentSessions: [],
    completedMap: {},
    needsReview: [],
    lastSession: null,
  });
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const studentName = child?.display_name || user?.user_metadata?.display_name || "Estudante";
  const points = getPoints();

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [dbSubjects, lists, mats, overview] = await Promise.all([
        getSubjectsFromDB(false),
        getLatestExerciseLists(6),
        getMaterials({ publishedOnly: true, childId: child?.id }),
        getStudentStudyOverview(child?.id, user?.id),
      ]);

      setSubjects(dbSubjects);
      setLatestLists(lists);
      setAllMaterials(mats);
      setLatestMaterials(mats.slice(0, 6));
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
  // Counts use the full published material catalog, while the home feed only shows recent materials.
  const subjectStatsMap = {};
  for (const s of subjects) {
    const subjectMaterials = allMaterials.filter((m) => m.subject_id === s.id);
    subjectStatsMap[s.id] = {
      lists: latestLists.filter((l) => l.subject === s.id).length,
      materials: subjectMaterials.length,
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
            Continue de onde você parou, assista aos vídeos, leia as apostilas e resolva seus exercícios!
          </p>

          {/* Quick Metrics Badges */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white/90 px-3.5 py-2 text-xs font-bold text-ink shadow-sm">
              <Star className="h-4 w-4 fill-[#FFD166] text-[#FFD166]" />
              <span>{points} Estrelas</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-2xl bg-white/90 px-3.5 py-2 text-xs font-bold text-ink shadow-sm">
              <BookOpen className="h-4 w-4 text-lilac" />
              <span>{subjects.length} Matérias</span>
            </span>

            {studyOverview.lastSession && (
              <span className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-sm border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Último treino: {studyOverview.lastSession.list_title}</span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ---------- 1. ONDE VOCÊ PAROU / RECOMENDAÇÃO DE ESTUDO ---------- */}
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

      {/* ---------- 2. EXPLORAR POR MATÉRIA (CARDS COMPACTOS) ---------- */}
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

      {/* ---------- 3. MATERIAIS DE ESTUDO RECENTES (MULTIMÍDIA) ---------- */}
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
                    "clay group relative flex flex-col justify-between overflow-hidden p-4 sm:p-5 transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer",
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
                    <div className="flex items-start justify-between gap-2 mb-2.5">
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
                      <p className={cn("mt-1 text-xs line-clamp-2", isVideo || isAudio ? "text-white/65" : "text-ink-soft")}>
                        {mat.description}
                      </p>
                    )}
                  </div>


                  <div className="mt-4 flex items-center justify-between border-t border-lilac/10 pt-3 text-[11px]">
                    <span className="font-bold text-ink-soft">
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

      {/* ---------- 4. ÚLTIMAS LISTAS DE EXERCÍCIOS PUBLICADAS ---------- */}
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
    </div>
  );
}
