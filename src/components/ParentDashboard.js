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
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getSupabaseBrowserClient } from "../utils/supabase";
import { getSubject } from "../utils/subjects";
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
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Selected child filter ("all" for consolidated view)
  const [selectedChildId, setSelectedChildId] = useState("all");

  // Top navigation view mode: "dashboard" | "children"
  const [currentView, setCurrentView] = useState("dashboard");

  // Dashboard inner tabs: "performance" | "errors" | "timeline"
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

  // Load all events and sessions for this parent's children
  const loadParentData = useCallback(async () => {
    if (!supabase || !user) return;
    setIsLoadingData(true);

    const [eventsRes, sessionsRes] = await Promise.all([
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
    ]);

    if (!eventsRes.error && eventsRes.data) {
      setEvents(eventsRes.data);
    }
    if (!sessionsRes.error && sessionsRes.data) {
      setSessions(sessionsRes.data);
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
        setRegisterSuccess(`✨ ${data.display_name} cadastrado(a) com sucesso! Usuário: ${data.username}`);
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

  // Filtered data based on selected child filter
  const filteredSessions = useMemo(() => {
    if (selectedChildId === "all") return sessions;
    return sessions.filter((s) => s.child_id === selectedChildId);
  }, [sessions, selectedChildId]);

  const filteredEvents = useMemo(() => {
    if (selectedChildId === "all") return events;
    return events.filter((e) => e.child_id === selectedChildId);
  }, [events, selectedChildId]);

  // Aggregated metrics
  const totalCompleted = filteredSessions.length;
  const totalCorrect = filteredSessions.reduce((acc, s) => acc + (s.correct_count || 0), 0);
  const totalWrong = filteredSessions.reduce((acc, s) => acc + (s.wrong_count || 0), 0);
  const totalQuestions = totalCorrect + totalWrong;
  const accuracyRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const totalPoints = filteredSessions.reduce((acc, s) => acc + (s.points_earned || 0), 0);

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

  const eventDayGroups = useMemo(() => groupByDay(filteredEvents), [filteredEvents]);

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-16 w-16 animate-spin rounded-full border-4 border-candy/25 border-t-candy" />
      </div>
    );
  }

  if (!isParent) return null;

  const activeChildrenCount = children.filter((c) => c.active).length;

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 pb-20 pt-6">
      {/* Top Header Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="press inline-flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-ink shadow-sm backdrop-blur hover:-translate-x-0.5 hover:text-candy"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Voltar ao Início
        </Link>

        {/* View mode switcher */}
        <div className="flex rounded-full bg-white/80 p-1.5 shadow-sm ring-1 ring-black/5">
          <button
            onClick={() => setCurrentView("dashboard")}
            className={cn(
              "press flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition sm:text-sm",
              currentView === "dashboard"
                ? "bg-candy text-white shadow-md"
                : "text-ink-soft hover:text-ink"
            )}
          >
            <BarChart3 className="h-4 w-4" /> Visão Geral & Estudos
          </button>
          <button
            onClick={() => setCurrentView("children")}
            className={cn(
              "press flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition sm:text-sm",
              currentView === "children"
                ? "bg-candy text-white shadow-md"
                : "text-ink-soft hover:text-ink"
            )}
          >
            <Settings className="h-4 w-4" /> Gerenciar Filhos ({children.length})
          </button>
        </div>
      </div>

      {/* Main Glass Header */}
      <motion.div
        className="clay relative mb-8 overflow-hidden bg-gradient-to-br from-candy to-lilac p-6 text-white sm:p-8"
        initial={{ y: -18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
      >
        <div className="bg-dots absolute inset-0 opacity-30" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl border-4 border-white/80 bg-white/95 shadow-lg">
              <Users className="h-8 w-8 text-candy" strokeWidth={2.3} />
            </span>
            <div>
              <h1 className="font-display text-3xl font-bold drop-shadow-sm sm:text-4xl">
                Painel do Responsável
              </h1>
              <p className="text-white/90">
                Acompanhamento completo de evolução, acertos, erros e frequência
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-white/20 px-4 py-2.5 backdrop-blur">
            <Baby className="h-5 w-5 text-white" />
            <span className="text-sm font-bold">
              {activeChildrenCount} {activeChildrenCount === 1 ? "filho ativo" : "filhos ativos"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* VIEW 1: DASHBOARD DE DADOS */}
      {currentView === "dashboard" && (
        <div className="space-y-6">
          {/* Filter Bar: All or specific child */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/80 p-3 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center gap-2 text-xs font-bold text-ink-soft sm:text-sm">
              <Filter className="h-4 w-4 text-candy" /> Filtrar por Estudante:
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedChildId("all")}
                className={cn(
                  "press rounded-full px-3.5 py-1.5 text-xs font-bold transition",
                  selectedChildId === "all"
                    ? "bg-candy text-white shadow-sm"
                    : "bg-white/80 text-ink-soft hover:bg-candy-soft hover:text-ink"
                )}
              >
                🌟 Todos os Filhos ({children.length})
              </button>

              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={cn(
                    "press flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition",
                    selectedChildId === child.id
                      ? "bg-candy text-white shadow-sm"
                      : "bg-white/80 text-ink-soft hover:bg-candy-soft hover:text-ink"
                  )}
                >
                  <span>🧒</span>
                  <span>{child.name}</span>
                  {!child.active && <span className="text-[10px] text-candy">(desativado)</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="flex flex-col items-center justify-center p-5 text-center">
              <div className="mb-2 grid h-10 w-10 place-items-center rounded-2xl bg-lilac/10 text-lilac">
                <BookOpen className="h-5 w-5" strokeWidth={2.5} />
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
              <span className="text-xs font-bold text-ink-soft">Aproveitamento Geral</span>
              <p className="mt-1 font-display text-3xl font-bold text-mint sm:text-4xl">
                {accuracyRate}%
              </p>
            </Card>

            <Card className="flex flex-col items-center justify-center p-5 text-center">
              <div className="mb-2 grid h-10 w-10 place-items-center rounded-2xl bg-sky/10 text-sky">
                <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <span className="text-xs font-bold text-ink-soft">Volume de Acertos</span>
              <p className="mt-1 font-display text-3xl font-bold text-sky sm:text-4xl">
                {totalCorrect}
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
          <div className="flex rounded-2xl bg-white/80 p-1.5 shadow-sm ring-1 ring-black/5">
            <button
              onClick={() => setActiveTab("performance")}
              className={cn(
                "press flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition sm:text-sm",
                activeTab === "performance"
                  ? "bg-candy text-white shadow-md"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              <BarChart3 className="h-4 w-4" /> Desempenho & Matérias
            </button>
            <button
              onClick={() => setActiveTab("errors")}
              className={cn(
                "press flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition sm:text-sm",
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
                "press flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition sm:text-sm",
                activeTab === "timeline"
                  ? "bg-candy text-white shadow-md"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              <Activity className="h-4 w-4" /> Linha do Tempo de Eventos
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
                          <div
                            key={sub.subjectId}
                            className="rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-black/5"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className="text-xl">{sub.emoji}</span>
                                <span className="font-display font-bold text-ink">{sub.name}</span>
                              </div>
                              <span className="font-display text-sm font-bold text-ink">
                                {sub.rate}% de acerto
                              </span>
                            </div>

                            <div className="h-3 w-full overflow-hidden rounded-full bg-black/5 shadow-inner">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${sub.rate}%`,
                                  backgroundColor: sub.hex,
                                }}
                              />
                            </div>

                            <div className="mt-2 flex justify-between text-xs text-ink-soft">
                              <span>
                                {sub.completedCount}{" "}
                                {sub.completedCount === 1 ? "lista finalizada" : "listas finalizadas"}
                              </span>
                              <span>
                                {sub.correctCount} acertos · {sub.wrongCount} erros
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* TAB 2: PONTOS DE ATENÇÃO (ERROS) */}
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

              {/* TAB 3: LINHA DO TEMPO */}
              {activeTab === "timeline" && (
                <div className="space-y-4">
                  {events.length === 0 ? (
                    <Card className="py-12 text-center">
                      <div className="mb-2 text-4xl">📭</div>
                      <p className="font-display font-semibold text-ink-soft">
                        Nenhum evento registrado ainda.
                      </p>
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
                              const theme = getSubject(ev.subject);
                              const cName = childMap[ev.child_id] || "Estudante";

                              return (
                                <li key={ev.id} className="flex items-start gap-3 py-3.5">
                                  <span
                                    className={cn(
                                      "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl shadow-inner",
                                      isLogin && "bg-sky-soft text-sky",
                                      isStart && "bg-sun-soft text-[#c79114]",
                                      isComplete && "bg-mint-soft text-[#078d6d]"
                                    )}
                                  >
                                    {isLogin && <LogIn className="h-4 w-4" strokeWidth={2.5} />}
                                    {isStart && <PlayCircle className="h-4 w-4" strokeWidth={2.5} />}
                                    {isComplete && <Award className="h-4 w-4" strokeWidth={2.5} />}
                                  </span>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-sm font-bold text-ink">
                                        <span className="text-candy">{cName}</span>{" "}
                                        {isLogin && "entrou na plataforma"}
                                        {isStart && `iniciou lista de ${theme?.name || ev.subject || "exercícios"}`}
                                        {isComplete && `concluiu lista de ${theme?.name || ev.subject || "exercícios"}`}
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
              Gerencie as contas de acesso dos seus filhos. Em vez de excluir, você pode desativar o acesso mantendo todo o histórico intacto.
            </p>

            {isLoadingChildren ? (
              <div className="flex justify-center py-8">
                <span className="h-10 w-10 animate-spin rounded-full border-3 border-lilac/25 border-t-lilac" />
              </div>
            ) : children.length === 0 ? (
              <div className="rounded-2xl bg-sky-soft p-8 text-center">
                <div className="mb-2 text-4xl">🧒</div>
                <p className="font-display font-bold text-ink">Nenhum filho cadastrado ainda.</p>
                <p className="mt-1 text-xs text-ink-soft">
                  Preencha o formulário ao lado para adicionar o primeiro filho.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 p-4 transition",
                      child.active
                        ? "border-lilac/15 bg-white/90 shadow-sm"
                        : "border-black/5 bg-gray-50/80 opacity-75"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-candy-soft to-lilac-soft text-2xl shadow ring-2 ring-white">
                        {child.active ? "🧒" : "💤"}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-base font-bold text-ink">
                            {child.name}
                          </h3>
                          {child.active ? (
                            <Badge tone="mint">Ativo</Badge>
                          ) : (
                            <Badge tone="neutral">Desativado</Badge>
                          )}
                        </div>
                        <p className="text-xs text-ink-soft">
                          Usuário: <span className="font-bold text-ink">@{child.username}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={child.active ? "candy" : "mint"}
                        size="sm"
                        onClick={() => handleToggleChildActive(child)}
                        className="flex items-center gap-1.5"
                      >
                        {child.active ? (
                          <>
                            <UserX className="h-4 w-4" /> Desativar Acesso
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4" /> Reativar Acesso
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Form to Add a New Child */}
          <Card className="h-fit p-6">
            <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-ink">
              <UserPlus className="h-5 w-5 text-candy" strokeWidth={2.5} /> Adicionar Novo Filho
            </h2>
            <p className="mb-4 text-xs text-ink-soft">
              Crie o login simples que a criança usará para estudar.
            </p>

            <form onSubmit={handleRegisterChild} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-bold text-ink">Nome da Criança</label>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="Ex: Esther"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-ink">Nome de Usuário (login)</label>
                <input
                  className={inputClass}
                  type="text"
                  placeholder="Ex: esther (sem espaços)"
                  value={childUsername}
                  onChange={(e) => setChildUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="[a-zA-Z0-9_]+"
                  title="Apenas letras, números e _"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-ink">Senha</label>
                <input
                  className={inputClass}
                  type="password"
                  placeholder="Mínimo 6 dígitos"
                  value={childPassword}
                  onChange={(e) => setChildPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" variant="candy" className="w-full" disabled={isRegistering}>
                {isRegistering ? "Cadastrando..." : "Cadastrar Filho"}
              </Button>
            </form>

            {registerError && (
              <p className="mt-3 rounded-xl bg-candy-soft px-3 py-2 text-xs font-semibold text-[#a62f5f]">
                {registerError}
              </p>
            )}
            {registerSuccess && (
              <p className="mt-3 rounded-xl bg-mint-soft px-3 py-2 text-xs font-semibold text-[#05795b]">
                {registerSuccess}
              </p>
            )}
          </Card>
        </div>
      )}
    </main>
  );
}
