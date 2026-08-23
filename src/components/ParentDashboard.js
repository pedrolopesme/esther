"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Clock,
  CalendarDays,
  Baby,
  Activity,
  CheckCircle2,
  XCircle,
  PlayCircle,
  LogIn,
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  TrendingUp,
  Settings,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Filter,
  UserCheck,
  UserX,
  Target,
  Flame,
  FolderDown,
  Eye,
  Download,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getSupabaseBrowserClient } from "../utils/supabase";
import { getSubject } from "../utils/subjects";
import { formatFileSize, getCategoryInfo } from "../utils/materialRepository";
import { cn } from "../utils/cn";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Card from "./ui/Card";

const inputClass =
  "w-full rounded-2xl border-2 border-candy/15 bg-white/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-candy focus:ring-4 focus:ring-candy/10";

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " às " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

function formatDay(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function groupByDay(events) {
  const groups = {};
  for (const ev of events) {
    const dayKey = new Date(ev.created_at).toISOString().slice(0, 10);
    if (!groups[dayKey]) groups[dayKey] = [];
    groups[dayKey].push(ev);
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

export default function ParentDashboard() {
  const router = useRouter();
  const { isParent, isLoading: authLoading, user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  // Data states
  const [children, setChildren] = useState([]);
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [materialAccesses, setMaterialAccesses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Selected child filter ("all" for consolidated view)
  const [selectedChildId, setSelectedChildId] = useState("all");

  // Top navigation view mode: "dashboard" | "children"
  const [currentView, setCurrentView] = useState("dashboard");

  // Dashboard inner tabs: "performance" | "materials" | "errors" | "timeline"
  const [activeTab, setActiveTab] = useState("performance");

  // Form states for registering children
  const [childName, setChildName] = useState("");
  const [childUsername, setChildUsername] = useState("");
  const [childPassword, setChildPassword] = useState("");
  const [registerError, setRegisterError] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Redirect non-parents
  useEffect(() => {
    if (!authLoading && !isParent) router.push("/");
  }, [authLoading, isParent, router]);

  // Load children (active and inactive)
  const loadChildren = useCallback(async () => {
    if (!supabase || !user) return;
    setIsLoadingChildren(true);
    const { data, error } = await supabase
      .from("children")
      .select("id, display_name, username, active, created_at")
      .eq("parent_id", user.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setChildren(
        data.map((row) => ({
          id: row.id,
          name: row.display_name,
          username: row.username,
          active: row.active ?? true,
          createdAt: row.created_at,
        }))
      );
    }
    setIsLoadingChildren(false);
  }, [supabase, user]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  // Load all events, sessions, material accesses and materials for this parent's children
  const loadParentData = useCallback(async () => {
    if (!supabase || !user) return;
    setIsLoadingData(true);

    const [eventsRes, sessionsRes, accessesRes, materialsRes] = await Promise.all([
      supabase
        .from("child_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("exercise_sessions")
        .select("*")
        .order("completed_at", { ascending: false })
        .limit(200),
      supabase
        .from("material_accesses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("materials")
        .select("id, title, description, subject_id, ano_letivo, file_url, file_name, file_size, file_type, media_type, category"),
    ]);

    if (!eventsRes.error && eventsRes.data) {
      setEvents(eventsRes.data);
    }
    if (!sessionsRes.error && sessionsRes.data) {
      setSessions(sessionsRes.data);
    }
    if (!accessesRes.error && accessesRes.data) {
      setMaterialAccesses(accessesRes.data);
    }
    if (!materialsRes.error && materialsRes.data) {
      setMaterials(materialsRes.data);
    }

    setIsLoadingData(false);
  }, [supabase, user]);

  useEffect(() => {
    loadParentData();
  }, [loadParentData]);

  // Toggle child active/disabled status
  async function handleToggleChildActive(child) {
    if (!supabase || !user) return;
    const newStatus = !child.active;
    const { error } = await supabase
      .from("children")
      .update({ active: newStatus })
      .eq("id", child.id)
      .eq("parent_id", user.id);

    if (error) {
      alert("Erro ao alterar status: " + error.message);
      return;
    }

    setChildren((prev) =>
      prev.map((c) => (c.id === child.id ? { ...c, active: newStatus } : c))
    );
  }

  // Register new child
  async function handleRegisterChild(e) {
    e.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);
    setIsRegistering(true);

    try {
      const { data, error } = await supabase.rpc("register_child", {
        p_display_name: childName.trim(),
        p_username: childUsername.trim(),
        p_password: childPassword,
      });
      if (error) throw error;
      if (!data.ok) {
        setRegisterError(data.error);
      } else {
        setRegisterSuccess(
          `✨ ${data.display_name} cadastrado(a) com sucesso! Usuário: ${data.username}`
        );
        setChildName("");
        setChildUsername("");
        setChildPassword("");
        loadChildren();
        loadParentData();
      }
    } catch (err) {
      setRegisterError(err.message || "Erro ao cadastrar filho.");
    } finally {
      setIsRegistering(false);
    }
  }

  // Map of child_id to name for rapid lookup
  const childMap = useMemo(() => {
    const map = {};
    for (const c of children) {
      map[c.id] = c.name;
    }
    return map;
  }, [children]);

  // Map of material_id to material data
  const materialMap = useMemo(() => {
    const map = {};
    for (const m of materials) {
      map[m.id] = m;
    }
    return map;
  }, [materials]);

  // Filtered data based on selected child filter
  const filteredSessions = useMemo(() => {
    if (selectedChildId === "all") return sessions;
    return sessions.filter((s) => s.child_id === selectedChildId);
  }, [sessions, selectedChildId]);

  const filteredEvents = useMemo(() => {
    if (selectedChildId === "all") return events;
    return events.filter((e) => e.child_id === selectedChildId);
  }, [events, selectedChildId]);

  const filteredMaterialAccesses = useMemo(() => {
    if (selectedChildId === "all") return materialAccesses;
    return materialAccesses.filter((a) => a.child_id === selectedChildId);
  }, [materialAccesses, selectedChildId]);

  // Aggregated metrics
  const totalCompleted = filteredSessions.length;
  const totalCorrect = filteredSessions.reduce((acc, s) => acc + (s.correct_count || 0), 0);
  const totalWrong = filteredSessions.reduce((acc, s) => acc + (s.wrong_count || 0), 0);
  const totalQuestions = totalCorrect + totalWrong;
  const accuracyRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const totalPoints = filteredSessions.reduce((acc, s) => acc + (s.points_earned || 0), 0);
  const totalMaterialsViewed = new Set(filteredMaterialAccesses.map((a) => `${a.child_id}_${a.material_id}`)).size;

  // Group performance by subject
  const subjectStats = useMemo(() => {
    const stats = {};
    for (const s of filteredSessions) {
      const subId = s.list_subject || "outros";
      if (!stats[subId]) {
        stats[subId] = {
          subjectId: subId,
          completedCount: 0,
          correctCount: 0,
          wrongCount: 0,
        };
      }
      stats[subId].completedCount += 1;
      stats[subId].correctCount += s.correct_count || 0;
      stats[subId].wrongCount += s.wrong_count || 0;
    }

    return Object.values(stats).map((stat) => {
      const theme = getSubject(stat.subjectId);
      const subTotal = stat.correctCount + stat.wrongCount;
      const rate = subTotal > 0 ? Math.round((stat.correctCount / subTotal) * 100) : 0;
      return {
        ...stat,
        name: theme?.name || stat.subjectId,
        emoji: theme?.emoji || "📖",
        hex: theme?.hex || "#A370FF",
        rate,
        total: subTotal,
      };
    });
  }, [filteredSessions]);

  // Extract all wrong answers for analysis
  const allErrors = useMemo(() => {
    const list = [];
    for (const s of filteredSessions) {
      const theme = getSubject(s.list_subject);
      const childName = childMap[s.child_id] || "Estudante";
      if (Array.isArray(s.wrong_details)) {
        for (const err of s.wrong_details) {
          list.push({
            childName,
            subjectName: theme?.name || s.list_subject,
            subjectEmoji: theme?.emoji || "📖",
            subjectHex: theme?.hex || "#FF70A6",
            listTitle: s.list_title || s.list_slug,
            completedAt: s.completed_at,
            question: err.question || "Questão sem enunciado",
            selected: err.selected,
            correct: err.correct,
          });
        }
      }
    }
    return list;
  }, [filteredSessions, childMap]);

  // Grouped material accesses report
  const materialReport = useMemo(() => {
    const map = {};
    for (const acc of filteredMaterialAccesses) {
      const key = `${acc.child_id}_${acc.material_id}`;
      const mat = materialMap[acc.material_id];
      if (!map[key]) {
        map[key] = {
          childId: acc.child_id,
          childName: childMap[acc.child_id] || "Estudante",
          materialId: acc.material_id,
          title: mat?.title || "Material de Apoio",
          subjectId: mat?.subject_id || "geral",
          category: mat?.category || "apostila",
          mediaType: mat?.media_type || "document",
          fileSize: mat?.file_size || 0,
          viewed: false,
          downloaded: false,
          viewCount: 0,
          downloadCount: 0,
          lastAccess: acc.created_at,
        };
      }
      if (acc.action === "view") {
        map[key].viewed = true;
        map[key].viewCount += 1;
      }
      if (acc.action === "download") {
        map[key].downloaded = true;
        map[key].downloadCount += 1;
      }
      if (new Date(acc.created_at) > new Date(map[key].lastAccess)) {
        map[key].lastAccess = acc.created_at;
      }
    }
    return Object.values(map).sort(
      (a, b) => new Date(b.lastAccess) - new Date(a.lastAccess)
    );
  }, [filteredMaterialAccesses, childMap, materialMap]);

  const eventDayGroups = useMemo(() => groupByDay(filteredEvents), [filteredEvents]);

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-16 w-16 animate-spin rounded-full border-4 border-candy/25 border-t-candy" />
      </div>
    );
  }

  if (!isParent) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:pt-12">
      {/* Top Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Link
              href="/"
              className="press inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-ink shadow-sm hover:text-candy"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Início
            </Link>
            <Badge tone="candy">Área dos Pais</Badge>
          </div>
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            Painel do Responsável 👨‍👩‍👧
          </h1>
          <p className="mt-1 text-xs text-ink-soft sm:text-sm">
            Acompanhe a evolução, resoluções, acertos e materiais consumidos pelos seus filhos.
          </p>
        </div>

        {/* View Switcher Top Button */}
        <div className="flex gap-2">
          <Button
            variant={currentView === "dashboard" ? "candy" : "ghost"}
            size="md"
            onClick={() => setCurrentView("dashboard")}
          >
            <span className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />
              Desempenho
            </span>
          </Button>
          <Button
            variant={currentView === "children" ? "lilac" : "ghost"}
            size="md"
            onClick={() => setCurrentView("children")}
          >
            <span className="flex items-center gap-1.5">
              <Baby className="h-4 w-4" />
              Gerenciar Filhos ({children.length})
            </span>
          </Button>
        </div>
      </div>

      {/* VIEW 1: DASHBOARD DE DESEMPENHO */}
      {currentView === "dashboard" && (
        <div className="space-y-8">
          {/* Child Selector Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-ink-soft">Filtrar por estudante:</span>
            <button
              onClick={() => setSelectedChildId("all")}
              className={cn(
                "press rounded-full px-3.5 py-1.5 text-xs font-bold transition",
                selectedChildId === "all"
                  ? "bg-candy text-white shadow-md"
                  : "bg-white/80 text-ink hover:bg-white"
              )}
            >
              Todos os Filhos ({children.length})
            </button>
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={cn(
                  "press flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition",
                  selectedChildId === child.id
                    ? "bg-candy text-white shadow-md"
                    : "bg-white/80 text-ink hover:bg-white",
                  !child.active && "opacity-60 line-through"
                )}
              >
                <span>{child.active ? "🐣" : "💤"}</span>
                <span>{child.name}</span>
              </button>
            ))}
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="flex flex-col items-center justify-center p-5 text-center">
              <div className="mb-2 grid h-10 w-10 place-items-center rounded-2xl bg-lilac/10 text-lilac">
                <Award className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-bold text-ink-soft">Listas Concluídas</span>
              <p className="mt-1 font-display text-3xl font-bold text-lilac sm:text-4xl">
                {totalCompleted}
              </p>
            </Card>

            <Card className="flex flex-col items-center justify-center p-5 text-center">
              <div className="mb-2 grid h-10 w-10 place-items-center rounded-2xl bg-mint/10 text-mint">
                <Target className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-bold text-ink-soft">Taxa de Acerto</span>
              <p className="mt-1 font-display text-3xl font-bold text-mint sm:text-4xl">
                {accuracyRate}%
              </p>
            </Card>

            <Card className="flex flex-col items-center justify-center p-5 text-center">
              <div className="mb-2 grid h-10 w-10 place-items-center rounded-2xl bg-sky/10 text-sky">
                <FolderDown className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-bold text-ink-soft">Materiais Acessados</span>
              <p className="mt-1 font-display text-3xl font-bold text-sky sm:text-4xl">
                {totalMaterialsViewed}
              </p>
            </Card>

            <Card className="flex flex-col items-center justify-center p-5 text-center">
              <div className="mb-2 grid h-10 w-10 place-items-center rounded-2xl bg-sun/10 text-[#d49911]">
                <Flame className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-bold text-ink-soft">Estrelas Acumuladas</span>
              <p className="mt-1 font-display text-3xl font-bold text-[#d49911] sm:text-4xl">
                {totalPoints} ⭐
              </p>
            </Card>
          </div>

          {/* Nav Tabs within Dashboard */}
          <div className="flex flex-wrap rounded-2xl bg-white/80 p-1.5 shadow-sm ring-1 ring-black/5">
            <button
              onClick={() => setActiveTab("performance")}
              className={cn(
                "press flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition sm:text-sm",
                activeTab === "performance"
                  ? "bg-candy text-white shadow-md"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              <BarChart3 className="h-4 w-4" /> Desempenho & Matérias
            </button>
            <button
              onClick={() => setActiveTab("materials")}
              className={cn(
                "press flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition sm:text-sm",
                activeTab === "materials"
                  ? "bg-candy text-white shadow-md"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              <FolderDown className="h-4 w-4" /> Materiais de Apoio ({materialReport.length})
            </button>
            <button
              onClick={() => setActiveTab("errors")}
              className={cn(
                "press flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition sm:text-sm",
                activeTab === "errors"
                  ? "bg-candy text-white shadow-md"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              <AlertTriangle className="h-4 w-4" /> Pontos de Atenção ({allErrors.length} erros)
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={cn(
                "press flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition sm:text-sm",
                activeTab === "timeline"
                  ? "bg-candy text-white shadow-md"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              <Activity className="h-4 w-4" /> Linha do Tempo
            </button>
          </div>

          {/* Loading Indicator */}
          {isLoadingData ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <span className="h-12 w-12 animate-spin rounded-full border-4 border-candy/25 border-t-candy" />
            </div>
          ) : (
            <>
              {/* TAB 1: DESEMPENHO */}
              {activeTab === "performance" && (
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Visual Accuracy Ratio */}
                  <Card className="flex flex-col justify-between p-6">
                    <div>
                      <h3 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-ink">
                        <TrendingUp className="h-5 w-5 text-mint" strokeWidth={2.5} />
                        Proporção de Acertos vs Erros
                      </h3>
                      <p className="mb-6 text-xs text-ink-soft">
                        Visão consolidada de todas as respostas registradas nas listas.
                      </p>

                      {totalQuestions === 0 ? (
                        <div className="py-12 text-center text-sm text-ink-soft">
                          Nenhum exercício resolvido ainda.
                        </div>
                      ) : (
                        <div className="space-y-5">
                          <div>
                            <div className="mb-2 flex justify-between text-xs font-bold">
                              <span className="flex items-center gap-1.5 text-[#05795b]">
                                <CheckCircle2 className="h-4 w-4 text-mint" />
                                {totalCorrect} Acertos ({accuracyRate}%)
                              </span>
                              <span className="flex items-center gap-1.5 text-[#a62f5f]">
                                <XCircle className="h-4 w-4 text-candy" />
                                {totalWrong} Erros ({100 - accuracyRate}%)
                              </span>
                            </div>

                            {/* Dual gradient bar */}
                            <div className="flex h-6 w-full overflow-hidden rounded-full bg-black/5 p-1 shadow-inner">
                              <div
                                className="rounded-full bg-gradient-to-r from-mint to-sky transition-all duration-700"
                                style={{ width: `${accuracyRate}%` }}
                              />
                              <div
                                className="rounded-full bg-gradient-to-r from-candy to-sun transition-all duration-700"
                                style={{ width: `${100 - accuracyRate}%` }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-3">
                            <div className="rounded-2xl bg-mint-soft p-4 text-center">
                              <span className="text-xs font-semibold text-[#05795b]">Taxa de Sucesso</span>
                              <p className="mt-0.5 font-display text-2xl font-bold text-[#05795b]">
                                {accuracyRate}%
                              </p>
                            </div>
                            <div className="rounded-2xl bg-candy-soft p-4 text-center">
                              <span className="text-xs font-semibold text-[#a62f5f]">Total Respondido</span>
                              <p className="mt-0.5 font-display text-2xl font-bold text-[#a62f5f]">
                                {totalQuestions} questões
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Subject Breakdown Chart */}
                  <Card className="p-6">
                    <h3 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-ink">
                      <BookOpen className="h-5 w-5 text-lilac" strokeWidth={2.5} />
                      Aproveitamento por Matéria
                    </h3>
                    <p className="mb-6 text-xs text-ink-soft">
                      Desempenho relativo e volume de listas por disciplina.
                    </p>

                    {subjectStats.length === 0 ? (
                      <div className="py-12 text-center text-sm text-ink-soft">
                        Nenhum dado por matéria disponível.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {subjectStats.map((sub) => (
                          <div key={sub.subjectId} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="flex items-center gap-1.5 text-ink">
                                <span>{sub.emoji}</span>
                                <span>{sub.name}</span>
                              </span>
                              <span className="text-ink-soft">
                                {sub.correctCount}/{sub.total} ({sub.rate}%)
                              </span>
                            </div>
                            <div className="h-3.5 w-full overflow-hidden rounded-full bg-black/5 p-0.5">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${sub.rate}%`,
                                  backgroundColor: sub.hex,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* TAB 2: MATERIAIS DE APOIO ACESSADOS */}
              {activeTab === "materials" && (
                <Card className="p-6">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                        <FolderDown className="h-5 w-5 text-sky" strokeWidth={2.5} />
                        Materiais de Estudo Acessados pelos Filhos
                      </h3>
                      <p className="text-xs text-ink-soft sm:text-sm">
                        Vídeos, áudios, imagens e PDFs visualizados ou baixados para estudo.
                      </p>
                    </div>

                    <Badge tone="sky">
                      {materialReport.length}{" "}
                      {materialReport.length === 1 ? "material consumido" : "materiais consumidos"}
                    </Badge>
                  </div>

                  {materialReport.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="mb-2 text-4xl">📂</div>
                      <p className="font-display text-lg font-bold text-ink">
                        Nenhum material de apoio acessado ainda.
                      </p>
                      <p className="mt-1 text-xs text-ink-soft">
                        Quando as crianças abrirem ou baixarem vídeos, PDFs ou áudios nas matérias,
                        o histórico aparecerá detalhado aqui.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {materialReport.map((item, idx) => {
                        const theme = getSubject(item.subjectId);
                        const catInfo = getCategoryInfo(item.category);

                        return (
                          <div
                            key={idx}
                            className="flex flex-col justify-between rounded-2xl border-2 border-sky/15 bg-white/90 p-4 shadow-sm"
                          >
                            <div>
                              <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5">
                                  <span>{theme?.emoji || "📖"}</span>
                                  <span className="font-display text-xs font-bold text-ink">
                                    {theme?.name || item.subjectId}
                                  </span>
                                  <span className="text-[11px] font-bold text-candy">
                                    ({item.childName})
                                  </span>
                                </div>
                                <span className="text-[10px] text-ink-soft">
                                  {formatDateTime(item.lastAccess)}
                                </span>
                              </div>

                              <div className="flex items-start gap-2 mb-3">
                                <span className="text-xl mt-0.5">{catInfo.emoji}</span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold text-ink truncate">
                                    {item.title}
                                  </p>
                                  <span className="text-xs text-ink-soft capitalize">
                                    {item.mediaType} &middot; {catInfo.label}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Status markers */}
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-lilac/10 text-xs">
                              {item.viewed && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-2.5 py-0.5 text-xs font-bold text-[#05795b]">
                                  <Eye className="h-3.5 w-3.5" />
                                  Visualizado ({item.viewCount}x)
                                </span>
                              )}
                              {item.downloaded && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-sky-soft px-2.5 py-0.5 text-xs font-bold text-[#1a8bb0]">
                                  <Download className="h-3.5 w-3.5" />
                                  Baixado ({item.downloadCount}x)
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              )}

              {/* TAB 3: PONTOS DE ATENÇÃO (ERROS) */}
              {activeTab === "errors" && (
                <Card className="p-6">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                        <AlertTriangle className="h-5 w-5 text-candy" strokeWidth={2.5} />
                        Erros Detalhados para Revisão
                      </h3>
                      <p className="text-xs text-ink-soft sm:text-sm">
                        Questões em que as crianças erraram, prontas para revisão orientada pelos pais.
                      </p>
                    </div>

                    <Badge tone="candy">
                      {allErrors.length} {allErrors.length === 1 ? "ponto de atenção" : "pontos de atenção"}
                    </Badge>
                  </div>

                  {allErrors.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="mb-2 text-4xl">🌟</div>
                      <p className="font-display text-lg font-bold text-mint">
                        Nenhum erro registrado no filtro selecionado!
                      </p>
                      <p className="mt-1 text-xs text-ink-soft">
                        Desempenho perfeito nas listas resolvidas.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {allErrors.map((err, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col justify-between rounded-2xl border-2 border-candy/15 bg-white/90 p-4 shadow-sm"
                        >
                          <div>
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
                              <div className="flex items-center gap-1.5">
                                <span>{err.subjectEmoji}</span>
                                <span className="font-display text-xs font-bold text-ink">
                                  {err.subjectName}
                                </span>
                                <span className="text-[11px] text-ink-soft">({err.childName})</span>
                              </div>
                              <span className="text-[10px] text-ink-soft">
                                {formatDateTime(err.completedAt)}
                              </span>
                            </div>

                            <p className="mb-3 text-xs font-bold text-ink sm:text-sm">
                              ❓ {err.question}
                            </p>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            {err.selected !== undefined && (
                              <div className="flex items-start gap-2 rounded-xl bg-candy-soft p-2 text-[#a62f5f]">
                                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-candy" />
                                <div>
                                  <span className="font-bold">Marcou: </span>
                                  <span>{String(err.selected)}</span>
                                </div>
                              </div>
                            )}

                            {err.correct !== undefined && (
                              <div className="flex items-start gap-2 rounded-xl bg-mint-soft p-2 text-[#05795b]">
                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint" />
                                <div>
                                  <span className="font-bold">Correto: </span>
                                  <span>{String(err.correct)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* TAB 4: LINHA DO TEMPO */}
              {activeTab === "timeline" && (
                <div className="space-y-6">
                  {events.length === 0 ? (
                    <Card className="p-8 text-center text-ink-soft">
                      Nenhuma atividade registrada até o momento.
                    </Card>
                  ) : (
                    eventDayGroups.map(([dayKey, dayEvents]) => (
                      <motion.div
                        key={dayKey}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      >
                        <Card className="overflow-hidden p-0">
                          <div className="flex items-center gap-2 bg-gradient-to-r from-sky-soft to-lilac-soft px-5 py-3">
                            <CalendarDays className="h-4 w-4 text-sky" strokeWidth={2.5} />
                            <span className="font-display text-sm font-bold text-ink capitalize">
                              {formatDay(dayKey)}
                            </span>
                            <Badge tone="sky" className="ml-auto">
                              {dayEvents.length} {dayEvents.length === 1 ? "evento" : "eventos"}
                            </Badge>
                          </div>

                          <ul className="divide-y divide-lilac/10 px-5">
                            {dayEvents.map((ev) => {
                              const isLogin = ev.event_type === "login";
                              const isStart = ev.event_type === "exercise_started";
                              const isComplete = ev.event_type === "exercise_completed";
                              const isMatView = ev.event_type === "material_viewed";
                              const isMatDownload = ev.event_type === "material_downloaded";

                              const theme = getSubject(ev.subject);
                              const cName = childMap[ev.child_id] || "Estudante";

                              return (
                                <li key={ev.id} className="flex items-start gap-3 py-3.5">
                                  <span
                                    className={cn(
                                      "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl shadow-inner",
                                      isLogin && "bg-sky-soft text-sky",
                                      isStart && "bg-sun-soft text-[#c79114]",
                                      isComplete && "bg-mint-soft text-[#078d6d]",
                                      isMatView && "bg-lilac-soft text-lilac",
                                      isMatDownload && "bg-sky-soft text-[#1a8bb0]"
                                    )}
                                  >
                                    {isLogin && <LogIn className="h-4 w-4" strokeWidth={2.5} />}
                                    {isStart && <PlayCircle className="h-4 w-4" strokeWidth={2.5} />}
                                    {isComplete && <Award className="h-4 w-4" strokeWidth={2.5} />}
                                    {isMatView && <Eye className="h-4 w-4" strokeWidth={2.5} />}
                                    {isMatDownload && <Download className="h-4 w-4" strokeWidth={2.5} />}
                                  </span>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-sm font-bold text-ink">
                                        <span className="text-candy">{cName}</span>{" "}
                                        {isLogin && "entrou na plataforma"}
                                        {isStart && `iniciou lista de ${theme?.name || ev.subject || "exercícios"}`}
                                        {isComplete && `concluiu lista de ${theme?.name || ev.subject || "exercícios"}`}
                                        {isMatView && `visualizou material de ${theme?.name || ev.subject || "apoio"}`}
                                        {isMatDownload && `baixou material de ${theme?.name || ev.subject || "apoio"}`}
                                      </p>
                                      <span className="text-xs text-ink-soft">
                                        {new Date(ev.created_at).toLocaleTimeString("pt-BR", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>

                                    {(isStart || isComplete) && (
                                      <p className="mt-0.5 text-xs font-semibold text-ink-soft">
                                        {theme?.emoji} {ev.list_title || ev.list_slug}
                                      </p>
                                    )}

                                    {(isMatView || isMatDownload) && (
                                      <p className="mt-0.5 text-xs font-semibold text-ink-soft">
                                        📄 {ev.list_title || ev.metadata?.fileName || "Material de estudo"}
                                      </p>
                                    )}

                                    {isComplete && ev.metadata && (
                                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                        <Badge tone="mint">
                                          {ev.metadata.correctCount || 0} acertos ({ev.metadata.scorePct || 0}%)
                                        </Badge>
                                        {(ev.metadata.wrongCount || 0) > 0 && (
                                          <Badge tone="candy">
                                            {ev.metadata.wrongCount} erros
                                          </Badge>
                                        )}
                                        {ev.metadata.durationSeconds && (
                                          <span className="flex items-center gap-1 text-ink-soft">
                                            <Clock className="h-3 w-3" />
                                            {Math.round(ev.metadata.durationSeconds / 60)} min
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* VIEW 2: GERENCIAR FILHOS (CADASTRO E DESABILITAÇÃO) */}
      {currentView === "children" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* List of Children with Disable Toggle */}
          <Card className="p-6">
            <h2 className="mb-2 flex items-center gap-2 font-display text-xl font-bold text-ink">
              <Baby className="h-5 w-5 text-lilac" strokeWidth={2.5} /> Filhos Cadastrados
            </h2>
            <p className="mb-6 text-xs text-ink-soft sm:text-sm">
              Gerencie quem pode acessar a Esther e resolva exercícios com pontuação individual.
            </p>

            {isLoadingChildren ? (
              <div className="py-8 text-center text-sm text-ink-soft">Carregando filhos...</div>
            ) : children.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-lilac/25 p-8 text-center">
                <p className="font-display text-base font-bold text-ink">Nenhum filho cadastrado ainda</p>
                <p className="mt-1 text-xs text-ink-soft">
                  Cadastre seu primeiro filho usando o formulário ao lado para começar!
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-lilac/10">
                {children.map((child) => (
                  <li key={child.id} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lilac/15 text-2xl">
                        {child.active ? "🐣" : "💤"}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-display font-bold text-ink">{child.name}</p>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold",
                              child.active
                                ? "bg-mint-soft text-[#05795b]"
                                : "bg-black/10 text-ink-soft"
                            )}
                          >
                            {child.active ? "Ativo" : "Desativado"}
                          </span>
                        </div>
                        <p className="text-xs text-ink-soft">
                          Usuário de acesso: <span className="font-bold text-lilac">{child.username}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleChildActive(child)}
                      className={cn(
                        "press flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition",
                        child.active
                          ? "bg-candy-soft text-[#a62f5f] hover:bg-candy hover:text-white"
                          : "bg-mint-soft text-[#05795b] hover:bg-mint hover:text-white"
                      )}
                      title={child.active ? "Desativar conta do filho" : "Reativar conta do filho"}
                    >
                      {child.active ? (
                        <>
                          <UserX className="h-3.5 w-3.5" />
                          <span>Desativar</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>Ativar</span>
                        </>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Form to Add New Child */}
          <Card className="p-6">
            <h2 className="mb-2 flex items-center gap-2 font-display text-xl font-bold text-ink">
              <UserPlus className="h-5 w-5 text-candy" strokeWidth={2.5} /> Adicionar Filho
            </h2>
            <p className="mb-6 text-xs text-ink-soft">
              Crie uma conta para seu filho acessar com facilidade.
            </p>

            {registerSuccess && (
              <div className="mb-4 rounded-2xl bg-mint-soft p-3 text-xs font-bold text-[#05795b]">
                {registerSuccess}
              </div>
            )}
            {registerError && (
              <div className="mb-4 rounded-2xl bg-candy-soft p-3 text-xs font-bold text-[#a62f5f]">
                {registerError}
              </div>
            )}

            <form onSubmit={handleRegisterChild} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-ink">Nome da Criança</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Esther"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-ink">Usuário (login)</label>
                <input
                  type="text"
                  required
                  placeholder="ex: esther"
                  value={childUsername}
                  onChange={(e) => setChildUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-ink">Senha de Acesso</label>
                <input
                  type="password"
                  required
                  placeholder="ex: 123456"
                  value={childPassword}
                  onChange={(e) => setChildPassword(e.target.value)}
                  className={inputClass}
                />
              </div>

              <Button
                type="submit"
                variant="candy"
                className="w-full"
                disabled={isRegistering}
              >
                {isRegistering ? "Cadastrando..." : "Cadastrar Filho"}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
