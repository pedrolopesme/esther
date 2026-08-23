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

  // Count exercises & materials per subject
  const subjectStatsMap = {};
  for (const s of subjects) {
    subjectStatsMap[s.id] = {
      lists: latestLists.filter((l) => l.subject === s.id).length,
      materials: latestMaterials.filter((m) => m.subject_id === s.id).length,
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

              return (
                <div
                  key={mat.id}
                  onClick={() => setSelectedMaterial(mat)}
                  className={cn(
                    "clay group relative flex flex-col justify-between p-4 sm:p-5 transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer",
                    isViewed && "bg-emerald-50/20 ring-1 ring-emerald-400/40"
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-ink shadow-sm">
                        {getMediaIcon(mediaType)}
                        <span>{catInfo.label}</span>
                      </span>

                      {isViewed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          Visto
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-lilac/15 px-2 py-0.5 text-[10px] font-bold text-lilac">
                          <Sparkles className="h-3 w-3" />
                          Novo
                        </span>
                      )}
                    </div>

                    <h3 className="font-display text-base font-bold text-ink group-hover:text-lilac transition-colors line-clamp-2">
                      {mat.title}
                    </h3>
                    {mat.description && (
                      <p className="mt-1 text-xs text-ink-soft line-clamp-2">
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
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-ink-soft">
                          {theme?.name || list.subject}
                        </span>
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            {isCompleted.bestScore}%
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
