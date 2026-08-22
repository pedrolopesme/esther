"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Clock,
  CalendarDays,
  Trash2,
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
  ChevronRight,
  TrendingUp,
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

  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Form states
  const [childName, setChildName] = useState("");
  const [childUsername, setChildUsername] = useState("");
  const [childPassword, setChildPassword] = useState("");
  const [registerError, setRegisterError] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Tabs for details: "timeline" | "performance" | "errors"
  const [activeTab, setActiveTab] = useState("performance");

  // Redirect non-parents
  useEffect(() => {
    if (!authLoading && !isParent) router.push("/");
  }, [authLoading, isParent, router]);

  // Load children
  const loadChildren = useCallback(async () => {
    if (!supabase || !user) return;
    setIsLoadingChildren(true);
    const { data, error } = await supabase
      .from("children")
      .select("id, display_name, username")
      .eq("parent_id", user.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      const list = data.map((row) => ({
        id: row.id,
        name: row.display_name,
        username: row.username,
      }));
      setChildren(list);
      if (list.length > 0 && !selectedChild) {
        setSelectedChild(list[0]);
      }
    }
    setIsLoadingChildren(false);
  }, [supabase, user, selectedChild]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  // Load child events and exercise sessions
  useEffect(() => {
    if (!selectedChild || !supabase) {
      setEvents([]);
      setSessions([]);
      return;
    }

    setIsLoadingData(true);

    Promise.all([
      supabase
        .from("child_events")
        .select("*")
        .eq("child_id", selectedChild.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("exercise_sessions")
        .select("*")
        .eq("child_id", selectedChild.id)
        .order("completed_at", { ascending: false })
        .limit(100),
    ]).then(([eventsRes, sessionsRes]) => {
      if (!eventsRes.error && eventsRes.data) {
        setEvents(eventsRes.data);
      }
      if (!sessionsRes.error && sessionsRes.data) {
        setSessions(sessionsRes.data);
      }
      setIsLoadingData(false);
    });
  }, [selectedChild, supabase]);

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
        setRegisterSuccess(`${data.display_name} cadastrado(a)! Usuário: ${data.username}`);
        setChildName("");
        setChildUsername("");
        setChildPassword("");
        loadChildren();
      }
    } catch (err) {
      setRegisterError(err.message || "Erro ao cadastrar filho.");
    } finally {
      setIsRegistering(false);
    }
  }

  // Remove child
  async function handleUnlink(childId) {
    if (!user || !confirm("Tem certeza que deseja remover este cadastro?")) return;
    await supabase
      .from("children")
      .delete()
      .eq("id", childId)
      .eq("parent_id", user.id);

    if (selectedChild?.id === childId) {
      setSelectedChild(null);
    }
    loadChildren();
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-16 w-16 animate-spin rounded-full border-4 border-candy/25 border-t-candy" />
      </div>
    );
  }

  if (!isParent) return null;

  // Compute metrics
  const totalCompleted = sessions.length;
  const totalCorrect = sessions.reduce((acc, s) => acc + (s.correct_count || 0), 0);
  const totalWrong = sessions.reduce((acc, s) => acc + (s.wrong_count || 0), 0);
  const totalQuestions = totalCorrect + totalWrong;
  const accuracyRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const totalPoints = sessions.reduce((acc, s) => acc + (s.points_earned || 0), 0);

  // Group performance by subject
  const subjectStats = {};
  for (const s of sessions) {
    const subId = s.list_subject || "outros";
    if (!subjectStats[subId]) {
      subjectStats[subId] = {
        subjectId: subId,
        completedCount: 0,
        correctCount: 0,
        wrongCount: 0,
      };
    }
    subjectStats[subId].completedCount += 1;
    subjectStats[subId].correctCount += s.correct_count || 0;
    subjectStats[subId].wrongCount += s.wrong_count || 0;
  }

  const subjectList = Object.values(subjectStats).map((stat) => {
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

  // Extract all wrong answers for analysis
  const allErrors = [];
  for (const s of sessions) {
    const theme = getSubject(s.list_subject);
    if (Array.isArray(s.wrong_details)) {
      for (const err of s.wrong_details) {
        allErrors.push({
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

  const eventDayGroups = groupByDay(events);

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 pb-16 pt-6">
      {/* Back */}
      <Link
        href="/"
        className="press mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-ink shadow-sm backdrop-blur hover:-translate-x-0.5 hover:text-candy"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} /> Voltar
      </Link>

      {/* Hero */}
      <motion.div
        className="clay relative mb-8 overflow-hidden bg-gradient-to-br from-candy to-lilac p-6 text-white sm:p-8"
        initial={{ y: -18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
      >
        <div className="bg-dots absolute inset-0 opacity-30" />
        <div className="relative flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl border-4 border-white/80 bg-white/95 shadow-lg">
            <Users className="h-8 w-8 text-candy" strokeWidth={2.3} />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold drop-shadow-sm sm:text-4xl">
              Painel do Responsável
            </h1>
            <p className="text-white/90">Acompanhe eventos, desempenho e erros de estudos dos seus filhos</p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Left Column: Register & Child Switcher */}
        <div className="space-y-5">
          {/* Children switcher */}
          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-ink">
              <Baby className="h-5 w-5 text-lilac" strokeWidth={2.5} /> Seus filhos
            </h2>
            {isLoadingChildren ? (
              <div className="flex justify-center py-4">
                <span className="h-8 w-8 animate-spin rounded-full border-3 border-lilac/25 border-t-lilac" />
              </div>
            ) : children.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-soft">
                Nenhum filho cadastrado ainda. Use o formulário abaixo para cadastrar.
              </p>
            ) : (
              <ul className="space-y-2">
                {children.map((child) => (
                  <li key={child.id}>
                    <div
                      className={cn(
                        "press flex items-center justify-between rounded-2xl px-4 py-3 transition",
                        selectedChild?.id === child.id
                          ? "bg-candy-soft ring-2 ring-candy/40"
                          : "bg-white/70 hover:bg-candy-soft/50"
                      )}
                    >
                      <button
                        onClick={() => setSelectedChild(child)}
                        className="flex flex-1 items-center gap-3 text-left"
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-candy-soft to-lilac-soft text-lg shadow ring-2 ring-white">
                          🧒
                        </span>
                        <div className="min-w-0">
                          <p className="font-display font-bold text-ink truncate">{child.name}</p>
                          <p className="text-xs text-ink-soft">@{child.username}</p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleUnlink(child.id)}
                        className="rounded-full p-1.5 text-ink-soft hover:bg-candy-soft hover:text-candy"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Register form */}
          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-ink">
              <UserPlus className="h-5 w-5 text-candy" strokeWidth={2.5} /> Cadastrar filho
            </h2>
            <form onSubmit={handleRegisterChild} className="space-y-3">
              <input
                className={inputClass}
                type="text"
                placeholder="Nome da criança"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                required
              />
              <input
                className={inputClass}
                type="text"
                placeholder="Usuário para login"
                value={childUsername}
                onChange={(e) => setChildUsername(e.target.value)}
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_]+"
                title="Apenas letras, números e _"
              />
              <input
                className={inputClass}
                type="password"
                placeholder="Senha"
                value={childPassword}
                onChange={(e) => setChildPassword(e.target.value)}
                required
                minLength={6}
              />
              <Button type="submit" variant="candy" className="w-full" disabled={isRegistering}>
                {isRegistering ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </form>
            {registerError && (
              <p className="mt-2 rounded-xl bg-candy-soft px-3 py-2 text-xs font-semibold text-[#a62f5f]">
                {registerError}
              </p>
            )}
            {registerSuccess && (
              <p className="mt-2 rounded-xl bg-mint-soft px-3 py-2 text-xs font-semibold text-[#05795b]">
                {registerSuccess}
              </p>
            )}
          </Card>
        </div>

        {/* Right Column: Analytics, Events & Errors */}
        <div>
          {!selectedChild ? (
            <Card className="flex min-h-[350px] flex-col items-center justify-center p-8 text-center">
              <div className="mb-3 text-5xl">👀</div>
              <h2 className="font-display text-xl font-bold text-ink">Selecione um filho</h2>
              <p className="mt-2 text-sm text-ink-soft">
                Clique em um filho na lista ao lado para ver o progresso e o relatório de estudos.
              </p>
            </Card>
          ) : isLoadingData ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <span className="h-12 w-12 animate-spin rounded-full border-4 border-candy/25 border-t-candy" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Stats Overview */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Card className="p-4 text-center">
                  <span className="text-xs font-bold text-ink-soft">Listas Concluídas</span>
                  <p className="mt-1 font-display text-2xl font-bold text-lilac sm:text-3xl">
                    {totalCompleted}
                  </p>
                </Card>
                <Card className="p-4 text-center">
                  <span className="text-xs font-bold text-ink-soft">Taxa de Acerto</span>
                  <p className="mt-1 font-display text-2xl font-bold text-mint sm:text-3xl">
                    {accuracyRate}%
                  </p>
                </Card>
                <Card className="p-4 text-center">
                  <span className="text-xs font-bold text-ink-soft">Total de Acertos</span>
                  <p className="mt-1 font-display text-2xl font-bold text-sky sm:text-3xl">
                    {totalCorrect}
                  </p>
                </Card>
                <Card className="p-4 text-center">
                  <span className="text-xs font-bold text-ink-soft">Erros Registrados</span>
                  <p className="mt-1 font-display text-2xl font-bold text-candy sm:text-3xl">
                    {totalWrong}
                  </p>
                </Card>
              </div>

              {/* Navigation Tabs */}
              <div className="flex rounded-2xl bg-white/70 p-1.5 shadow-sm ring-1 ring-white">
                <button
                  onClick={() => setActiveTab("performance")}
                  className={cn(
                    "press flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm",
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
                    "press flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm",
                    activeTab === "errors"
                      ? "bg-candy text-white shadow-md"
                      : "text-ink-soft hover:text-ink"
                  )}
                >
                  <AlertTriangle className="h-4 w-4" /> Pontos de Atenção ({allErrors.length})
                </button>
                <button
                  onClick={() => setActiveTab("timeline")}
                  className={cn(
                    "press flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm",
                    activeTab === "timeline"
                      ? "bg-candy text-white shadow-md"
                      : "text-ink-soft hover:text-ink"
                  )}
                >
                  <Activity className="h-4 w-4" /> Eventos & Acessos
                </button>
              </div>

              {/* Tab 1: Desempenho & Gráficos */}
              {activeTab === "performance" && (
                <div className="space-y-6">
                  {/* Accuracy Bar Chart */}
                  <Card className="p-5 sm:p-6">
                    <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink">
                      <TrendingUp className="h-5 w-5 text-mint" strokeWidth={2.5} />
                      Volume de Acertos e Erros
                    </h3>

                    {totalQuestions === 0 ? (
                      <p className="py-6 text-center text-sm text-ink-soft">
                        Nenhuma questão resolvida ainda para gerar o gráfico.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {/* Overall Progress Bar */}
                        <div>
                          <div className="mb-1.5 flex justify-between text-xs font-bold">
                            <span className="text-mint">Acertos: {totalCorrect} ({accuracyRate}%)</span>
                            <span className="text-candy">Erros: {totalWrong} ({100 - accuracyRate}%)</span>
                          </div>
                          <div className="flex h-5 w-full overflow-hidden rounded-full bg-white shadow-inner">
                            <div
                              className="bg-gradient-to-r from-mint to-sky transition-all duration-500"
                              style={{ width: `${accuracyRate}%` }}
                            />
                            <div
                              className="bg-gradient-to-r from-candy to-sun transition-all duration-500"
                              style={{ width: `${100 - accuracyRate}%` }}
                            />
                          </div>
                        </div>

                        {/* Summary breakdown */}
                        <div className="grid grid-cols-2 gap-3 pt-2 sm:grid-cols-3">
                          <div className="rounded-2xl bg-mint-soft p-3 text-center">
                            <span className="text-xs font-semibold text-[#05795b]">Média Geral</span>
                            <p className="font-display text-xl font-bold text-[#05795b]">{accuracyRate}%</p>
                          </div>
                          <div className="rounded-2xl bg-sky-soft p-3 text-center">
                            <span className="text-xs font-semibold text-[#1a7f9e]">Questões Totais</span>
                            <p className="font-display text-xl font-bold text-[#1a7f9e]">{totalQuestions}</p>
                          </div>
                          <div className="col-span-2 rounded-2xl bg-sun-soft p-3 text-center sm:col-span-1">
                            <span className="text-xs font-semibold text-[#a37912]">Estrelas Ganhas</span>
                            <p className="font-display text-xl font-bold text-[#a37912]">{totalPoints} ⭐</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Performance by Subject */}
                  <Card className="p-5 sm:p-6">
                    <h3 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink">
                      <BookOpen className="h-5 w-5 text-lilac" strokeWidth={2.5} />
                      Desempenho por Matéria
                    </h3>

                    {subjectList.length === 0 ? (
                      <p className="py-6 text-center text-sm text-ink-soft">
                        Nenhuma lista de exercícios concluída até o momento.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {subjectList.map((sub) => (
                          <div key={sub.subjectId} className="rounded-2xl bg-white/70 p-4 shadow-sm">
                            <div className="mb-2 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span className="text-xl">{sub.emoji}</span>
                                <span className="font-display font-bold text-ink">{sub.name}</span>
                              </div>
                              <span className="font-display text-sm font-bold text-ink">
                                {sub.rate}% de acerto
                              </span>
                            </div>

                            {/* Bar */}
                            <div className="h-3 w-full overflow-hidden rounded-full bg-white shadow-inner">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${sub.rate}%`,
                                  backgroundColor: sub.hex,
                                }}
                              />
                            </div>

                            <div className="mt-2 flex justify-between text-xs text-ink-soft">
                              <span>{sub.completedCount} {sub.completedCount === 1 ? "lista feita" : "listas feitas"}</span>
                              <span>{sub.correctCount} acertos · {sub.wrongCount} erros</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* Tab 2: Pontos de Atenção (Erros Detalhados) */}
              {activeTab === "errors" && (
                <div className="space-y-4">
                  <Card className="p-5 sm:p-6">
                    <h3 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-ink">
                      <AlertTriangle className="h-5 w-5 text-candy" strokeWidth={2.5} />
                      Erros para Revisar com a Criança
                    </h3>
                    <p className="mb-4 text-xs text-ink-soft sm:text-sm">
                      Lista detalhada das questões em que {selectedChild.name} errou para você ajudar nos estudos.
                    </p>

                    {allErrors.length === 0 ? (
                      <div className="py-8 text-center">
                        <div className="mb-2 text-4xl">🌟</div>
                        <p className="font-display font-bold text-mint">Nenhum erro registrado!</p>
                        <p className="mt-1 text-xs text-ink-soft">Excelente desempenho em todas as listas resolvidas.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {allErrors.map((err, idx) => (
                          <div
                            key={idx}
                            className="rounded-2xl border-2 border-candy/15 bg-white/90 p-4 shadow-sm"
                          >
                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span>{err.subjectEmoji}</span>
                                <span className="font-display text-xs font-bold text-ink">{err.subjectName}</span>
                                <span className="text-xs text-ink-soft">· {err.listTitle}</span>
                              </div>
                              <span className="text-[11px] text-ink-soft">{formatDateTime(err.completedAt)}</span>
                            </div>

                            <p className="mb-3 text-sm font-semibold text-ink">
                              ❓ {err.question}
                            </p>

                            <div className="grid gap-2 text-xs sm:grid-cols-2">
                              {err.selected !== undefined && (
                                <div className="flex items-start gap-2 rounded-xl bg-candy-soft p-2.5 text-[#a62f5f]">
                                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-candy" />
                                  <div>
                                    <span className="font-bold">Marcou: </span>
                                    <span>{String(err.selected)}</span>
                                  </div>
                                </div>
                              )}
                              {err.correct !== undefined && (
                                <div className="flex items-start gap-2 rounded-xl bg-mint-soft p-2.5 text-[#05795b]">
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
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
                </div>
              )}

              {/* Tab 3: Linha do Tempo de Eventos */}
              {activeTab === "timeline" && (
                <div className="space-y-5">
                  {events.length === 0 ? (
                    <Card className="p-8 text-center">
                      <div className="mb-3 text-4xl">📭</div>
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

                              return (
                                <li key={ev.id} className="flex items-start gap-3 py-3.5">
                                  {/* Icon badge */}
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

                                  {/* Event Content */}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-sm font-bold text-ink">
                                        {isLogin && "Entrou na plataforma"}
                                        {isStart && `Iniciou lista de ${theme?.name || ev.subject || "exercícios"}`}
                                        {isComplete && `Concluiu lista de ${theme?.name || ev.subject || "exercícios"}`}
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
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
