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
  ExternalLink,
  Baby,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getSupabaseBrowserClient } from "../utils/supabase";
import { cn } from "../utils/cn";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Card from "./ui/Card";

const inputClass =
  "w-full rounded-2xl border-2 border-candy/15 bg-white/80 px-4 py-3 text-sm text-ink outline-none transition focus:border-candy focus:ring-4 focus:ring-candy/10";

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }) + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDay(iso) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function groupByDay(logs) {
  const groups = {};
  for (const log of logs) {
    const dayKey = new Date(log.accessed_at).toISOString().slice(0, 10);
    if (!groups[dayKey]) groups[dayKey] = [];
    groups[dayKey].push(log);
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

export default function ParentDashboard() {
  const router = useRouter();
  const { isParent, isLoading: authLoading, user } = useAuth();
  const supabase = getSupabaseBrowserClient();

  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [accessLogs, setAccessLogs] = useState([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
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
      setChildren(
        data.map((row) => ({
          id: row.id,
          name: row.display_name,
          username: row.username,
        }))
      );
    }
    setIsLoadingChildren(false);
  }, [supabase, user]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  // Load access logs for selected child
  useEffect(() => {
    if (!selectedChild || !supabase) {
      setAccessLogs([]);
      return;
    }
    setIsLoadingLogs(true);
    supabase
      .from("access_logs")
      .select("path, accessed_at")
      .eq("child_id", selectedChild.id)
      .order("accessed_at", { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (!error && data) setAccessLogs(data);
        setIsLoadingLogs(false);
      });
  }, [selectedChild, supabase]);

  // Register a new child
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

  // Remove a child
  async function handleUnlink(childId) {
    if (!user) return;
    await supabase
      .from("children")
      .delete()
      .eq("id", childId)
      .eq("parent_id", user.id);
    if (selectedChild?.id === childId) setSelectedChild(null);
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

  const dayGroups = groupByDay(accessLogs);

  return (
    <main className="mx-auto max-w-5xl flex-1 px-4 pb-16 pt-6">
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
            <p className="text-white/90">Acompanhe o progresso de estudos dos seus filhos</p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left: children list + link form */}
        <div className="space-y-5">
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

          {/* Children list */}
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
                Nenhum filho cadastrado ainda. Use o formulário acima para cadastrar.
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
                        <span className="font-display font-bold text-ink">{child.name}</span>
                      </button>
                      <button
                        onClick={() => handleUnlink(child.id)}
                        className="rounded-full p-1.5 text-ink-soft hover:bg-candy-soft hover:text-candy"
                        title="Desvincular"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Right: access logs */}
        <div>
          {!selectedChild ? (
            <Card className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
              <div className="mb-3 text-5xl">👀</div>
              <h2 className="font-display text-xl font-bold text-ink">Selecione um filho</h2>
              <p className="mt-2 text-sm text-ink-soft">
                Clique em um filho na lista ao lado para ver seus horários de acesso.
              </p>
            </Card>
          ) : (
            <div>
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold text-ink">
                <Clock className="h-5 w-5 text-sky" strokeWidth={2.5} />
                Acessos de {selectedChild.name}
              </h2>

              {isLoadingLogs ? (
                <div className="flex justify-center py-12">
                  <span className="h-12 w-12 animate-spin rounded-full border-4 border-sky/25 border-t-sky" />
                </div>
              ) : accessLogs.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="mb-3 text-4xl">📭</div>
                  <p className="font-display font-semibold text-ink-soft">
                    Nenhum acesso registrado ainda.
                  </p>
                </Card>
              ) : (
                <div className="space-y-5">
                  {dayGroups.map(([dayKey, logs]) => (
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
                            {logs.length} {logs.length === 1 ? "acesso" : "acessos"}
                          </Badge>
                        </div>
                        <ul className="divide-y divide-lilac/10 px-5">
                          {logs.map((log, idx) => (
                            <li key={idx} className="flex items-center gap-3 py-3">
                              <span className="grid h-8 w-8 place-items-center rounded-full bg-white shadow-inner">
                                <Clock className="h-4 w-4 text-lilac" strokeWidth={2} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-ink">
                                  {new Date(log.accessed_at).toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </p>
                                <p className="truncate text-xs text-ink-soft">{log.path}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
