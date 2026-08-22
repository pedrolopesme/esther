"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { Trash2, Eye, EyeOff, ArrowLeft, Upload, Play } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getSupabaseBrowserClient } from "../utils/supabase";
import UploadWizard from "./UploadWizard";
import ExerciseDrawer from "./ExerciseDrawer";

const SUBJECTS = [
  { id: "matematica", nome: "Matemática", emoji: "🔢" },
  { id: "portugues", nome: "Português", emoji: "📚" },
  { id: "ingles", nome: "Inglês", emoji: "🗣️" },
  { id: "geografia", nome: "Geografia", emoji: "🗺️" },
  { id: "historia", nome: "História", emoji: "📜" },
  { id: "ciencias", nome: "Ciências", emoji: "🔬" },
];

export default function AdminPanel() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [lists, setLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadWizard, setShowUploadWizard] = useState(false);
  const [testingList, setTestingList] = useState(null);
  const supabase = getSupabaseBrowserClient();

  // Proteção: só admin pode acessar
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, authLoading, router]);

  async function loadLists() {
    if (!supabase) return;
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from("exercise_lists")
        .select("*")
        .order("exercise_date", { ascending: false });

      if (fetchError) throw fetchError;
      setLists(data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function handleTogglePublish(list) {
    try {
      const { error: updateError } = await supabase
        .from("exercise_lists")
        .update({ published: !list.published })
        .eq("id", list.id);

      if (updateError) throw updateError;

      setLists((prev) =>
        prev.map((l) => (l.id === list.id ? { ...l, published: !l.published } : l))
      );
    } catch (err) {
      alert("Erro ao atualizar: " + err.message);
    }
  }

  async function handleDelete(list) {
    if (!confirm(`Tem certeza que quer deletar "${list.title}"?`)) return;

    try {
      const { error: deleteError } = await supabase
        .from("exercise_lists")
        .delete()
        .eq("id", list.id);

      if (deleteError) throw deleteError;

      setLists((prev) => prev.filter((l) => l.id !== list.id));
    } catch (err) {
      alert("Erro ao deletar: " + err.message);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-ink-soft">
        Verificando acesso...
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 py-8">
      <Link
        href="/"
        className="press mb-6 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-sm font-semibold text-ink shadow-sm hover:-translate-x-0.5"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-ink">⚙️ Painel Administrativo</h1>
          <p className="mt-2 text-ink-soft">Gerencie listas de exercícios e publicações</p>
        </div>
        <button
          onClick={() => setShowUploadWizard(true)}
          className="press cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-[#B48CFF] to-[#9257FF] px-5 py-3 text-sm font-bold text-white shadow-[0_6px_0_#7A3FE0] active:translate-y-1.5 active:shadow-none"
        >
          <Upload className="h-5 w-5" />
          Importar JSON
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-[#FFE3F0] px-4 py-3 text-sm font-semibold text-[#a62f5f]">
          Erro: {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-ink-soft">
          Carregando listas...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Resumo por matéria */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {SUBJECTS.map((subject) => {
              const count = lists.filter((l) => l.subject === subject.id).length;
              return (
                <div
                  key={subject.id}
                  className="clay flex flex-col items-center gap-2 p-4 text-center"
                >
                  <span className="text-3xl">{subject.emoji}</span>
                  <span className="text-sm font-bold text-ink">{subject.nome}</span>
                  <span className="text-2xl font-bold text-lilac">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Tabela de listas */}
          <div className="clay overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-ink">Matéria</th>
                    <th className="px-4 py-3 text-left font-bold text-ink">Título</th>
                    <th className="px-4 py-3 text-left font-bold text-ink">Data</th>
                    <th className="px-4 py-3 text-center font-bold text-ink">Questões</th>
                    <th className="px-4 py-3 text-center font-bold text-ink">Publicado</th>
                    <th className="px-4 py-3 text-center font-bold text-ink">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/50">
                  {lists.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-6 text-center text-ink-soft">
                        Nenhuma lista de exercícios. Importe um JSON para começar!
                      </td>
                    </tr>
                  ) : (
                    lists.map((list) => (
                      <tr key={list.id} className="hover:bg-white/30 transition">
                        <td className="px-4 py-3">
                          <span className="inline-block rounded-full bg-[#EEE6FF] px-2.5 py-1 text-xs font-bold text-[#A370FF]">
                            {SUBJECTS.find((s) => s.id === list.subject)?.emoji} {list.subject}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-ink max-w-xs truncate">{list.title}</td>
                        <td className="px-4 py-3 text-ink-soft">
                          {new Date(list.exercise_date + "T12:00:00").toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-center text-ink font-bold">
                          {list.question_count || 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleTogglePublish(list)}
                            className="press cursor-pointer inline-flex items-center justify-center gap-1 rounded-full bg-white/70 px-2 py-1 text-xs font-bold shadow-sm hover:text-lilac"
                            title={list.published ? "Despublicar" : "Publicar"}
                          >
                            {list.published ? (
                              <>
                                <Eye className="h-4 w-4" />
                                <span className="hidden sm:inline">Sim</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-4 w-4" />
                                <span className="hidden sm:inline">Não</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setTestingList(list)}
                              disabled={!Array.isArray(list.exercises) || list.exercises.length === 0}
                              className="press cursor-pointer rounded-full bg-white/70 p-1.5 shadow-sm hover:text-mint disabled:opacity-30 disabled:cursor-not-allowed transition"
                              title="Testar lista"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(list)}
                              className="press cursor-pointer rounded-full bg-white/70 p-1.5 shadow-sm hover:text-candy"
                              title="Deletar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Upload Wizard Modal */}
      <AnimatePresence>
        {showUploadWizard && (
          <UploadWizard
            onClose={() => setShowUploadWizard(false)}
            onSaved={() => loadLists()}
          />
        )}
      </AnimatePresence>

      {/* Exercise Preview Drawer */}
      <AnimatePresence>
        {testingList && (
          <ExerciseDrawer
            list={testingList}
            onClose={() => setTestingList(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}