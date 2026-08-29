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
  Gamepad2,
  Trophy,
  ListChecks,
  CircleDashed,
  PieChart,
  Layers,
  ChevronRight,
  Search,
  X,
  Pencil,
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

/* ---------------- Analytics helpers ---------------- */

/** Local-date key (YYYY-MM-DD). Avoids the UTC drift of toISOString(). */
function dayKey(value) {
  const d = value instanceof Date ? value : new Date(value);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Midnight-anchored local Date, n days before today. */
function daysAgo(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

/** Ordered list of the last `span` local days, oldest first. */
function buildDaySpan(span) {
  const out = new Array(span);
  for (let i = 0; i < span; i += 1) {
    const d = daysAgo(span - 1 - i);
    out[i] = { key: dayKey(d), date: d, count: 0, lists: 0, games: 0, materials: 0 };
  }
  return out;
}

/**
 * Current and longest run of consecutive active days.
 * An empty *today* does not break the current streak — the day is not over yet.
 */
function computeStreaks(days) {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    if (d.count > 0) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }

  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i -= 1;
  let current = 0;
  for (; i >= 0; i -= 1) {
    if (days[i].count > 0) current += 1;
    else break;
  }

  return { current, longest };
}

/** Start of the week (Sunday, local midnight) containing `value`. */
function startOfWeek(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

const WEEK_MS = 604800000;

/** Weekday initials for the study-rhythm chart. */
const WEEKDAY_INITIALS = ["D", "S", "T", "Q", "Q", "S", "S"];

/** Commitment score weights — regularity dominates, it is the habit that matters. */
const COMMITMENT_WEIGHTS = { consistency: 0.4, coverage: 0.35, accuracy: 0.25 };

/** Active days in a 30-day window that count as a fully consistent routine. */
const TARGET_ACTIVE_DAYS = 12;

export default function ParentDashboard() {
  const router = useRouter();
  const { isParent, isLoading: authLoading, user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  // Data states
  const [children, setChildren] = useState([]);
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [exerciseLists, setExerciseLists] = useState([]);
  const [materialAccesses, setMaterialAccesses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [gameSessions, setGameSessions] = useState([]);
  const [games, setGames] = useState([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Selected child filter ("all" for consolidated view)
  const [selectedChildId, setSelectedChildId] = useState("all");

  // Top navigation view mode: "dashboard" | "children"
  const [currentView, setCurrentView] = useState("dashboard");

  // Dashboard inner tabs: "performance" | "lists" | "games" | "materials" | "errors" | "timeline"
  const [activeTab, setActiveTab] = useState("performance");

  // Filter state for Lists tab
  const [listSearchTitle, setListSearchTitle] = useState("");
  const [listFilterSubject, setListFilterSubject] = useState("");
  const [listFilterStatus, setListFilterStatus] = useState("all"); // "all" | "done" | "pending"
  const [listFilterGrade, setListFilterGrade] = useState("");
  const [listSortField, setListSortField] = useState("created_at"); // "created_at" | "title" | "question_count"
  const [listSortDir, setListSortDir] = useState("desc"); // "asc" | "desc"
  const [listFilterAccess, setListFilterAccess] = useState("all"); // "all" | "pending" | "accessed"
  const [selectedListAccesses, setSelectedListAccesses] = useState(null);
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);

  // Games tab: sorting + accesses drill-down
  const [gameSortField, setGameSortField] = useState("created_at"); // "created_at" | "title" | "subject"
  const [gameSortDir, setGameSortDir] = useState("desc"); // "asc" | "desc"
  const [selectedGameAccesses, setSelectedGameAccesses] = useState(null);
  const [selectedGameSessionDetail, setSelectedGameSessionDetail] = useState(null);

  // Materials tab: filter, sorting + accesses drill-down
  const [materialFilterStatus, setMaterialFilterStatus] = useState("all"); // "all" | "viewed" | "not_viewed"
  const [materialSortField, setMaterialSortField] = useState("created_at"); // "created_at" | "title" | "subject" | "mediaType"
  const [materialSortDir, setMaterialSortDir] = useState("desc"); // "asc" | "desc"
  const [selectedMaterialAccesses, setSelectedMaterialAccesses] = useState(null);
  const [selectedMaterialChildDetail, setSelectedMaterialChildDetail] = useState(null);

  // Form states for registering children
  const [childName, setChildName] = useState("");
  const [childUsername, setChildUsername] = useState("");
  const [childPassword, setChildPassword] = useState("");
  const [childGradeLevel, setChildGradeLevel] = useState("");
  const [gradeLevels, setGradeLevels] = useState([]);
  const [isLoadingGradeLevels, setIsLoadingGradeLevels] = useState(true);
  // Edit child states
  const [editingChildId, setEditingChildId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editGradeLevel, setEditGradeLevel] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

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
      .select("id, display_name, username, active, created_at, grade_level_id, grade_levels(name, stage)")
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
          gradeLevelId: row.grade_level_id,
          gradeLevelName: row.grade_levels?.name || "",
          gradeLevelStage: row.grade_levels?.stage || "",
        }))
      );
    }
    setIsLoadingChildren(false);
  }, [supabase, user]);

  // Load grade levels for the registration form
  const loadGradeLevels = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("grade_levels")
      .select("id, name, stage, sort_order")
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setGradeLevels(data);
      // Default to "1º ano" (sort_order = 6)
      const defaultGrade = data.find((g) => g.sort_order === 6);
      if (defaultGrade) setChildGradeLevel(defaultGrade.id);
    }
    setIsLoadingGradeLevels(false);
  }, [supabase]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);
  useEffect(() => {
    loadGradeLevels();
  }, [loadGradeLevels]);

  // Load all events, sessions, published lists, game sessions, material accesses and items
  const loadParentData = useCallback(async () => {
    if (!supabase || !user) return;
    setIsLoadingData(true);

    const [
      eventsRes,
      sessionsRes,
      listsRes,
      accessesRes,
      materialsRes,
      gameSessionsRes,
      gamesRes,
    ] = await Promise.all([
      supabase
        .from("child_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("exercise_sessions")
        .select("*")
        .order("completed_at", { ascending: false })
        .limit(300),
      supabase
        .from("exercise_lists")
        .select("id, slug, title, description, subject, materia, ano_letivo, exercise_date, question_count, published")
        .eq("published", true)
        .order("exercise_date", { ascending: false }),
      supabase
        .from("material_accesses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase
        .from("materials")
        .select("id, title, description, subject_id, ano_letivo, file_url, file_name, file_size, file_type, media_type, category, created_at")
        .eq("published", true),
      supabase
        .from("game_sessions")
        .select("*")
        .order("completed_at", { ascending: false })
        .limit(300),
      supabase
        .from("games")
        .select("id, slug, title, description, subject_id, ano_letivo, max_score, cover_url, created_at")
        .eq("published", true),
    ]);

    if (!eventsRes.error && eventsRes.data) {
      setEvents(eventsRes.data);
    }
    if (!sessionsRes.error && sessionsRes.data) {
      setSessions(sessionsRes.data);
    }
    if (!listsRes.error && listsRes.data) {
      setExerciseLists(listsRes.data);
    }
    if (!accessesRes.error && accessesRes.data) {
      setMaterialAccesses(accessesRes.data);
    }
    if (!materialsRes.error && materialsRes.data) {
      setMaterials(materialsRes.data);
    }
    if (!gameSessionsRes.error && gameSessionsRes.data) {
      setGameSessions(gameSessionsRes.data);
    }
    if (!gamesRes.error && gamesRes.data) {
      setGames(gamesRes.data);
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

  // Start editing a child — pre-fill form
  function handleStartEdit(child) {
    setEditingChildId(child.id);
    setEditName(child.name);
    setEditGradeLevel(child.gradeLevelId || "");
    setEditPassword("");
    setEditError(null);
  }

  // Cancel editing
  function handleCancelEdit() {
    setEditingChildId(null);
    setEditName("");
    setEditGradeLevel("");
    setEditPassword("");
    setEditError(null);
  }

  // Save edited child
  async function handleSaveEdit(childId) {
    if (!supabase || !user) return;
    if (!editName.trim()) {
      setEditError("O nome não pode ficar vazio.");
      return;
    }
    if (editPassword && editPassword.length < 6) {
      setEditError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setIsSavingEdit(true);
    setEditError(null);

    try {
      const { data, error } = await supabase.rpc("update_child", {
        p_child_id: childId,
        p_display_name: editName.trim(),
        p_password: editPassword || null,
        p_grade_level_id: editGradeLevel || null,
      });
      if (error) throw error;
      if (!data.ok) {
        setEditError(data.error);
      } else {
        handleCancelEdit();
        loadChildren();
      }
    } catch (err) {
      setEditError(err.message || "Erro ao salvar.");
    } finally {
      setIsSavingEdit(false);
    }
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
        p_grade_level_id: childGradeLevel,
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
        const defaultGrade = gradeLevels.find((g) => g.sort_order === 6);
        if (defaultGrade) setChildGradeLevel(defaultGrade.id);
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

  const filteredMaterialAccesses = useMemo(() => {
    if (selectedChildId === "all") return materialAccesses;
    return materialAccesses.filter((a) => a.child_id === selectedChildId);
  }, [materialAccesses, selectedChildId]);

  const filteredGameSessions = useMemo(() => {
    if (selectedChildId === "all") return gameSessions;
    return gameSessions.filter((g) => g.child_id === selectedChildId);
  }, [gameSessions, selectedChildId]);

  // Aggregated metrics for Exercises
  const totalCompleted = filteredSessions.length;
  const totalCorrect = filteredSessions.reduce((acc, s) => acc + (s.correct_count || 0), 0);
  const totalWrong = filteredSessions.reduce((acc, s) => acc + (s.wrong_count || 0), 0);
  const totalQuestions = totalCorrect + totalWrong;
  const accuracyRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const totalPoints = filteredSessions.reduce((acc, s) => acc + (s.points_earned || 0), 0);

  // Activity Overview Totals (Completed vs Pending)
  const totalPublishedLists = exerciseLists.length;
  const totalPublishedMaterials = materials.length;
  const totalPublishedGames = games.length;
  const totalActivitiesCatalog = totalPublishedLists + totalPublishedMaterials + totalPublishedGames;

  // Distinct completed exercise lists by child
  const completedListKeys = useMemo(() => {
    const set = new Set();
    for (const s of filteredSessions) {
      set.add(`${s.list_subject}/${s.list_slug}`);
    }
    return set;
  }, [filteredSessions]);

  const distinctDoneListsCount = completedListKeys.size;
  const pendingListsCount = Math.max(0, totalPublishedLists - distinctDoneListsCount);

  // Distinct materials viewed by child
  const viewedMaterialIds = useMemo(() => {
    const set = new Set();
    for (const a of filteredMaterialAccesses) {
      set.add(a.material_id);
    }
    return set;
  }, [filteredMaterialAccesses]);

  const distinctViewedMaterialsCount = viewedMaterialIds.size;
  const pendingMaterialsCount = Math.max(0, totalPublishedMaterials - distinctViewedMaterialsCount);

  // Distinct games played by child
  const playedGameIds = useMemo(() => {
    const set = new Set();
    for (const g of filteredGameSessions) {
      set.add(g.game_id);
    }
    return set;
  }, [filteredGameSessions]);

  const distinctPlayedGamesCount = playedGameIds.size;
  const pendingGamesCount = Math.max(0, totalPublishedGames - distinctPlayedGamesCount);

  // Total Activities Done vs Pending across all 3 pillars
  const grandTotalActivitiesDone = distinctDoneListsCount + distinctViewedMaterialsCount + distinctPlayedGamesCount;
  const grandTotalActivitiesPending = pendingListsCount + pendingMaterialsCount + pendingGamesCount;
  const overallCompletionRate = totalActivitiesCatalog > 0
    ? Math.round((grandTotalActivitiesDone / totalActivitiesCatalog) * 100)
    : 0;

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

  /* ---------------- Engagement analytics ---------------- */

  /** Daily activity over the last 30 days, across all three pillars. */
  const activityDays = useMemo(() => {
    const span = buildDaySpan(30);
    const index = {};
    for (const d of span) index[d.key] = d;

    const bump = (iso, field) => {
      if (!iso) return;
      const slot = index[dayKey(iso)];
      if (!slot) return;
      slot.count += 1;
      slot[field] += 1;
    };

    for (const s of filteredSessions) bump(s.completed_at, "lists");
    for (const g of filteredGameSessions) bump(g.completed_at, "games");
    for (const a of filteredMaterialAccesses) bump(a.created_at, "materials");

    return span;
  }, [filteredSessions, filteredGameSessions, filteredMaterialAccesses]);

  const streaks = useMemo(() => computeStreaks(activityDays), [activityDays]);

  const activeDays30 = useMemo(
    () => activityDays.reduce((n, d) => n + (d.count > 0 ? 1 : 0), 0),
    [activityDays]
  );

  const activeDays7 = useMemo(
    () => activityDays.slice(-7).reduce((n, d) => n + (d.count > 0 ? 1 : 0), 0),
    [activityDays]
  );

  const peakDayCount = useMemo(
    () => activityDays.reduce((max, d) => (d.count > max ? d.count : max), 0),
    [activityDays]
  );

  /** Most recent activity across pillars. ISO strings compare lexicographically. */
  const lastActivityAt = useMemo(() => {
    let latest = null;
    const consider = (iso) => {
      if (iso && (!latest || iso > latest)) latest = iso;
    };
    for (const s of filteredSessions) consider(s.completed_at);
    for (const g of filteredGameSessions) consider(g.completed_at);
    for (const a of filteredMaterialAccesses) consider(a.created_at);
    return latest;
  }, [filteredSessions, filteredGameSessions, filteredMaterialAccesses]);

  const daysSinceLastActivity = useMemo(() => {
    if (!lastActivityAt) return null;
    const last = new Date(lastActivityAt);
    last.setHours(0, 0, 0, 0);
    return Math.round((daysAgo(0).getTime() - last.getTime()) / 86400000);
  }, [lastActivityAt]);

  /**
   * Commitment score (0-100): weighted blend of routine regularity, catalog
   * coverage and answer accuracy. Regularity carries the most weight because
   * a steady habit is what parents are actually trying to build.
   */
  const commitment = useMemo(() => {
    const consistency = Math.min(100, Math.round((activeDays30 / TARGET_ACTIVE_DAYS) * 100));
    const coverage = overallCompletionRate;
    const accuracy = accuracyRate;
    const score = Math.round(
      consistency * COMMITMENT_WEIGHTS.consistency +
        coverage * COMMITMENT_WEIGHTS.coverage +
        accuracy * COMMITMENT_WEIGHTS.accuracy
    );

    let label = "Sem dados";
    let hex = "#94a3b8";
    let advice = "Ainda não há atividades registradas para avaliar o comprometimento.";

    if (totalCompleted > 0 || distinctPlayedGamesCount > 0 || distinctViewedMaterialsCount > 0) {
      if (score >= 75) {
        label = "Excelente";
        hex = "#10b981";
        advice = "Rotina consistente e bom aproveitamento. Vale reconhecer o esforço!";
      } else if (score >= 50) {
        label = "Bom";
        hex = "#4CC9F0";
        advice = "Bom caminho. Aumentar a frequência semanal traria o maior ganho agora.";
      } else if (score >= 25) {
        label = "Irregular";
        hex = "#f59e0b";
        advice = "Os estudos acontecem em picos. Combinar dias fixos na semana ajuda a criar rotina.";
      } else {
        label = "Precisa de atenção";
        hex = "#FF70A6";
        advice = "Participação baixa. Vale sentar junto e definir uma meta pequena e semanal.";
      }
    }

    return { score, consistency, coverage, accuracy, label, hex, advice };
  }, [
    activeDays30,
    overallCompletionRate,
    accuracyRate,
    totalCompleted,
    distinctPlayedGamesCount,
    distinctViewedMaterialsCount,
  ]);

  /** Accuracy and volume per week for the last 8 weeks. */
  const weeklyTrend = useMemo(() => {
    const WEEKS = 8;
    const anchor = startOfWeek(new Date());
    const anchorMs = anchor.getTime();

    const buckets = new Array(WEEKS);
    for (let i = 0; i < WEEKS; i += 1) {
      const start = new Date(anchor);
      start.setDate(start.getDate() - (WEEKS - 1 - i) * 7);
      buckets[i] = { start, correct: 0, wrong: 0, sessions: 0 };
    }

    for (const s of filteredSessions) {
      if (!s.completed_at) continue;
      const weeksBack = Math.round((anchorMs - startOfWeek(s.completed_at).getTime()) / WEEK_MS);
      const idx = WEEKS - 1 - weeksBack;
      if (idx < 0 || idx >= WEEKS) continue;
      buckets[idx].correct += s.correct_count || 0;
      buckets[idx].wrong += s.wrong_count || 0;
      buckets[idx].sessions += 1;
    }

    return buckets.map((b) => {
      const total = b.correct + b.wrong;
      return {
        label: `${String(b.start.getDate()).padStart(2, "0")}/${String(b.start.getMonth() + 1).padStart(2, "0")}`,
        rate: total > 0 ? Math.round((b.correct / total) * 100) : null,
        sessions: b.sessions,
        total,
      };
    });
  }, [filteredSessions]);

  /**
   * Geometry for the weekly combo chart: volume bars plus an accuracy line.
   * Computed once per data change so the SVG stays declarative.
   */
  const weeklyChart = useMemo(() => {
    const W = 320;
    const H = 110;
    const slot = W / weeklyTrend.length;
    const maxSessions = weeklyTrend.reduce((m, w) => (w.sessions > m ? w.sessions : m), 0);

    const bars = weeklyTrend.map((w, i) => {
      const barH = maxSessions > 0 ? (w.sessions / maxSessions) * (H * 0.72) : 0;
      return {
        label: w.label,
        sessions: w.sessions,
        rate: w.rate,
        x: i * slot + slot * 0.24,
        width: slot * 0.52,
        y: H - barH,
        height: barH,
        cx: i * slot + slot / 2,
        cy: w.rate === null ? null : H - (w.rate / 100) * H,
      };
    });

    const line = bars
      .filter((b) => b.cy !== null)
      .map((b) => `${b.cx.toFixed(1)},${b.cy.toFixed(1)}`)
      .join(" ");

    return { W, H, bars, line, maxSessions, hasData: maxSessions > 0 };
  }, [weeklyTrend]);

  /** Per-child commitment ranking. Always uses unfiltered data. */
  const childEngagement = useMemo(() => {
    if (children.length === 0) return [];

    const since = daysAgo(29).getTime();
    const byChild = {};
    for (const c of children) {
      byChild[c.id] = {
        childId: c.id,
        name: c.name,
        active: c.active,
        correct: 0,
        wrong: 0,
        points: 0,
        games: 0,
        materials: 0,
        listKeys: new Set(),
        days: new Set(),
      };
    }

    const markDay = (entry, iso) => {
      if (!iso) return;
      if (new Date(iso).getTime() >= since) entry.days.add(dayKey(iso));
    };

    for (const s of sessions) {
      const e = byChild[s.child_id];
      if (!e) continue;
      e.correct += s.correct_count || 0;
      e.wrong += s.wrong_count || 0;
      e.points += s.points_earned || 0;
      e.listKeys.add(`${s.list_subject}/${s.list_slug}`);
      markDay(e, s.completed_at);
    }
    for (const g of gameSessions) {
      const e = byChild[g.child_id];
      if (!e) continue;
      e.games += 1;
      markDay(e, g.completed_at);
    }
    for (const a of materialAccesses) {
      const e = byChild[a.child_id];
      if (!e) continue;
      e.materials += 1;
      markDay(e, a.created_at);
    }

    return Object.values(byChild)
      .map((e) => {
        const answered = e.correct + e.wrong;
        const accuracy = answered > 0 ? Math.round((e.correct / answered) * 100) : 0;
        const activeDays = e.days.size;
        const consistency = Math.min(100, Math.round((activeDays / TARGET_ACTIVE_DAYS) * 100));
        const coverage =
          totalPublishedLists > 0 ? Math.round((e.listKeys.size / totalPublishedLists) * 100) : 0;
        const score = Math.round(
          consistency * COMMITMENT_WEIGHTS.consistency +
            coverage * COMMITMENT_WEIGHTS.coverage +
            accuracy * COMMITMENT_WEIGHTS.accuracy
        );
        return {
          ...e,
          doneLists: e.listKeys.size,
          answered,
          accuracy,
          activeDays,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [children, sessions, gameSessions, materialAccesses, totalPublishedLists]);

  /** Best attempt per list, kept only when it still sits below the 70% bar. */
  const reviewTargets = useMemo(() => {
    const best = {};
    for (const s of filteredSessions) {
      const key = `${s.list_subject}/${s.list_slug}`;
      const total = s.total_questions || 0;
      const pct = total > 0 ? Math.round((s.correct_count / total) * 100) : 0;
      const prev = best[key];
      if (!prev || pct > prev.pct) {
        best[key] = {
          key,
          pct,
          subject: s.list_subject,
          title: s.list_title || s.list_slug,
          childName: childMap[s.child_id] || "Estudante",
          completedAt: s.completed_at,
          wrongCount: s.wrong_count || 0,
        };
      }
    }
    return Object.values(best)
      .filter((r) => r.pct < 70)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 5);
  }, [filteredSessions, childMap]);

  // One row per published list, with session count
  const publishedListsTableData = useMemo(() => {
    // Group sessions by list key
    const sessionsByList = {};
    for (const s of filteredSessions) {
      const key = `${s.list_subject}/${s.list_slug}`;
      if (!sessionsByList[key]) sessionsByList[key] = [];
      sessionsByList[key].push(s);
    }

    return exerciseLists.map((list) => {
      const key = `${list.subject}/${list.slug}`;
      const sessions = sessionsByList[key] || [];
      return {
        id: list.id,
        subject: list.subject,
        slug: list.slug,
        title: list.title,
        ano_letivo: list.ano_letivo,
        question_count: list.question_count || 0,
        accessCount: sessions.length,
        sessions,
        created_at: list.created_at || list.exercise_date || null,
      };
    });
  }, [exerciseLists, filteredSessions]);

  // Filtered published lists table
  const filteredListsTableData = useMemo(() => {
    return publishedListsTableData.filter((item) => {
      const matchTitle = listSearchTitle.trim()
        ? item.title?.toLowerCase().includes(listSearchTitle.toLowerCase().trim()) ||
          item.slug?.toLowerCase().includes(listSearchTitle.toLowerCase().trim())
        : true;
      const matchSubject = listFilterSubject ? item.subject === listFilterSubject : true;
      const matchGrade = listFilterGrade ? item.ano_letivo === listFilterGrade : true;
      const matchAccess =
        listFilterAccess === "accessed"
          ? item.accessCount > 0
          : listFilterAccess === "pending"
          ? item.accessCount === 0
          : true;
      return matchTitle && matchSubject && matchGrade && matchAccess;
    }).sort((a, b) => {
      const dir = listSortDir === "asc" ? 1 : -1;
      if (listSortField === "created_at") {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return (da - db) * dir;
      }
      if (listSortField === "title") {
        return (a.title || "").localeCompare(b.title || "") * dir;
      }
      if (listSortField === "question_count") {
        return ((a.question_count || 0) - (b.question_count || 0)) * dir;
      }
      return 0;
    });
  }, [publishedListsTableData, listSearchTitle, listFilterSubject, listFilterGrade, listFilterAccess, listSortField, listSortDir]);

  // Accesses for the selected list (modal data)
  const listAccessesData = useMemo(() => {
    if (!selectedListAccesses) return null;
    return selectedListAccesses.sessions.map((s) => {
      const pct = s.total_questions > 0 ? Math.round((s.correct_count / s.total_questions) * 100) : 0;
      return {
        sessionId: s.id,
        childId: s.child_id,
        childName: childMap[s.child_id] || "Estudante",
        correct_count: s.correct_count || 0,
        wrong_count: s.wrong_count || 0,
        total_questions: s.total_questions || 0,
        pct,
        completed_at: s.completed_at,
        wrong_details: Array.isArray(s.wrong_details) ? s.wrong_details : [],
      };
    });
  }, [selectedListAccesses, childMap]);

  // Errors for the selected session (drill-down modal)
  const sessionErrorsData = useMemo(() => {
    if (!selectedSessionDetail) return null;
    return selectedSessionDetail.wrong_details.map((err) => ({
      question: err.question || "Questão sem enunciado",
      selected: err.selected,
      correct: err.correct,
    }));
  }, [selectedSessionDetail]);

  /** One row per published game, carrying its sessions and access count. */
  const gamesTableData = useMemo(() => {
    const sessionsByGame = {};
    for (const s of filteredGameSessions) {
      if (!sessionsByGame[s.game_id]) sessionsByGame[s.game_id] = [];
      sessionsByGame[s.game_id].push(s);
    }

    return games.map((game) => {
      const gameSessions = sessionsByGame[game.id] || [];
      return {
        id: game.id,
        slug: game.slug,
        title: game.title,
        subject: game.subject_id,
        ano_letivo: game.ano_letivo,
        max_score: game.max_score || 100,
        cover_url: game.cover_url || null,
        created_at: game.created_at || null,
        accessCount: gameSessions.length,
        sessions: gameSessions,
      };
    });
  }, [games, filteredGameSessions]);

  /** Games table ordered by the clicked column. */
  const sortedGamesTableData = useMemo(() => {
    const dir = gameSortDir === "asc" ? 1 : -1;
    return gamesTableData.slice().sort((a, b) => {
      if (gameSortField === "created_at") {
        const da = a.created_at ? new Date(a.created_at).getTime() : 0;
        const db = b.created_at ? new Date(b.created_at).getTime() : 0;
        return (da - db) * dir;
      }
      if (gameSortField === "title") {
        return (a.title || "").localeCompare(b.title || "") * dir;
      }
      if (gameSortField === "subject") {
        const na = getSubject(a.subject)?.name || a.subject || "";
        const nb = getSubject(b.subject)?.name || b.subject || "";
        return na.localeCompare(nb) * dir;
      }
      return 0;
    });
  }, [gamesTableData, gameSortField, gameSortDir]);

  /** Accesses for the selected game (modal data). */
  const gameAccessesData = useMemo(() => {
    if (!selectedGameAccesses) return null;
    return selectedGameAccesses.sessions.map((s) => ({
      sessionId: s.id,
      childId: s.child_id,
      childName: childMap[s.child_id] || "Estudante",
      score: s.score || 0,
      max_score: s.max_score || selectedGameAccesses.max_score,
      score_pct: Number(s.score_pct) || 0,
      time_spent_seconds: s.time_spent_seconds || 0,
      completed_at: s.completed_at,
      details: s.details && typeof s.details === "object" ? s.details : null,
    }));
  }, [selectedGameAccesses, childMap]);

  const uniqueGrades = useMemo(() => {
    return Array.from(new Set(exerciseLists.map((l) => l.ano_letivo).filter(Boolean)));
  }, [exerciseLists]);

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

  /**
   * One row per published material, with its access events grouped by child.
   * A material with no events at all is still listed, as pending.
   */
  const materialReport = useMemo(() => {
    // Group access events by material, then by child
    const byMaterial = {};
    for (const acc of filteredMaterialAccesses) {
      let entry = byMaterial[acc.material_id];
      if (!entry) {
        entry = { accessCount: 0, byChild: {} };
        byMaterial[acc.material_id] = entry;
      }
      entry.accessCount += 1;

      let child = entry.byChild[acc.child_id];
      if (!child) {
        child = {
          childId: acc.child_id,
          childName: childMap[acc.child_id] || "Estudante",
          viewCount: 0,
          downloadCount: 0,
          firstAccess: acc.created_at,
          lastAccess: acc.created_at,
          events: [],
        };
        entry.byChild[acc.child_id] = child;
      }
      if (acc.action === "view") child.viewCount += 1;
      if (acc.action === "download") child.downloadCount += 1;
      if (acc.created_at < child.firstAccess) child.firstAccess = acc.created_at;
      if (acc.created_at > child.lastAccess) child.lastAccess = acc.created_at;
      child.events.push({ action: acc.action, created_at: acc.created_at });
    }

    return materials.map((mat) => {
      const entry = byMaterial[mat.id];
      const childAccesses = entry
        ? Object.values(entry.byChild)
            .map((c) => ({
              ...c,
              events: c.events.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
            }))
            .sort((a, b) => (a.lastAccess < b.lastAccess ? 1 : -1))
        : [];

      return {
        id: mat.id,
        title: mat.title || "Material de Apoio",
        subjectId: mat.subject_id || "geral",
        category: mat.category || "apostila",
        mediaType: mat.media_type || "document",
        fileSize: mat.file_size || 0,
        created_at: mat.created_at || null,
        accessCount: entry?.accessCount || 0,
        childCount: childAccesses.length,
        childAccesses,
      };
    });
  }, [filteredMaterialAccesses, childMap, materials]);

  /** Materials filtered by access status, then ordered by the clicked column. */
  const filteredMaterialReport = useMemo(() => {
    const dir = materialSortDir === "asc" ? 1 : -1;
    return materialReport
      .filter((item) => {
        if (materialFilterStatus === "viewed") return item.accessCount > 0;
        if (materialFilterStatus === "not_viewed") return item.accessCount === 0;
        return true;
      })
      .sort((a, b) => {
        if (materialSortField === "created_at") {
          const da = a.created_at ? new Date(a.created_at).getTime() : 0;
          const db = b.created_at ? new Date(b.created_at).getTime() : 0;
          return (da - db) * dir;
        }
        if (materialSortField === "title") {
          return (a.title || "").localeCompare(b.title || "") * dir;
        }
        if (materialSortField === "subject") {
          const na = getSubject(a.subjectId)?.name || a.subjectId || "";
          const nb = getSubject(b.subjectId)?.name || b.subjectId || "";
          return na.localeCompare(nb) * dir;
        }
        if (materialSortField === "mediaType") {
          return (a.mediaType || "").localeCompare(b.mediaType || "") * dir;
        }
        return 0;
      });
  }, [materialReport, materialFilterStatus, materialSortField, materialSortDir]);

  /** Per-child accesses for the selected material (modal data). */
  const materialAccessesData = useMemo(() => {
    if (!selectedMaterialAccesses) return null;
    return selectedMaterialAccesses.childAccesses;
  }, [selectedMaterialAccesses]);

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
            Acompanhe a evolução, status de cada lista de exercícios, minijogos e materiais consumidos.
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

          {/* Nav Tabs within Dashboard */}
          <div className="flex flex-wrap rounded-2xl bg-white/80 p-1.5 shadow-sm ring-1 ring-black/5">
            <button
              onClick={() => setActiveTab("performance")}
              className={cn(
                "press flex flex-1 min-w-[130px] items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition sm:text-sm",
                activeTab === "performance"
                  ? "bg-candy text-white shadow-md"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              <BarChart3 className="h-4 w-4" /> Desempenho Geral
            </button>
            <button
              onClick={() => setActiveTab("lists")}
              className={cn(
                "press flex flex-1 min-w-[130px] items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition sm:text-sm",
                activeTab === "lists"
                  ? "bg-candy text-white shadow-md"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              <ListChecks className="h-4 w-4" /> Lista de Exercícios ({distinctDoneListsCount}/{totalPublishedLists})
            </button>
            <button
              onClick={() => setActiveTab("games")}
              className={cn(
                "press flex flex-1 min-w-[130px] items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition sm:text-sm",
                activeTab === "games"
                  ? "bg-candy text-white shadow-md"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              <Gamepad2 className="h-4 w-4" /> Minijogos ({filteredGameSessions.length})
            </button>
            <button
              onClick={() => setActiveTab("materials")}
              className={cn(
                "press flex flex-1 min-w-[130px] items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition sm:text-sm",
                activeTab === "materials"
                  ? "bg-candy text-white shadow-md"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              <FolderDown className="h-4 w-4" /> Materiais ({materialReport.length})
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={cn(
                "press flex flex-1 min-w-[130px] items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition sm:text-sm",
                activeTab === "timeline"
                  ? "bg-candy text-white shadow-md"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              <Activity className="h-4 w-4" /> Linha do Tempo
            </button>
          </div>

          {/* Quick Metrics Cards — only on Desempenho tab */}
          {activeTab === "performance" && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Card className="flex flex-col items-center justify-center p-5 text-center">
                <div className="mb-2 grid h-10 w-10 place-items-center rounded-2xl bg-lilac/10 text-lilac">
                  <ListChecks className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <span className="text-xs font-bold text-ink-soft">Listas Feitas vs Total</span>
                <p className="mt-1 font-display text-3xl font-bold text-lilac sm:text-4xl">
                  {distinctDoneListsCount} <span className="text-lg text-ink-soft">/ {totalPublishedLists}</span>
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
                <div className="mb-2 grid h-10 w-10 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600">
                  <Gamepad2 className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <span className="text-xs font-bold text-ink-soft">Minijogos Jogados</span>
                <p className="mt-1 font-display text-3xl font-bold text-indigo-600 sm:text-4xl">
                  {distinctPlayedGamesCount} <span className="text-lg text-ink-soft">/ {totalPublishedGames}</span>
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
          )}

          {/* Loading Indicator */}
          {isLoadingData ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <span className="h-12 w-12 animate-spin rounded-full border-4 border-candy/25 border-t-candy" />
            </div>
          ) : (
            <>
              {/* ==================== TAB 1: DESEMPENHO GERAL & GRÁFICOS ==================== */}
              {activeTab === "performance" && (
                <div className="space-y-6">
                  {/* ---------- Commitment hero ---------- */}
                  <Card className="overflow-hidden p-0">
                    <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
                      {/* Radial gauge */}
                      <div className="relative mx-auto grid h-40 w-40 shrink-0 place-items-center sm:mx-0">
                        <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90">
                          <circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke="rgba(15,23,42,.07)"
                            strokeWidth="13"
                          />
                          <motion.circle
                            cx="60"
                            cy="60"
                            r="52"
                            fill="none"
                            stroke={commitment.hex}
                            strokeWidth="13"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 52}
                            initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                            animate={{
                              strokeDashoffset: 2 * Math.PI * 52 * (1 - commitment.score / 100),
                            }}
                            transition={{ duration: 0.9, ease: "easeOut" }}
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span
                            className="font-display text-4xl font-bold leading-none"
                            style={{ color: commitment.hex }}
                          >
                            {commitment.score}
                          </span>
                          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-soft">
                            de 100
                          </span>
                        </div>
                      </div>

                      {/* Score breakdown */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
                            <Award className="h-5 w-5 text-lilac" strokeWidth={2.5} />
                            Comprometimento
                          </h3>
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white shadow-sm"
                            style={{ backgroundColor: commitment.hex }}
                          >
                            {commitment.label}
                          </span>
                        </div>
                        <p className="mb-4 text-xs text-ink-soft sm:text-sm">{commitment.advice}</p>

                        <div className="space-y-2.5">
                          {[
                            {
                              icon: <Flame className="h-3.5 w-3.5" />,
                              name: "Regularidade",
                              value: commitment.consistency,
                              hint: `${activeDays30} de 30 dias com atividade`,
                              color: "#f59e0b",
                            },
                            {
                              icon: <Layers className="h-3.5 w-3.5" />,
                              name: "Cobertura do conteúdo",
                              value: commitment.coverage,
                              hint: `${grandTotalActivitiesDone} de ${totalActivitiesCatalog} atividades`,
                              color: "#A370FF",
                            },
                            {
                              icon: <Target className="h-3.5 w-3.5" />,
                              name: "Aproveitamento",
                              value: commitment.accuracy,
                              hint: `${totalCorrect} acertos em ${totalQuestions} questões`,
                              color: "#10b981",
                            },
                          ].map((row) => (
                            <div key={row.name}>
                              <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                                <span
                                  className="flex items-center gap-1.5 font-bold"
                                  style={{ color: row.color }}
                                >
                                  {row.icon}
                                  {row.name}
                                </span>
                                <span className="shrink-0 text-ink-soft">
                                  <strong className="text-ink">{row.value}%</strong> &middot; {row.hint}
                                </span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: row.color }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${row.value}%` }}
                                  transition={{ duration: 0.7, ease: "easeOut" }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Streak strip */}
                    <div className="grid grid-cols-2 divide-x divide-lilac/10 border-t border-lilac/10 bg-white/60 sm:grid-cols-4">
                      <div className="p-4 text-center">
                        <span className="flex items-center justify-center gap-1 text-[11px] font-bold text-ink-soft">
                          <Flame className="h-3.5 w-3.5 text-amber-500" /> Sequência atual
                        </span>
                        <p className="mt-0.5 font-display text-xl font-bold text-ink">
                          {streaks.current} {streaks.current === 1 ? "dia" : "dias"}
                        </p>
                      </div>
                      <div className="p-4 text-center">
                        <span className="flex items-center justify-center gap-1 text-[11px] font-bold text-ink-soft">
                          <Trophy className="h-3.5 w-3.5 text-lilac" /> Melhor sequência
                        </span>
                        <p className="mt-0.5 font-display text-xl font-bold text-ink">
                          {streaks.longest} {streaks.longest === 1 ? "dia" : "dias"}
                        </p>
                      </div>
                      <div className="p-4 text-center">
                        <span className="flex items-center justify-center gap-1 text-[11px] font-bold text-ink-soft">
                          <CalendarDays className="h-3.5 w-3.5 text-sky" /> Esta semana
                        </span>
                        <p className="mt-0.5 font-display text-xl font-bold text-ink">
                          {activeDays7}/7 dias
                        </p>
                      </div>
                      <div className="p-4 text-center">
                        <span className="flex items-center justify-center gap-1 text-[11px] font-bold text-ink-soft">
                          <Clock className="h-3.5 w-3.5 text-candy" /> Última atividade
                        </span>
                        <p className="mt-0.5 font-display text-xl font-bold text-ink">
                          {daysSinceLastActivity === null
                            ? "—"
                            : daysSinceLastActivity === 0
                            ? "Hoje"
                            : daysSinceLastActivity === 1
                            ? "Ontem"
                            : `${daysSinceLastActivity} dias`}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* ---------- Study rhythm: 30-day activity ---------- */}
                  <Card className="p-6">
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                          <Activity className="h-5 w-5 text-candy" strokeWidth={2.5} />
                          Ritmo de Estudo — últimos 30 dias
                        </h3>
                        <p className="text-xs text-ink-soft sm:text-sm">
                          Cada barra é um dia. Barras espalhadas de forma regular indicam rotina;
                          vazios longos indicam que o estudo parou.
                        </p>
                      </div>
                      <span className="shrink-0 self-start rounded-full bg-candy-soft px-3 py-1 text-xs font-bold text-[#b03b6e] sm:self-auto">
                        {activeDays30} dias ativos
                      </span>
                    </div>

                    {peakDayCount === 0 ? (
                      <div className="py-10 text-center">
                        <div className="mb-2 text-4xl">🌱</div>
                        <p className="font-display text-base font-bold text-ink">
                          Nenhuma atividade nos últimos 30 dias.
                        </p>
                        <p className="mt-1 text-xs text-ink-soft">
                          Assim que a criança fizer uma lista, jogar ou abrir um material, o ritmo aparece aqui.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex h-28 items-end gap-[3px]">
                          {activityDays.map((d) => {
                            const ratio = peakDayCount > 0 ? d.count / peakDayCount : 0;
                            const isToday = d.key === dayKey(new Date());
                            return (
                              <div
                                key={d.key}
                                className="group relative flex h-full flex-1 flex-col justify-end"
                                title={`${d.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} — ${d.count} ${d.count === 1 ? "atividade" : "atividades"}`}
                              >
                                <motion.div
                                  className={cn(
                                    "w-full rounded-t-[4px] rounded-b-sm transition-colors",
                                    d.count === 0
                                      ? "bg-slate-200/70"
                                      : ratio > 0.66
                                      ? "bg-gradient-to-t from-lilac to-candy"
                                      : ratio > 0.33
                                      ? "bg-gradient-to-t from-sky to-lilac"
                                      : "bg-gradient-to-t from-mint to-sky",
                                    isToday && "ring-2 ring-candy ring-offset-1"
                                  )}
                                  initial={{ height: 2 }}
                                  animate={{
                                    height: d.count === 0 ? 4 : `${Math.max(10, ratio * 100)}%`,
                                  }}
                                  transition={{ duration: 0.5, ease: "easeOut" }}
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* Weekday ruler */}
                        <div className="mt-1.5 flex gap-[3px]">
                          {activityDays.map((d) => (
                            <span
                              key={`lbl-${d.key}`}
                              className="flex-1 text-center text-[8px] font-bold text-ink-soft/60"
                            >
                              {WEEKDAY_INITIALS[d.date.getDay()]}
                            </span>
                          ))}
                        </div>

                        {/* Legend */}
                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-lilac/10 pt-3 text-[11px] font-semibold text-ink-soft">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm bg-slate-200" /> Sem atividade
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-mint to-sky" /> Leve
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-sky to-lilac" /> Moderado
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-t from-lilac to-candy" /> Intenso
                          </span>
                          <span className="ml-auto">Pico: {peakDayCount} atividades em um dia</span>
                        </div>
                      </>
                    )}
                  </Card>

                  {/* ---------- Weekly evolution + catalog coverage ---------- */}
                  <div className="grid gap-6 lg:grid-cols-5">
                    {/* Weekly combo chart */}
                    <Card className="p-6 lg:col-span-3">
                      <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                        <TrendingUp className="h-5 w-5 text-mint" strokeWidth={2.5} />
                        Evolução Semanal
                      </h3>
                      <p className="mb-5 text-xs text-ink-soft sm:text-sm">
                        Barras = listas resolvidas por semana. Linha = aproveitamento (%).
                      </p>

                      {!weeklyChart.hasData ? (
                        <div className="py-10 text-center text-sm text-ink-soft">
                          Nenhuma lista resolvida nas últimas 8 semanas.
                        </div>
                      ) : (
                        <>
                          <svg
                            viewBox={`0 0 ${weeklyChart.W} ${weeklyChart.H}`}
                            className="h-36 w-full overflow-visible"
                            preserveAspectRatio="none"
                          >
                            {/* Reference grid at 50% and 100% accuracy */}
                            {[0, 50, 100].map((pct) => (
                              <line
                                key={pct}
                                x1="0"
                                x2={weeklyChart.W}
                                y1={weeklyChart.H - (pct / 100) * weeklyChart.H}
                                y2={weeklyChart.H - (pct / 100) * weeklyChart.H}
                                stroke="rgba(15,23,42,.08)"
                                strokeWidth="1"
                                strokeDasharray={pct === 0 ? "0" : "4 4"}
                              />
                            ))}

                            {/* Volume bars */}
                            {weeklyChart.bars.map((b) => (
                              <rect
                                key={`bar-${b.label}`}
                                x={b.x}
                                y={b.y}
                                width={b.width}
                                height={b.height}
                                rx="3"
                                fill="rgba(163,112,255,.22)"
                              />
                            ))}

                            {/* Accuracy line */}
                            {weeklyChart.line && (
                              <motion.polyline
                                points={weeklyChart.line}
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.9, ease: "easeOut" }}
                                vectorEffect="non-scaling-stroke"
                              />
                            )}

                            {/* Accuracy points */}
                            {weeklyChart.bars
                              .filter((b) => b.cy !== null)
                              .map((b) => (
                                <circle
                                  key={`pt-${b.label}`}
                                  cx={b.cx}
                                  cy={b.cy}
                                  r="3.5"
                                  fill="#fff"
                                  stroke="#10b981"
                                  strokeWidth="2.5"
                                  vectorEffect="non-scaling-stroke"
                                />
                              ))}
                          </svg>

                          <div className="mt-2 flex">
                            {weeklyChart.bars.map((b) => (
                              <div key={`wl-${b.label}`} className="flex-1 text-center">
                                <span className="block text-[9px] font-bold text-ink-soft">{b.label}</span>
                                <span className="block text-[10px] font-bold text-ink">
                                  {b.rate === null ? "—" : `${b.rate}%`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </Card>

                    {/* Catalog coverage donut */}
                    <Card className="p-6 lg:col-span-2">
                      <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                        <PieChart className="h-5 w-5 text-lilac" strokeWidth={2.5} />
                        Cobertura do Catálogo
                      </h3>
                      <p className="mb-4 text-xs text-ink-soft sm:text-sm">
                        Quanto do conteúdo disponível já foi consumido.
                      </p>

                      <div className="relative mx-auto mb-4 grid h-36 w-36 place-items-center">
                        <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90">
                          <circle
                            cx="60"
                            cy="60"
                            r="48"
                            fill="none"
                            stroke="rgba(15,23,42,.07)"
                            strokeWidth="16"
                          />
                          <motion.circle
                            cx="60"
                            cy="60"
                            r="48"
                            fill="none"
                            stroke="#A370FF"
                            strokeWidth="16"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 48}
                            initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                            animate={{
                              strokeDashoffset: 2 * Math.PI * 48 * (1 - overallCompletionRate / 100),
                            }}
                            transition={{ duration: 0.9, ease: "easeOut" }}
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="font-display text-3xl font-bold text-lilac">
                            {overallCompletionRate}%
                          </span>
                          <span className="text-[10px] font-bold text-ink-soft">
                            {grandTotalActivitiesDone}/{totalActivitiesCatalog}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {[
                          {
                            icon: <ListChecks className="h-3.5 w-3.5" />,
                            name: "Listas",
                            done: distinctDoneListsCount,
                            total: totalPublishedLists,
                            color: "#A370FF",
                          },
                          {
                            icon: <Gamepad2 className="h-3.5 w-3.5" />,
                            name: "Minijogos",
                            done: distinctPlayedGamesCount,
                            total: totalPublishedGames,
                            color: "#6366F1",
                          },
                          {
                            icon: <FolderDown className="h-3.5 w-3.5" />,
                            name: "Materiais",
                            done: distinctViewedMaterialsCount,
                            total: totalPublishedMaterials,
                            color: "#4CC9F0",
                          },
                        ].map((row) => {
                          const pct = row.total > 0 ? Math.round((row.done / row.total) * 100) : 0;
                          return (
                            <div key={row.name}>
                              <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
                                <span className="flex items-center gap-1.5" style={{ color: row.color }}>
                                  {row.icon}
                                  {row.name}
                                </span>
                                <span className="text-ink-soft">
                                  {row.done}/{row.total} ({pct}%)
                                </span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: row.color }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.7, ease: "easeOut" }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  </div>

                  {/* ---------- Subject performance + attention points ---------- */}
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="p-6">
                      <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                        <BookOpen className="h-5 w-5 text-lilac" strokeWidth={2.5} />
                        Aproveitamento por Matéria
                      </h3>
                      <p className="mb-5 text-xs text-ink-soft sm:text-sm">
                        Onde a criança vai bem e onde precisa de apoio.
                      </p>

                      {subjectStats.length === 0 ? (
                        <div className="py-10 text-center text-sm text-ink-soft">
                          Nenhum dado por matéria disponível.
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {subjectStats
                            .slice()
                            .sort((a, b) => b.rate - a.rate)
                            .map((sub) => (
                              <div key={sub.subjectId}>
                                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                                  <span className="flex min-w-0 items-center gap-1.5 font-bold text-ink">
                                    <span className="shrink-0">{sub.emoji}</span>
                                    <span className="truncate">{sub.name}</span>
                                  </span>
                                  <span className="flex shrink-0 items-center gap-2">
                                    <span className="text-[10px] font-semibold text-ink-soft">
                                      {sub.completedCount}{" "}
                                      {sub.completedCount === 1 ? "lista" : "listas"}
                                    </span>
                                    <span
                                      className={cn(
                                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                                        sub.rate >= 70
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-amber-100 text-amber-800"
                                      )}
                                    >
                                      {sub.rate}%
                                    </span>
                                  </span>
                                </div>
                                <div className="h-3 w-full overflow-hidden rounded-full bg-black/5 p-0.5">
                                  <motion.div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: sub.hex }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${sub.rate}%` }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                  />
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </Card>

                    <Card className="p-6">
                      <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                        <AlertTriangle className="h-5 w-5 text-candy" strokeWidth={2.5} />
                        Pontos de Atenção
                      </h3>
                      <p className="mb-5 text-xs text-ink-soft sm:text-sm">
                        O que merece uma conversa ou uma nova tentativa.
                      </p>

                      <div className="space-y-2.5">
                        {/* Inactivity warning */}
                        {daysSinceLastActivity !== null && daysSinceLastActivity >= 3 && (
                          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                            <div>
                              <p className="text-xs font-bold text-amber-900">
                                {daysSinceLastActivity} dias sem estudar
                              </p>
                              <p className="text-[11px] text-amber-800">
                                A última atividade foi em {formatDateTime(lastActivityAt)}.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Low streak warning */}
                        {activeDays7 === 0 && peakDayCount > 0 && (
                          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                            <div>
                              <p className="text-xs font-bold text-amber-900">
                                Nenhum estudo nesta semana
                              </p>
                              <p className="text-[11px] text-amber-800">
                                Retomar hoje evita perder o ritmo já conquistado.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Lists below 70% */}
                        {reviewTargets.map((r) => {
                          const theme = getSubject(r.subject);
                          return (
                            <div
                              key={r.key}
                              className="flex items-start gap-2.5 rounded-2xl border border-candy/15 bg-candy-soft/30 p-3"
                            >
                              <span className="mt-0.5 shrink-0 text-base">{theme?.emoji || "📖"}</span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-ink">{r.title}</p>
                                <p className="text-[11px] text-ink-soft">
                                  {r.childName} &middot; {theme?.name || r.subject} &middot;{" "}
                                  {r.wrongCount} {r.wrongCount === 1 ? "erro" : "erros"}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-[#b03b6e] shadow-sm">
                                {r.pct}%
                              </span>
                            </div>
                          );
                        })}

                        {/* All clear */}
                        {reviewTargets.length === 0 &&
                          !(daysSinceLastActivity !== null && daysSinceLastActivity >= 3) &&
                          !(activeDays7 === 0 && peakDayCount > 0) && (
                            <div className="py-8 text-center">
                              <div className="mb-2 text-4xl">🌟</div>
                              <p className="font-display text-base font-bold text-mint">
                                Nenhum ponto de atenção!
                              </p>
                              <p className="mt-1 text-xs text-ink-soft">
                                Rotina em dia e nenhuma lista abaixo de 70%.
                              </p>
                            </div>
                          )}
                      </div>
                    </Card>
                  </div>

                  {/* ---------- Per-child comparison ---------- */}
                  {selectedChildId === "all" && childEngagement.length > 1 && (
                    <Card className="p-6">
                      <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                        <Users className="h-5 w-5 text-lilac" strokeWidth={2.5} />
                        Comparativo entre Filhos
                      </h3>
                      <p className="mb-5 text-xs text-ink-soft sm:text-sm">
                        Score de comprometimento de cada criança nos últimos 30 dias.
                      </p>

                      <div className="space-y-3">
                        {childEngagement.map((c, idx) => (
                          <div
                            key={c.childId}
                            className={cn(
                              "rounded-2xl border p-4",
                              idx === 0
                                ? "border-lilac/30 bg-lilac/5"
                                : "border-lilac/10 bg-white/70",
                              !c.active && "opacity-60"
                            )}
                          >
                            <div className="mb-2.5 flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-2.5">
                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lilac/15 text-sm font-bold text-lilac">
                                  {c.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="flex items-center gap-1.5 truncate text-sm font-bold text-ink">
                                    {c.name}
                                    {idx === 0 && c.score > 0 && (
                                      <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                                    )}
                                  </p>
                                  <p className="text-[10px] text-ink-soft">
                                    {c.activeDays} dias ativos &middot; {c.doneLists} listas &middot;{" "}
                                    {c.games} jogos &middot; {c.materials} materiais
                                  </p>
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="font-display text-2xl font-bold leading-none text-lilac">
                                  {c.score}
                                </p>
                                <span className="text-[10px] font-bold text-ink-soft">score</span>
                              </div>
                            </div>

                            <div className="h-2 w-full overflow-hidden rounded-full bg-black/5">
                              <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-mint via-sky to-lilac"
                                initial={{ width: 0 }}
                                animate={{ width: `${c.score}%` }}
                                transition={{ duration: 0.7, ease: "easeOut" }}
                              />
                            </div>

                            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold text-ink-soft">
                              <span>
                                Aproveitamento:{" "}
                                <strong
                                  className={c.accuracy >= 70 ? "text-emerald-700" : "text-amber-700"}
                                >
                                  {c.accuracy}%
                                </strong>
                              </span>
                              <span>
                                Estrelas: <strong className="text-[#d49911]">{c.points} ⭐</strong>
                              </span>
                              <span>
                                Questões: <strong className="text-ink">{c.answered}</strong>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              )}


              {/* ==================== TAB 2: LISTA DE EXERCÍCIOS (TABLE FEITAS VS NÃO FEITAS) ==================== */}
              {activeTab === "lists" && (
                <Card className="p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
                        <ListChecks className="h-5 w-5 text-lilac" strokeWidth={2.5} />
                        Status de Conclusão das Listas de Exercícios
                      </h3>
                      <p className="text-xs text-ink-soft sm:text-sm">
                        Confira abaixo todas as listas publicadas e saiba exatamente quais o seu filho já fez ou ainda não fez.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                        {distinctDoneListsCount} Concluídas
                      </span>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                        {pendingListsCount} Pendentes
                      </span>
                    </div>
                  </div>

                  {/* Filter controls */}
                  <div className="clay-sm flex flex-col gap-3 bg-white/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                        <Filter className="h-3.5 w-3.5 text-lilac" /> Filtrar Listas:
                      </span>

                      {(listSearchTitle || listFilterSubject || listFilterAccess !== "all" || listFilterGrade) && (
                        <button
                          onClick={() => {
                            setListSearchTitle("");
                            setListFilterSubject("");
                            setListFilterAccess("all");
                            setListFilterGrade("");
                          }}
                          className="press rounded-xl bg-candy-soft px-3 py-1 text-xs font-bold text-[#b03b6e]"
                        >
                          <X className="mr-1 inline h-3 w-3" /> Limpar Filtros
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                      {/* Subject */}
                      <select
                        value={listFilterSubject}
                        onChange={(e) => setListFilterSubject(e.target.value)}
                        className="rounded-xl border border-lilac/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink outline-none focus:border-lilac"
                      >
                        <option value="">Todas as Matérias</option>
                        {Array.from(new Set(exerciseLists.map((l) => l.subject))).map((subjId) => {
                          const theme = getSubject(subjId);
                          return (
                            <option key={subjId} value={subjId}>
                              {theme?.emoji || "📖"} {theme?.name || subjId}
                            </option>
                          );
                        })}
                      </select>

                      {/* Search */}
                      <input
                        type="text"
                        placeholder="Buscar por nome da lista..."
                        value={listSearchTitle}
                        onChange={(e) => setListSearchTitle(e.target.value)}
                        className="rounded-xl border border-lilac/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink outline-none focus:border-lilac"
                      />

                      {/* Grade */}
                      <select
                        value={listFilterGrade}
                        onChange={(e) => setListFilterGrade(e.target.value)}
                        className="rounded-xl border border-lilac/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink outline-none focus:border-lilac"
                      >
                        <option value="">Todas as Séries</option>
                        {uniqueGrades.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>

                      {/* Access filter */}
                      <select
                        value={listFilterAccess}
                        onChange={(e) => setListFilterAccess(e.target.value)}
                        className="rounded-xl border border-lilac/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink outline-none focus:border-lilac"
                      >
                        <option value="all">Todos os Acessos</option>
                        <option value="accessed">✅ Acessados</option>
                        <option value="pending">⏳ Pendentes</option>
                      </select>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-hidden rounded-2xl border border-lilac/15 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs font-bold text-ink">
                          <tr>
                            <th className="px-4 py-3 text-center cursor-pointer select-none hover:text-lilac transition" onClick={() => { setListSortField("created_at"); setListSortDir((d) => d === "asc" ? "desc" : "asc"); }}>
                              Data Criação {listSortField === "created_at" && (listSortDir === "asc" ? "↑" : "↓")}
                            </th>
                            <th className="px-4 py-3 text-left">Matéria</th>
                            <th className="px-4 py-3 text-left cursor-pointer select-none hover:text-lilac transition" onClick={() => { setListSortField("title"); setListSortDir((d) => d === "asc" ? "desc" : "asc"); }}>
                              Título {listSortField === "title" && (listSortDir === "asc" ? "↑" : "↓")}
                            </th>
                            <th className="px-4 py-3 text-center cursor-pointer select-none hover:text-lilac transition" onClick={() => { setListSortField("question_count"); setListSortDir((d) => d === "asc" ? "desc" : "asc"); }}>
                              Questões {listSortField === "question_count" && (listSortDir === "asc" ? "↑" : "↓")}
                            </th>
                            <th className="px-4 py-3 text-center">Acessos</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredListsTableData.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="px-4 py-8 text-center text-ink-soft text-xs">
                                Nenhuma lista encontrada com os filtros selecionados.
                              </td>
                            </tr>
                          ) : (
                            filteredListsTableData.map((item) => {
                              const theme = getSubject(item.subject);
                              return (
                                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                  <td className="px-4 py-3 text-center text-xs text-ink-soft font-semibold">
                                    {item.created_at ? formatDateTime(item.created_at) : "—"}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-lilac/10 px-2.5 py-0.5 text-xs font-bold text-lilac">
                                      <span>{theme?.emoji || "📖"}</span>
                                      <span>{theme?.name || item.subject}</span>
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <p className="font-bold text-ink line-clamp-1">{item.title}</p>
                                    <span className="text-[11px] text-ink-soft">
                                      {item.ano_letivo || "Ensino Fundamental"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center text-xs font-bold text-ink">
                                    {item.question_count || 0}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {item.accessCount > 0 ? (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedListAccesses(item); }}
                                        className="press inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-lilac/15 px-3 py-1.5 text-xs font-bold text-lilac hover:bg-lilac/25 transition"
                                      >
                                        <Eye className="h-3.5 w-3.5 shrink-0" />
                                        <span className="whitespace-nowrap">Ver acessos ({item.accessCount})</span>
                                      </button>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                                        <CircleDashed className="h-3.5 w-3.5" />
                                        Pendente
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              )}

              {/* Acessos Modal — list of sessions for a list */}
              <AnimatePresence>
                {selectedListAccesses && listAccessesData && (
                  <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-md p-3 sm:p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => { setSelectedListAccesses(null); setSelectedSessionDetail(null); }}
                  >
                    <motion.div
                      className="clay relative flex max-h-[90vh] w-full max-w-2xl flex-col bg-cream/95 p-0 overflow-hidden shadow-2xl"
                      initial={{ scale: 0.94, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.94, y: 20 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between gap-3 border-b border-lilac/15 bg-white/80 px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl shadow-sm"
                            style={{ backgroundColor: `${getSubject(selectedListAccesses.subject)?.hex || "#A370FF"}25` }}
                          >
                            {getSubject(selectedListAccesses.subject)?.emoji || "📖"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-display text-lg font-bold text-ink truncate">
                              {selectedListAccesses.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                              <span>{getSubject(selectedListAccesses.subject)?.name || selectedListAccesses.subject}</span>
                              <span>&middot;</span>
                              <span>{selectedListAccesses.ano_letivo || "Ensino Fundamental"}</span>
                              <span>&middot;</span>
                              <span>{selectedListAccesses.question_count || 0} questões</span>
                              <span>&middot;</span>
                              <span>{listAccessesData.length} {listAccessesData.length === 1 ? "acesso" : "acessos"}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => { setSelectedListAccesses(null); setSelectedSessionDetail(null); }}
                          className="press grid h-9 w-9 place-items-center rounded-full bg-candy-soft text-[#b03b6e] shadow-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Body */}
                      <div className="flex-1 overflow-y-auto p-5 space-y-3">
                        {listAccessesData.map((acc) => (
                          <div key={acc.sessionId}>
                            <button
                              onClick={() => setSelectedSessionDetail(selectedSessionDetail?.sessionId === acc.sessionId ? null : acc)}
                              className={cn(
                                "w-full flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition hover:shadow-md",
                                selectedSessionDetail?.sessionId === acc.sessionId
                                  ? "border-lilac bg-lilac/5"
                                  : "border-lilac/15 bg-white"
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lilac/15 text-sm font-bold text-lilac">
                                  {acc.childName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-ink text-sm">{acc.childName}</p>
                                  <p className="text-[10px] text-ink-soft">{formatDateTime(acc.completed_at)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                                  acc.pct >= 70 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                )}>
                                  {acc.pct >= 70 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}
                                  {acc.pct}%
                                </span>
                                <span className="text-xs text-ink-soft font-semibold">
                                  ({acc.correct_count}/{acc.total_questions})
                                </span>
                                {acc.wrong_details.length > 0 && (
                                  <ChevronRight className={cn(
                                    "h-4 w-4 text-ink-soft transition-transform",
                                    selectedSessionDetail?.sessionId === acc.sessionId && "rotate-90"
                                  )} />
                                )}
                              </div>
                            </button>

                            {/* Inline errors expansion */}
                            <AnimatePresence>
                              {selectedSessionDetail?.sessionId === acc.sessionId && acc.wrong_details.length > 0 && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="space-y-2 px-2 pt-2 pb-1">
                                    {sessionErrorsData?.map((err, i) => (
                                      <div key={i} className="rounded-xl bg-candy-soft/30 border border-candy/10 p-3">
                                        <p className="text-xs font-semibold text-ink line-clamp-2 mb-1.5">
                                          {err.question}
                                        </p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                                          <span className="text-red-600 font-semibold">
                                            ✗ Marcada: {err.selected || "—"}
                                          </span>
                                          <span className="text-emerald-700 font-semibold">
                                            ✓ Correta: {err.correct || "—"}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                              {selectedSessionDetail?.sessionId === acc.sessionId && acc.wrong_details.length === 0 && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-2 pt-2 pb-1">
                                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center">
                                      <span className="text-xs font-bold text-emerald-700">🎉 Sem erros — desempenho perfeito!</span>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ==================== TAB 3: MINIJOGOS EDUCATIVOS ==================== */}
              {activeTab === "games" && (
                <Card className="p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
                        <Gamepad2 className="h-5 w-5 text-indigo-600" strokeWidth={2.5} />
                        Minijogos Educativos
                      </h3>
                      <p className="text-xs text-ink-soft sm:text-sm">
                        Todos os minijogos publicados. Clique em “Ver acessos” para ver quem jogou e como foi.
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                        {distinctPlayedGamesCount} Jogados
                      </span>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                        {pendingGamesCount} Pendentes
                      </span>
                    </div>
                  </div>

                  {sortedGamesTableData.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="mb-2 text-4xl">🎮</div>
                      <p className="font-display text-lg font-bold text-ink">
                        Nenhum minijogo publicado ainda.
                      </p>
                      <p className="mt-1 text-xs text-ink-soft">
                        Quando um minijogo for publicado, ele aparecerá aqui com o histórico de partidas.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-lilac/15 bg-white shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-xs font-bold text-ink">
                            <tr>
                              <th
                                className="px-4 py-3 text-center cursor-pointer select-none transition hover:text-lilac"
                                onClick={() => { setGameSortField("created_at"); setGameSortDir((d) => (d === "asc" ? "desc" : "asc")); }}
                              >
                                Data Criação {gameSortField === "created_at" && (gameSortDir === "asc" ? "↑" : "↓")}
                              </th>
                              <th
                                className="px-4 py-3 text-left cursor-pointer select-none transition hover:text-lilac"
                                onClick={() => { setGameSortField("subject"); setGameSortDir((d) => (d === "asc" ? "desc" : "asc")); }}
                              >
                                Matéria {gameSortField === "subject" && (gameSortDir === "asc" ? "↑" : "↓")}
                              </th>
                              <th
                                className="px-4 py-3 text-left cursor-pointer select-none transition hover:text-lilac"
                                onClick={() => { setGameSortField("title"); setGameSortDir((d) => (d === "asc" ? "desc" : "asc")); }}
                              >
                                Jogo {gameSortField === "title" && (gameSortDir === "asc" ? "↑" : "↓")}
                              </th>
                              <th className="px-4 py-3 text-center">Capa</th>
                              <th className="px-4 py-3 text-center">Acessos</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {sortedGamesTableData.map((item) => {
                              const theme = getSubject(item.subject);
                              return (
                                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                  <td className="px-4 py-3 text-center text-xs font-semibold text-ink-soft">
                                    {item.created_at ? formatDateTime(item.created_at) : "—"}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-lilac/10 px-2.5 py-0.5 text-xs font-bold text-lilac">
                                      <span>{theme?.emoji || "🎮"}</span>
                                      <span>{theme?.name || item.subject}</span>
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <p className="font-bold text-ink line-clamp-1">{item.title}</p>
                                    <span className="text-[11px] text-ink-soft">
                                      {item.ano_letivo || "Ensino Fundamental"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex justify-center">
                                      {item.cover_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={item.cover_url}
                                          alt={`Capa de ${item.title}`}
                                          className="h-10 w-16 shrink-0 rounded-lg border border-slate-200 object-cover"
                                        />
                                      ) : (
                                        <span className="grid h-10 w-16 shrink-0 place-items-center rounded-lg bg-indigo-50 text-lg text-indigo-600">
                                          🎮
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {item.accessCount > 0 ? (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedGameAccesses(item); setSelectedGameSessionDetail(null); }}
                                        className="press inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-lilac/15 px-3 py-1.5 text-xs font-bold text-lilac transition hover:bg-lilac/25"
                                      >
                                        <Eye className="h-3.5 w-3.5 shrink-0" />
                                        <span className="whitespace-nowrap">Ver acessos ({item.accessCount})</span>
                                      </button>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                                        <CircleDashed className="h-3.5 w-3.5 shrink-0" />
                                        Pendente
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Game Accesses Modal — sessions for one game, with drill-down */}
              <AnimatePresence>
                {selectedGameAccesses && gameAccessesData && (
                  <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-md p-3 sm:p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => { setSelectedGameAccesses(null); setSelectedGameSessionDetail(null); }}
                  >
                    <motion.div
                      className="clay relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden bg-cream/95 p-0 shadow-2xl"
                      initial={{ scale: 0.94, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.94, y: 20 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between gap-3 border-b border-lilac/15 bg-white/80 px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          {selectedGameAccesses.cover_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={selectedGameAccesses.cover_url}
                              alt={`Capa de ${selectedGameAccesses.title}`}
                              className="h-11 w-16 shrink-0 rounded-xl border border-slate-200 object-cover shadow-sm"
                            />
                          ) : (
                            <div
                              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl shadow-sm"
                              style={{ backgroundColor: `${getSubject(selectedGameAccesses.subject)?.hex || "#6366F1"}25` }}
                            >
                              {getSubject(selectedGameAccesses.subject)?.emoji || "🎮"}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-display text-lg font-bold text-ink">
                              {selectedGameAccesses.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                              <span>{getSubject(selectedGameAccesses.subject)?.name || selectedGameAccesses.subject}</span>
                              <span>&middot;</span>
                              <span>{selectedGameAccesses.ano_letivo || "Ensino Fundamental"}</span>
                              <span>&middot;</span>
                              <span>
                                {gameAccessesData.length}{" "}
                                {gameAccessesData.length === 1 ? "acesso" : "acessos"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => { setSelectedGameAccesses(null); setSelectedGameSessionDetail(null); }}
                          className="press grid h-9 w-9 place-items-center rounded-full bg-candy-soft text-[#b03b6e] shadow-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Body */}
                      <div className="flex-1 space-y-3 overflow-y-auto p-5">
                        {gameAccessesData.map((acc) => {
                          const isOpen = selectedGameSessionDetail?.sessionId === acc.sessionId;
                          const good = acc.score_pct >= 70;
                          return (
                            <div key={acc.sessionId}>
                              <button
                                onClick={() => setSelectedGameSessionDetail(isOpen ? null : acc)}
                                className={cn(
                                  "flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition hover:shadow-md",
                                  isOpen ? "border-lilac bg-lilac/5" : "border-lilac/15 bg-white"
                                )}
                              >
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lilac/15 text-sm font-bold text-lilac">
                                    {acc.childName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-ink">{acc.childName}</p>
                                    <p className="text-[10px] text-ink-soft">{formatDateTime(acc.completed_at)}</p>
                                  </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                                      good ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                    )}
                                  >
                                    <Trophy className="h-3.5 w-3.5" />
                                    {acc.score_pct}%
                                  </span>
                                  <span className="text-xs font-semibold text-ink-soft">
                                    ({acc.score}/{acc.max_score})
                                  </span>
                                  <ChevronRight
                                    className={cn(
                                      "h-4 w-4 text-ink-soft transition-transform",
                                      isOpen && "rotate-90"
                                    )}
                                  />
                                </div>
                              </button>

                              {/* Inline detail expansion */}
                              <AnimatePresence>
                                {isOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-2 pb-1 pt-2">
                                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                        <div className="rounded-xl border border-lilac/15 bg-white p-3 text-center">
                                          <p className="mb-1 text-[10px] font-bold text-ink-soft">Pontuação</p>
                                          <p className="font-display text-lg font-bold text-ink">
                                            {acc.score}
                                            <span className="text-xs font-semibold text-ink-soft">
                                              /{acc.max_score}
                                            </span>
                                          </p>
                                        </div>
                                        <div className="rounded-xl border border-lilac/15 bg-white p-3 text-center">
                                          <p className="mb-1 text-[10px] font-bold text-ink-soft">Aproveitamento</p>
                                          <p
                                            className={cn(
                                              "font-display text-lg font-bold",
                                              good ? "text-emerald-700" : "text-amber-700"
                                            )}
                                          >
                                            {acc.score_pct}%
                                          </p>
                                        </div>
                                        <div className="rounded-xl border border-lilac/15 bg-white p-3 text-center">
                                          <p className="mb-1 text-[10px] font-bold text-ink-soft">Tempo</p>
                                          <p className="flex items-center justify-center gap-1 font-display text-lg font-bold text-ink">
                                            <Clock className="h-3.5 w-3.5 text-lilac" />
                                            {acc.time_spent_seconds > 0 ? `${acc.time_spent_seconds}s` : "—"}
                                          </p>
                                        </div>
                                        <div className="rounded-xl border border-lilac/15 bg-white p-3 text-center">
                                          <p className="mb-1 text-[10px] font-bold text-ink-soft">Acertos / Erros</p>
                                          <p className="font-display text-lg font-bold text-ink">
                                            {acc.details?.acertos ?? "—"}
                                            <span className="text-xs font-semibold text-ink-soft"> / </span>
                                            {acc.details?.erros ?? "—"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ==================== TAB 4: MATERIAIS DE APOIO ==================== */}
              {activeTab === "materials" && (
                <Card className="p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
                        <FolderDown className="h-5 w-5 text-sky" strokeWidth={2.5} />
                        Materiais de Estudo
                      </h3>
                      <p className="text-xs text-ink-soft sm:text-sm">
                        Todos os materiais publicados. Clique em “Ver acessos” para ver quem abriu ou baixou.
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                        {distinctViewedMaterialsCount} Acessados
                      </span>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                        {pendingMaterialsCount} Pendentes
                      </span>
                    </div>
                  </div>

                  {/* Filter */}
                  <div className="clay-sm flex flex-col gap-3 bg-white/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-ink">
                        <Filter className="h-3.5 w-3.5 text-lilac" /> Filtrar Materiais:
                      </span>
                      {materialFilterStatus !== "all" && (
                        <button
                          onClick={() => setMaterialFilterStatus("all")}
                          className="press rounded-xl bg-candy-soft px-3 py-1 text-xs font-bold text-[#b03b6e]"
                        >
                          <X className="mr-1 inline h-3 w-3" /> Limpar Filtros
                        </button>
                      )}
                    </div>
                    <select
                      value={materialFilterStatus}
                      onChange={(e) => setMaterialFilterStatus(e.target.value)}
                      className="rounded-xl border border-lilac/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink outline-none focus:border-lilac"
                    >
                      <option value="all">Todos os Materiais</option>
                      <option value="viewed">✅ Já Acessados</option>
                      <option value="not_viewed">⏳ Não Acessados</option>
                    </select>
                  </div>

                  {filteredMaterialReport.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="mb-2 text-4xl">📂</div>
                      <p className="font-display text-lg font-bold text-ink">
                        Nenhum material encontrado com os filtros selecionados.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-lilac/15 bg-white shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-xs font-bold text-ink">
                            <tr>
                              <th
                                className="px-4 py-3 text-center cursor-pointer select-none transition hover:text-lilac"
                                onClick={() => { setMaterialSortField("created_at"); setMaterialSortDir((d) => (d === "asc" ? "desc" : "asc")); }}
                              >
                                Data Criação {materialSortField === "created_at" && (materialSortDir === "asc" ? "↑" : "↓")}
                              </th>
                              <th
                                className="px-4 py-3 text-left cursor-pointer select-none transition hover:text-lilac"
                                onClick={() => { setMaterialSortField("subject"); setMaterialSortDir((d) => (d === "asc" ? "desc" : "asc")); }}
                              >
                                Matéria {materialSortField === "subject" && (materialSortDir === "asc" ? "↑" : "↓")}
                              </th>
                              <th
                                className="px-4 py-3 text-left cursor-pointer select-none transition hover:text-lilac"
                                onClick={() => { setMaterialSortField("title"); setMaterialSortDir((d) => (d === "asc" ? "desc" : "asc")); }}
                              >
                                Material {materialSortField === "title" && (materialSortDir === "asc" ? "↑" : "↓")}
                              </th>
                              <th
                                className="px-4 py-3 text-center cursor-pointer select-none transition hover:text-lilac"
                                onClick={() => { setMaterialSortField("mediaType"); setMaterialSortDir((d) => (d === "asc" ? "desc" : "asc")); }}
                              >
                                Tipo {materialSortField === "mediaType" && (materialSortDir === "asc" ? "↑" : "↓")}
                              </th>
                              <th className="px-4 py-3 text-center">Acessos</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredMaterialReport.map((item) => {
                              const theme = getSubject(item.subjectId);
                              const catInfo = getCategoryInfo(item.category);
                              return (
                                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                  <td className="px-4 py-3 text-center text-xs font-semibold text-ink-soft">
                                    {item.created_at ? formatDateTime(item.created_at) : "—"}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-lilac/10 px-2.5 py-0.5 text-xs font-bold text-lilac">
                                      <span>{theme?.emoji || "📖"}</span>
                                      <span>{theme?.name || item.subjectId}</span>
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-base">{catInfo.emoji}</span>
                                      <div className="min-w-0">
                                        <p className="font-bold text-ink line-clamp-1">{item.title}</p>
                                        <span className="text-[11px] capitalize text-ink-soft">{catInfo.label}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="text-xs font-semibold capitalize text-ink-soft">{item.mediaType}</span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {item.accessCount > 0 ? (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedMaterialAccesses(item); setSelectedMaterialChildDetail(null); }}
                                        className="press inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-lilac/15 px-3 py-1.5 text-xs font-bold text-lilac transition hover:bg-lilac/25"
                                      >
                                        <Eye className="h-3.5 w-3.5 shrink-0" />
                                        <span className="whitespace-nowrap">Ver acessos ({item.accessCount})</span>
                                      </button>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                                        <CircleDashed className="h-3.5 w-3.5 shrink-0" />
                                        Pendente
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Material Accesses Modal — per-child accesses, with drill-down */}
              <AnimatePresence>
                {selectedMaterialAccesses && materialAccessesData && (
                  <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-md p-3 sm:p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => { setSelectedMaterialAccesses(null); setSelectedMaterialChildDetail(null); }}
                  >
                    <motion.div
                      className="clay relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden bg-cream/95 p-0 shadow-2xl"
                      initial={{ scale: 0.94, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.94, y: 20 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between gap-3 border-b border-lilac/15 bg-white/80 px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl shadow-sm"
                            style={{ backgroundColor: `${getSubject(selectedMaterialAccesses.subjectId)?.hex || "#4CC9F0"}25` }}
                          >
                            {getCategoryInfo(selectedMaterialAccesses.category).emoji}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-display text-lg font-bold text-ink">
                              {selectedMaterialAccesses.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                              <span>{getSubject(selectedMaterialAccesses.subjectId)?.name || selectedMaterialAccesses.subjectId}</span>
                              <span>&middot;</span>
                              <span className="capitalize">{selectedMaterialAccesses.mediaType}</span>
                              <span>&middot;</span>
                              <span>{formatFileSize(selectedMaterialAccesses.fileSize)}</span>
                              <span>&middot;</span>
                              <span>
                                {selectedMaterialAccesses.accessCount}{" "}
                                {selectedMaterialAccesses.accessCount === 1 ? "acesso" : "acessos"} por{" "}
                                {materialAccessesData.length}{" "}
                                {materialAccessesData.length === 1 ? "criança" : "crianças"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => { setSelectedMaterialAccesses(null); setSelectedMaterialChildDetail(null); }}
                          className="press grid h-9 w-9 place-items-center rounded-full bg-candy-soft text-[#b03b6e] shadow-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Body */}
                      <div className="flex-1 space-y-3 overflow-y-auto p-5">
                        {materialAccessesData.map((acc) => {
                          const isOpen = selectedMaterialChildDetail?.childId === acc.childId;
                          const total = acc.viewCount + acc.downloadCount;
                          return (
                            <div key={acc.childId}>
                              <button
                                onClick={() => setSelectedMaterialChildDetail(isOpen ? null : acc)}
                                className={cn(
                                  "flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition hover:shadow-md",
                                  isOpen ? "border-lilac bg-lilac/5" : "border-lilac/15 bg-white"
                                )}
                              >
                                <div className="flex min-w-0 items-center gap-2.5">
                                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lilac/15 text-sm font-bold text-lilac">
                                    {acc.childName.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-ink">{acc.childName}</p>
                                    <p className="text-[10px] text-ink-soft">
                                      Último acesso: {formatDateTime(acc.lastAccess)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  {acc.viewCount > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-2 py-0.5 text-[10px] font-bold text-[#05795b]">
                                      <Eye className="h-3 w-3" />
                                      {acc.viewCount}x
                                    </span>
                                  )}
                                  {acc.downloadCount > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-soft px-2 py-0.5 text-[10px] font-bold text-[#1a8bb0]">
                                      <Download className="h-3 w-3" />
                                      {acc.downloadCount}x
                                    </span>
                                  )}
                                  <ChevronRight
                                    className={cn(
                                      "h-4 w-4 text-ink-soft transition-transform",
                                      isOpen && "rotate-90"
                                    )}
                                  />
                                </div>
                              </button>

                              {/* Inline detail expansion */}
                              <AnimatePresence>
                                {isOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="space-y-3 px-2 pb-1 pt-2">
                                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                        <div className="rounded-xl border border-lilac/15 bg-white p-3 text-center">
                                          <p className="mb-1 text-[10px] font-bold text-ink-soft">Visualizações</p>
                                          <p className="font-display text-lg font-bold text-[#05795b]">
                                            {acc.viewCount}
                                          </p>
                                        </div>
                                        <div className="rounded-xl border border-lilac/15 bg-white p-3 text-center">
                                          <p className="mb-1 text-[10px] font-bold text-ink-soft">Downloads</p>
                                          <p className="font-display text-lg font-bold text-[#1a8bb0]">
                                            {acc.downloadCount}
                                          </p>
                                        </div>
                                        <div className="rounded-xl border border-lilac/15 bg-white p-3 text-center">
                                          <p className="mb-1 text-[10px] font-bold text-ink-soft">Primeiro acesso</p>
                                          <p className="text-xs font-bold text-ink">
                                            {formatDateTime(acc.firstAccess)}
                                          </p>
                                        </div>
                                        <div className="rounded-xl border border-lilac/15 bg-white p-3 text-center">
                                          <p className="mb-1 text-[10px] font-bold text-ink-soft">Total de acessos</p>
                                          <p className="font-display text-lg font-bold text-ink">{total}</p>
                                        </div>
                                      </div>

                                      {/* Event history */}
                                      <div className="rounded-xl border border-lilac/15 bg-white p-3">
                                        <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-ink">
                                          <Clock className="h-3.5 w-3.5 text-lilac" />
                                          Histórico ({acc.events.length})
                                        </p>
                                        <div className="max-h-40 space-y-1.5 overflow-y-auto">
                                          {acc.events.map((ev, i) => (
                                            <div
                                              key={i}
                                              className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5"
                                            >
                                              <span
                                                className={cn(
                                                  "inline-flex items-center gap-1 text-[11px] font-bold",
                                                  ev.action === "download" ? "text-[#1a8bb0]" : "text-[#05795b]"
                                                )}
                                              >
                                                {ev.action === "download" ? (
                                                  <Download className="h-3 w-3" />
                                                ) : (
                                                  <Eye className="h-3 w-3" />
                                                )}
                                                {ev.action === "download" ? "Baixou" : "Visualizou"}
                                              </span>
                                              <span className="text-[11px] font-semibold text-ink-soft">
                                                {formatDateTime(ev.created_at)}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ==================== TAB 5: LINHA DO TEMPO ==================== */}
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
                              const isGameStart = ev.event_type === "game_started";
                              const isGameComplete = ev.event_type === "game_completed";

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
                                      isMatDownload && "bg-sky-soft text-[#1a8bb0]",
                                      (isGameStart || isGameComplete) && "bg-indigo-100 text-indigo-700"
                                    )}
                                  >
                                    {isLogin && <LogIn className="h-4 w-4" strokeWidth={2.5} />}
                                    {isStart && <PlayCircle className="h-4 w-4" strokeWidth={2.5} />}
                                    {isComplete && <Award className="h-4 w-4" strokeWidth={2.5} />}
                                    {isMatView && <Eye className="h-4 w-4" strokeWidth={2.5} />}
                                    {isMatDownload && <Download className="h-4 w-4" strokeWidth={2.5} />}
                                    {isGameStart && <Gamepad2 className="h-4 w-4" strokeWidth={2.5} />}
                                    {isGameComplete && <Trophy className="h-4 w-4" strokeWidth={2.5} />}
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
                                        {isGameStart && `iniciou o minijogo de ${theme?.name || ev.subject || "estudo"}`}
                                        {isGameComplete && `concluiu o minijogo de ${theme?.name || ev.subject || "estudo"}`}
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

                                    {(isGameStart || isGameComplete) && (
                                      <p className="mt-0.5 text-xs font-semibold text-indigo-700 font-bold">
                                        🎮 {ev.list_title || "Minijogo Educativo"}
                                      </p>
                                    )}

                                    {isGameComplete && ev.metadata && (
                                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                        <Badge tone="mint">
                                          Pontuação: {ev.metadata.score}/{ev.metadata.maxScore} ({ev.metadata.scorePct}%)
                                        </Badge>
                                        {ev.metadata.starsEarned > 0 && (
                                          <Badge tone="sun">
                                            +{ev.metadata.starsEarned} ⭐
                                          </Badge>
                                        )}
                                        {ev.metadata.timeSpentSeconds > 0 && (
                                          <span className="flex items-center gap-1 text-ink-soft">
                                            <Clock className="h-3 w-3" />
                                            {ev.metadata.timeSpentSeconds}s
                                          </span>
                                        )}
                                      </div>
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
                {children.map((child) => {
                  const isEditing = editingChildId === child.id;
                  return (
                    <li key={child.id} className="py-4">
                      {/* Row: info + actions */}
                      <div className="flex items-center justify-between">
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
                            {child.gradeLevelName && !isEditing && (
                              <p className="text-xs text-ink-soft">
                                Série: <span className="font-medium text-ink">{child.gradeLevelName}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => (isEditing ? handleCancelEdit() : handleStartEdit(child))}
                            className={cn(
                              "press flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold transition",
                              isEditing
                                ? "bg-ink-soft/15 text-ink-soft hover:bg-ink-soft/25"
                                : "bg-sky-soft/60 text-sky hover:bg-sky-soft"
                            )}
                            title={isEditing ? "Cancelar edição" : "Editar dados"}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
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
                        </div>
                      </div>

                      {/* Inline edit form */}
                      {isEditing && (
                        <motion.div
                          className="mt-3 space-y-3 rounded-2xl border-2 border-sky/20 bg-sky-soft/30 p-4"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div>
                            <label className="mb-1 block text-[11px] font-bold text-ink">Nome</label>
                            <input
                              type="text"
                              required
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-bold text-ink">Série</label>
                            <select
                              value={editGradeLevel}
                              onChange={(e) => setEditGradeLevel(e.target.value)}
                              className={inputClass}
                            >
                              {(() => {
                                const stages = {};
                                for (const g of gradeLevels) {
                                  if (!stages[g.stage]) stages[g.stage] = [];
                                  stages[g.stage].push(g);
                                }
                                return Object.entries(stages).map(([stage, levels]) => (
                                  <optgroup key={stage} label={stage}>
                                    {levels.map((l) => (
                                      <option key={l.id} value={l.id}>
                                        {l.name}
                                      </option>
                                    ))}
                                  </optgroup>
                                ));
                              })()}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-bold text-ink">
                              Nova Senha{" "}
                              <span className="font-normal text-ink-soft">(deixe em branco para manter)</span>
                            </label>
                            <input
                              type="password"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              placeholder="••••••"
                              className={inputClass}
                            />
                          </div>

                          {editError && (
                            <p className="rounded-xl bg-candy-soft px-3 py-1.5 text-xs font-bold text-[#a62f5f]">
                              {editError}
                            </p>
                          )}

                          <div className="flex gap-2">
                            <Button
                              variant="sky"
                              className="flex-1"
                              disabled={isSavingEdit}
                              onClick={() => handleSaveEdit(child.id)}
                            >
                              {isSavingEdit ? "Salvando..." : "Salvar"}
                            </Button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="press rounded-2xl bg-ink-soft/10 px-4 py-2 text-xs font-bold text-ink-soft transition hover:bg-ink-soft/20"
                            >
                              Cancelar
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </li>
                  );
                })}
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

              <div>
                <label className="mb-1 block text-xs font-bold text-ink">Série</label>
                {isLoadingGradeLevels ? (
                  <div className="py-2 text-xs text-ink-soft">Carregando séries...</div>
                ) : (
                  <select
                    required
                    value={childGradeLevel}
                    onChange={(e) => setChildGradeLevel(e.target.value)}
                    className={inputClass}
                  >
                    {(() => {
                      const stages = {};
                      for (const g of gradeLevels) {
                        if (!stages[g.stage]) stages[g.stage] = [];
                        stages[g.stage].push(g);
                      }
                      return Object.entries(stages).map(([stage, levels]) => (
                        <optgroup key={stage} label={stage}>
                          {levels.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name}
                            </option>
                          ))}
                        </optgroup>
                      ));
                    })()}
                  </select>
                )}
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
