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
  const [selectedListDetail, setSelectedListDetail] = useState(null);
  const [selectedGameDetail, setSelectedGameDetail] = useState(null);

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
        .select("id, title, description, subject_id, ano_letivo, file_url, file_name, file_size, file_type, media_type, category")
        .eq("published", true),
      supabase
        .from("game_sessions")
        .select("*")
        .order("completed_at", { ascending: false })
        .limit(300),
      supabase
        .from("games")
        .select("id, slug, title, description, subject_id, ano_letivo, max_score, cover_url")
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

  // Map of game_id to game data
  const gameMap = useMemo(() => {
    const map = {};
    for (const g of games) {
      map[g.id] = g;
    }
    return map;
  }, [games]);

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

  // One row per session (attempt), plus one row per unattempted published list
  const publishedListsTableData = useMemo(() => {
    const listMeta = {};
    for (const l of exerciseLists) {
      listMeta[`${l.subject}/${l.slug}`] = l;
    }
    const rows = filteredSessions.map((s) => {
      const key = `${s.list_subject}/${s.list_slug}`;
      const list = listMeta[key];
      const pct = s.total_questions > 0 ? Math.round((s.correct_count / s.total_questions) * 100) : 0;
      return {
        rowType: "session",
        sessionId: s.id,
        subject: s.list_subject,
        slug: s.list_slug,
        title: s.list_title || list?.title || s.list_slug,
        ano_letivo: list?.ano_letivo || null,
        question_count: s.total_questions || list?.question_count || 0,
        childId: s.child_id,
        childName: childMap[s.child_id] || "Estudante",
        correct_count: s.correct_count || 0,
        wrong_count: s.wrong_count || 0,
        pct,
        points_earned: s.points_earned || 0,
        completed_at: s.completed_at,
        wrong_details: Array.isArray(s.wrong_details) ? s.wrong_details : [],
      };
    });
    const attemptedKeys = new Set(filteredSessions.map((s) => `${s.list_subject}/${s.list_slug}`));
    for (const l of exerciseLists) {
      const key = `${l.subject}/${l.slug}`;
      if (!attemptedKeys.has(key)) {
        rows.push({
          rowType: "pending",
          sessionId: `pending-${l.id}`,
          subject: l.subject,
          slug: l.slug,
          title: l.title,
          ano_letivo: l.ano_letivo,
          question_count: l.question_count || 0,
          childId: null,
          childName: null,
          correct_count: 0,
          wrong_count: 0,
          pct: 0,
          points_earned: 0,
          completed_at: null,
          wrong_details: [],
        });
      }
    }
    return rows;
  }, [exerciseLists, filteredSessions, childMap]);

  // Detail for the selected session (single execution)
  const listDetailData = useMemo(() => {
    if (!selectedListDetail || selectedListDetail.rowType !== "session") return null;
    const wrong = selectedListDetail.wrong_details.map((err) => ({
      question: err.question || "Questão sem enunciado",
      selected: err.selected,
      correct: err.correct,
    }));
    return { wrong };
  }, [selectedListDetail]);

  // Filtered published lists table
  const filteredListsTableData = useMemo(() => {
    return publishedListsTableData.filter((item) => {
      const matchTitle = listSearchTitle.trim()
        ? item.title?.toLowerCase().includes(listSearchTitle.toLowerCase().trim()) ||
          item.slug?.toLowerCase().includes(listSearchTitle.toLowerCase().trim())
        : true;
      const matchSubject = listFilterSubject ? item.subject === listFilterSubject : true;
      const matchGrade = listFilterGrade ? item.ano_letivo === listFilterGrade : true;
      const matchStatus =
        listFilterStatus === "done"
          ? item.rowType === "session"
          : listFilterStatus === "pending"
          ? item.rowType === "pending"
          : true;
      return matchTitle && matchSubject && matchGrade && matchStatus;
    });
  }, [publishedListsTableData, listSearchTitle, listFilterSubject, listFilterGrade, listFilterStatus]);

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

          {/* Quick Metrics Cards */}
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
                  {/* Overview Balance of Done vs Pending Activities */}
                  <Card className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                      <div>
                        <h3 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
                          <PieChart className="h-5 w-5 text-lilac" strokeWidth={2.5} />
                          Visão Geral de Todas as Atividades (Feitas vs Pendentes)
                        </h3>
                        <p className="text-xs text-ink-soft sm:text-sm">
                          Balanço de participação considerando listas de exercícios, minijogos e materiais de apoio.
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1.5 rounded-full bg-lilac/15 px-3 py-1 text-xs font-bold text-lilac">
                        Progresso Total: {overallCompletionRate}%
                      </span>
                    </div>

                    {/* Progress multi-segment graph */}
                    <div className="mb-6 space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          {grandTotalActivitiesDone} Atividades Feitas ({overallCompletionRate}%)
                        </span>
                        <span className="text-amber-700 flex items-center gap-1">
                          <CircleDashed className="h-3.5 w-3.5 text-amber-600" />
                          {grandTotalActivitiesPending} Pendentes ({100 - overallCompletionRate}%)
                        </span>
                      </div>

                      <div className="flex h-5 w-full overflow-hidden rounded-full bg-black/5 p-1 shadow-inner">
                        <div
                          className="rounded-full bg-gradient-to-r from-mint to-sky transition-all duration-700"
                          style={{ width: `${overallCompletionRate}%` }}
                        />
                        <div
                          className="rounded-full bg-gradient-to-r from-amber-300 to-candy-soft transition-all duration-700"
                          style={{ width: `${100 - overallCompletionRate}%` }}
                        />
                      </div>
                    </div>

                    {/* 3 Activity Category Cards breakdown */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {/* Exercise Lists */}
                      <div className="rounded-2xl border-2 border-lilac/15 bg-white/90 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-lilac">
                            <ListChecks className="h-4 w-4" /> Listas de Exercícios
                          </span>
                          <span className="text-[11px] font-bold text-ink-soft">
                            {distinctDoneListsCount}/{totalPublishedLists}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 mb-2">
                          <div
                            className="h-full rounded-full bg-lilac"
                            style={{
                              width: `${totalPublishedLists > 0 ? (distinctDoneListsCount / totalPublishedLists) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <p className="text-[11px] text-ink-soft">
                          <strong className="text-emerald-700">{distinctDoneListsCount} feitas</strong> &middot;{" "}
                          <span className="text-amber-700">{pendingListsCount} pendentes</span>
                        </p>
                      </div>

                      {/* Educational Games */}
                      <div className="rounded-2xl border-2 border-indigo-500/15 bg-white/90 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600">
                            <Gamepad2 className="h-4 w-4" /> Minijogos Educativos
                          </span>
                          <span className="text-[11px] font-bold text-ink-soft">
                            {distinctPlayedGamesCount}/{totalPublishedGames}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 mb-2">
                          <div
                            className="h-full rounded-full bg-indigo-600"
                            style={{
                              width: `${totalPublishedGames > 0 ? (distinctPlayedGamesCount / totalPublishedGames) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <p className="text-[11px] text-ink-soft">
                          <strong className="text-emerald-700">{distinctPlayedGamesCount} jogados</strong> &middot;{" "}
                          <span className="text-amber-700">{pendingGamesCount} pendentes</span>
                        </p>
                      </div>

                      {/* Study Materials */}
                      <div className="rounded-2xl border-2 border-sky/15 bg-white/90 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky">
                            <FolderDown className="h-4 w-4" /> Materiais de Estudo
                          </span>
                          <span className="text-[11px] font-bold text-ink-soft">
                            {distinctViewedMaterialsCount}/{totalPublishedMaterials}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 mb-2">
                          <div
                            className="h-full rounded-full bg-sky"
                            style={{
                              width: `${totalPublishedMaterials > 0 ? (distinctViewedMaterialsCount / totalPublishedMaterials) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <p className="text-[11px] text-ink-soft">
                          <strong className="text-emerald-700">{distinctViewedMaterialsCount} vistos</strong> &middot;{" "}
                          <span className="text-amber-700">{pendingMaterialsCount} pendentes</span>
                        </p>
                      </div>
                    </div>
                  </Card>

                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Visual Accuracy Ratio */}
                    <Card className="flex flex-col justify-between p-6">
                      <div>
                        <h3 className="mb-2 flex items-center gap-2 font-display text-lg font-bold text-ink">
                          <TrendingUp className="h-5 w-5 text-mint" strokeWidth={2.5} />
                          Proporção de Acertos vs Erros nas Listas
                        </h3>
                        <p className="mb-6 text-xs text-ink-soft">
                          Visão consolidada de todas as respostas registradas nas listas de exercícios.
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

                      {(listSearchTitle || listFilterSubject || listFilterStatus !== "all" || listFilterGrade) && (
                        <button
                          onClick={() => {
                            setListSearchTitle("");
                            setListFilterSubject("");
                            setListFilterStatus("all");
                            setListFilterGrade("");
                          }}
                          className="press rounded-xl bg-candy-soft px-3 py-1 text-xs font-bold text-[#b03b6e]"
                        >
                          <X className="mr-1 inline h-3 w-3" /> Limpar Filtros
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                      {/* Search */}
                      <input
                        type="text"
                        placeholder="Buscar por nome da lista..."
                        value={listSearchTitle}
                        onChange={(e) => setListSearchTitle(e.target.value)}
                        className="rounded-xl border border-lilac/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink outline-none focus:border-lilac"
                      />

                      {/* Status */}
                      <select
                        value={listFilterStatus}
                        onChange={(e) => setListFilterStatus(e.target.value)}
                        className="rounded-xl border border-lilac/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink outline-none focus:border-lilac"
                      >
                        <option value="all">Todos os Status (Feitas e Não Feitas)</option>
                        <option value="done">✅ Feitas / Concluídas</option>
                        <option value="pending">⏳ Não Feitas / Pendentes</option>
                      </select>

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
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-hidden rounded-2xl border border-lilac/15 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-xs font-bold text-ink">
                          <tr>
                            <th className="px-4 py-3 text-left">Matéria</th>
                            <th className="px-4 py-3 text-left">Título da Lista</th>
                            <th className="px-4 py-3 text-left">Criança</th>
                            <th className="px-4 py-3 text-center">Questões</th>
                            <th className="px-4 py-3 text-center">Aproveitamento</th>
                            <th className="px-4 py-3 text-center">Data</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredListsTableData.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="px-4 py-8 text-center text-ink-soft text-xs">
                                Nenhuma lista encontrada com os filtros selecionados.
                              </td>
                            </tr>
                          ) : (
                            filteredListsTableData.map((item) => {
                              const theme = getSubject(item.subject);
                              const isPending = item.rowType === "pending";

                              return (
                                <tr key={item.sessionId} className="hover:bg-slate-50/70 transition cursor-pointer" onClick={() => !isPending && setSelectedListDetail(item)}>
                                  {/* Subject */}
                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-lilac/10 px-2.5 py-0.5 text-xs font-bold text-lilac">
                                      <span>{theme?.emoji || "📖"}</span>
                                      <span>{theme?.name || item.subject}</span>
                                    </span>
                                  </td>

                                  {/* Title & Grade */}
                                  <td className="px-4 py-3">
                                    <p className="font-bold text-ink line-clamp-1">{item.title}</p>
                                    <span className="text-[11px] text-ink-soft">
                                      {item.ano_letivo || "Ensino Fundamental"}
                                    </span>
                                  </td>

                                  {/* Child */}
                                  <td className="px-4 py-3">
                                    {isPending ? (
                                      <span className="text-xs text-ink-soft font-semibold">—</span>
                                    ) : (
                                      <span className="text-xs font-bold text-candy">{item.childName}</span>
                                    )}
                                  </td>

                                  {/* Question Count */}
                                  <td className="px-4 py-3 text-center text-xs font-bold text-ink">
                                    {item.question_count || 0}
                                  </td>

                                  {/* Score */}
                                  <td className="px-4 py-3 text-center">
                                    {isPending ? (
                                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                                        <CircleDashed className="h-3.5 w-3.5" />
                                        Pendente
                                      </span>
                                    ) : (
                                      <span className={cn(
                                        "inline-flex items-center gap-1 font-bold text-xs",
                                        item.pct >= 70 ? "text-emerald-700" : "text-amber-700"
                                      )}>
                                        {item.pct}% ({item.correct_count}/{item.question_count})
                                      </span>
                                    )}
                                  </td>

                                  {/* Date */}
                                  <td className="px-4 py-3 text-center text-xs text-ink-soft font-semibold">
                                    {isPending ? (
                                      <span className="text-amber-700">Pendente</span>
                                    ) : (
                                      formatDateTime(item.completed_at)
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

              {/* List Detail Modal */}
              <AnimatePresence>
                {selectedListDetail && listDetailData && (
                  <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-md p-3 sm:p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedListDetail(null)}
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
                            style={{ backgroundColor: `${getSubject(selectedListDetail.subject)?.hex || "#A370FF"}25` }}
                          >
                            {getSubject(selectedListDetail.subject)?.emoji || "📖"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-display text-lg font-bold text-ink truncate">
                              {selectedListDetail.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                              <span>{getSubject(selectedListDetail.subject)?.name || selectedListDetail.subject}</span>
                              <span>&middot;</span>
                              <span>{selectedListDetail.ano_letivo || "Ensino Fundamental"}</span>
                              <span>&middot;</span>
                              <span>{selectedListDetail.question_count || 0} questões</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedListDetail(null)}
                          className="press grid h-9 w-9 place-items-center rounded-full bg-candy-soft text-[#b03b6e] shadow-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Body */}
                      <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {/* Score summary */}
                        <div className="flex items-center justify-between gap-3 rounded-2xl border border-lilac/15 bg-white p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="grid h-9 w-9 place-items-center rounded-full bg-lilac/15 text-sm font-bold text-lilac">
                              {selectedListDetail.childName?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-ink text-sm">{selectedListDetail.childName}</p>
                              <p className="text-[10px] text-ink-soft">{formatDateTime(selectedListDetail.completed_at)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                              selectedListDetail.pct >= 70 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                            )}>
                              {selectedListDetail.pct >= 70 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}
                              {selectedListDetail.pct}% de acerto
                            </span>
                            <span className="text-xs text-ink-soft font-semibold">
                              ({selectedListDetail.correct_count}/{selectedListDetail.question_count})
                            </span>
                          </div>
                        </div>

                        {/* Wrong answers */}
                        {listDetailData.wrong.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-ink flex items-center gap-1.5">
                              <XCircle className="h-3.5 w-3.5 text-candy" />
                              Erros ({listDetailData.wrong.length})
                            </p>
                            {listDetailData.wrong.map((err, i) => (
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
                        ) : (
                          <div className="rounded-2xl border border-lilac/15 bg-white p-4 text-center">
                            <span className="text-xs font-bold text-emerald-700">🎉 Sem erros — desempenho perfeito!</span>
                          </div>
                        )}
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
                        Desempenho nos Minijogos Educativos
                      </h3>
                      <p className="text-xs text-ink-soft sm:text-sm">
                        Pontuações, tempo dedicado e histórico de partidas concluídas pelos filhos.
                      </p>
                    </div>
                    <Badge tone="sky">
                      {filteredGameSessions.length}{" "}
                      {filteredGameSessions.length === 1 ? "partida registrada" : "partidas registradas"}
                    </Badge>
                  </div>

                  {filteredGameSessions.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="mb-2 text-4xl">🎮</div>
                      <p className="font-display text-lg font-bold text-ink">
                        Nenhuma partida jogada ainda.
                      </p>
                      <p className="mt-1 text-xs text-ink-soft">
                        Quando as crianças jogarem os minijogos educativos, as pontuações e acertos aparecerão aqui.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-lilac/15 bg-white shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-xs font-bold text-ink">
                            <tr>
                              <th className="px-4 py-3 text-left">Matéria</th>
                              <th className="px-4 py-3 text-left">Jogo</th>
                              <th className="px-4 py-3 text-left">Criança</th>
                              <th className="px-4 py-3 text-center">Pontuação</th>
                              <th className="px-4 py-3 text-center">Tempo</th>
                              <th className="px-4 py-3 text-center">Data</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredGameSessions.map((session) => {
                              const theme = getSubject(session.subject_id);
                              const childDisplayName = childMap[session.child_id] || "Estudante";
                              return (
                                <tr key={session.id} className="hover:bg-slate-50/70 transition cursor-pointer" onClick={() => setSelectedGameDetail(session)}>
                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-lilac/10 px-2.5 py-0.5 text-xs font-bold text-lilac">
                                      <span>{theme?.emoji || "🎮"}</span>
                                      <span>{theme?.name || session.subject_id}</span>
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <p className="font-bold text-ink line-clamp-1">{session.game_title}</p>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-xs font-bold text-candy">{childDisplayName}</span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs">
                                      <Trophy className="h-3.5 w-3.5 text-emerald-600" />
                                      {session.score}/{session.max_score} ({session.score_pct}%)
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center text-xs text-ink-soft">
                                    {session.time_spent_seconds > 0 ? (
                                      <span className="flex items-center justify-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {session.time_spent_seconds}s
                                      </span>
                                    ) : "—"}
                                  </td>
                                  <td className="px-4 py-3 text-center text-xs text-ink-soft font-semibold">
                                    {formatDateTime(session.completed_at)}
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

              {/* Game Detail Modal */}
              <AnimatePresence>
                {selectedGameDetail && (
                  <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-md p-3 sm:p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedGameDetail(null)}
                  >
                    <motion.div
                      className="clay relative flex max-h-[90vh] w-full max-w-lg flex-col bg-cream/95 p-0 overflow-hidden shadow-2xl"
                      initial={{ scale: 0.94, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.94, y: 20 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-lilac/15 bg-white/80 px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl shadow-sm"
                            style={{ backgroundColor: `${getSubject(selectedGameDetail.subject_id)?.hex || "#6366F1"}25` }}
                          >
                            {getSubject(selectedGameDetail.subject_id)?.emoji || "🎮"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-display text-lg font-bold text-ink truncate">
                              {selectedGameDetail.game_title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                              <span>{getSubject(selectedGameDetail.subject_id)?.name || selectedGameDetail.subject_id}</span>
                              <span>&middot;</span>
                              <span>{childMap[selectedGameDetail.child_id] || "Estudante"}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedGameDetail(null)}
                          className="press grid h-9 w-9 place-items-center rounded-full bg-candy-soft text-[#b03b6e] shadow-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        <div className="rounded-2xl border border-lilac/15 bg-white p-4 text-center">
                          <p className="text-xs font-bold text-ink-soft mb-2">Pontuação</p>
                          <div className="flex items-center justify-center gap-3">
                            <Trophy className="h-8 w-8 text-emerald-600" />
                            <span className="font-display text-4xl font-bold text-ink">{selectedGameDetail.score}</span>
                            <span className="text-lg text-ink-soft font-semibold">/ {selectedGameDetail.max_score}</span>
                          </div>
                          <span className={cn(
                            "mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold",
                            selectedGameDetail.score_pct >= 70 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          )}>
                            {selectedGameDetail.score_pct}% de aproveitamento
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-2xl border border-lilac/15 bg-white p-3 text-center">
                            <p className="text-[10px] font-bold text-ink-soft mb-1">Tempo</p>
                            <p className="font-bold text-ink flex items-center justify-center gap-1">
                              <Clock className="h-4 w-4 text-lilac" />
                              {selectedGameDetail.time_spent_seconds > 0 ? `${selectedGameDetail.time_spent_seconds}s` : "—"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-lilac/15 bg-white p-3 text-center">
                            <p className="text-[10px] font-bold text-ink-soft mb-1">Data</p>
                            <p className="font-bold text-ink text-sm">{formatDateTime(selectedGameDetail.completed_at)}</p>
                          </div>
                        </div>

                        {selectedGameDetail.details && Object.keys(selectedGameDetail.details).length > 0 && (
                          <div className="rounded-2xl border border-lilac/15 bg-white p-4">
                            <p className="text-xs font-bold text-ink mb-3">Detalhes da Partida</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedGameDetail.details.acertos !== undefined && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {selectedGameDetail.details.acertos} acertos
                                </span>
                              )}
                              {selectedGameDetail.details.erros !== undefined && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 border border-rose-200">
                                  <XCircle className="h-3.5 w-3.5" />
                                  {selectedGameDetail.details.erros} erros
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {selectedGameDetail && (
                  <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-md p-3 sm:p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedGameDetail(null)}
                  >
                    <motion.div
                      className="clay relative flex max-h-[90vh] w-full max-w-lg flex-col bg-cream/95 p-0 overflow-hidden shadow-2xl"
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
                            style={{ backgroundColor: `${getSubject(selectedGameDetail.subject_id)?.hex || "#6366F1"}25` }}
                          >
                            {getSubject(selectedGameDetail.subject_id)?.emoji || "🎮"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-display text-lg font-bold text-ink truncate">
                              {selectedGameDetail.game_title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                              <span>{getSubject(selectedGameDetail.subject_id)?.name || selectedGameDetail.subject_id}</span>
                              <span>&middot;</span>
                              <span>{childMap[selectedGameDetail.child_id] || "Estudante"}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedGameDetail(null)}
                          className="press grid h-9 w-9 place-items-center rounded-full bg-candy-soft text-[#b03b6e] shadow-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Body */}
                      <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {/* Score */}
                        <div className="rounded-2xl border border-lilac/15 bg-white p-4 text-center">
                          <p className="text-xs font-bold text-ink-soft mb-2">Pontuação</p>
                          <div className="flex items-center justify-center gap-3">
                            <Trophy className="h-8 w-8 text-emerald-600" />
                            <span className="font-display text-4xl font-bold text-ink">
                              {selectedGameDetail.score}
                            </span>
                            <span className="text-lg text-ink-soft font-semibold">/ {selectedGameDetail.max_score}</span>
                          </div>
                          <span className={cn(
                            "mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold",
                            selectedGameDetail.score_pct >= 70 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          )}>
                            {selectedGameDetail.score_pct}% de aproveitamento
                          </span>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-2xl border border-lilac/15 bg-white p-3 text-center">
                            <p className="text-[10px] font-bold text-ink-soft mb-1">Tempo</p>
                            <p className="font-bold text-ink flex items-center justify-center gap-1">
                              <Clock className="h-4 w-4 text-lilac" />
                              {selectedGameDetail.time_spent_seconds > 0 ? `${selectedGameDetail.time_spent_seconds}s` : "—"}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-lilac/15 bg-white p-3 text-center">
                            <p className="text-[10px] font-bold text-ink-soft mb-1">Data</p>
                            <p className="font-bold text-ink text-sm">{formatDateTime(selectedGameDetail.completed_at)}</p>
                          </div>
                        </div>

                        {/* Details */}
                        {selectedGameDetail.details && Object.keys(selectedGameDetail.details).length > 0 && (
                          <div className="rounded-2xl border border-lilac/15 bg-white p-4">
                            <p className="text-xs font-bold text-ink mb-3">Detalhes da Partida</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedGameDetail.details.acertos !== undefined && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {selectedGameDetail.details.acertos} acertos
                                </span>
                              )}
                              {selectedGameDetail.details.erros !== undefined && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 border border-rose-200">
                                  <XCircle className="h-3.5 w-3.5" />
                                  {selectedGameDetail.details.erros} erros
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ==================== TAB 4: MATERIAIS DE APOIO ACESSADOS ==================== */}
              {activeTab === "materials" && (
                <Card className="p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
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
                    <div className="overflow-hidden rounded-2xl border border-lilac/15 bg-white shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-xs font-bold text-ink">
                            <tr>
                              <th className="px-4 py-3 text-left">Matéria</th>
                              <th className="px-4 py-3 text-left">Material</th>
                              <th className="px-4 py-3 text-left">Criança</th>
                              <th className="px-4 py-3 text-center">Tipo</th>
                              <th className="px-4 py-3 text-center">Ações</th>
                              <th className="px-4 py-3 text-center">Último Acesso</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {materialReport.map((item, idx) => {
                              const theme = getSubject(item.subjectId);
                              const catInfo = getCategoryInfo(item.category);
                              return (
                                <tr key={idx} className="hover:bg-slate-50/70 transition">
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
                                        <span className="text-[11px] text-ink-soft capitalize">{catInfo.label}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="text-xs font-bold text-candy">{item.childName}</span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="text-xs font-semibold text-ink-soft capitalize">{item.mediaType}</span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      {item.viewed && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-2 py-0.5 text-[10px] font-bold text-[#05795b]">
                                          <Eye className="h-3 w-3" />
                                          {item.viewCount}x
                                        </span>
                                      )}
                                      {item.downloaded && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-soft px-2 py-0.5 text-[10px] font-bold text-[#1a8bb0]">
                                          <Download className="h-3 w-3" />
                                          {item.downloadCount}x
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center text-xs text-ink-soft font-semibold">
                                    {formatDateTime(item.lastAccess)}
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
