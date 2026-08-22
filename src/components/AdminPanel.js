"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getSupabaseBrowserClient } from "../utils/supabase";

const SUBJECTS = [
  { id: "matematica", nome: "Matemática", emoji: "🔢" },
  { id: "portugues", nome: "Português", emoji: "📚" },
  { id: "ingles", nome: "Inglês", emoji: "🗣️" },
  { id: "geografia", nome: "Geografia", emoji: "🗺️" },
  { id: "historia", nome: "História", emoji: "📜" },
  { id: "ciencias", nome: "Ciências", emoji: "🔬" },
];

export default function AdminPanel() {
  const { isAdmin, isLoading: authLoading, user } = useAuth();
  const [lists, setLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [formData, setFormData] = useState({
    subject: "matematica",
    slug: "",
    title: "",
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const supabase = getSupabaseBrowserClient();

  // Proteção: só admin pode acessar
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      // Redirecionar para home se não for admin
      window.location.href = "/";
    }
  }, [isAdmin, authLoading]);

  // Carregar listas de exercícios
  useEffect(() => {
    if (!isAdmin) return;

    async function loadLists() {
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

    loadLists();
  }, [isAdmin, supabase]);

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

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingList) {
        // Atualizar
        const { error: updateError } = await supabase
          .from("exercise_lists")
          .update({
            title: formData.title,
            description: formData.description,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingList.id);

        if (updateError) throw updateError;

        setLists((prev) =>
          prev.map((l) =>
            l.id === editingList.id
              ? { ...l, title: formData.title, description: formData.description }
              : l
          )
        );
        alert("Lista atualizada!");
      } else {
        // Criar nova (interface simplificada)
        alert("Para criar novas listas, use a migração de dados ou a API.");
      }

      setShowForm(false);
      setEditingList(null);
      setFormData({ subject: "matematica", slug: "", title: "", description: "" });
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    } finally {
      setIsSaving(false);
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

      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-ink">⚙️ Painel Administrativo</h1>
        <p className="mt-2 text-ink-soft">Gerencie listas de exercícios e publicações</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-candy-soft px-4 py-3 text-sm font-semibold text-[#a62f5f]">
          Erro: {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-ink-soft">
          Carregando listas...
        </div>
      ) : (
        <motion.div
          className="space-y-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
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
                        Nenhuma lista de exercícios
                      </td>
                    </tr>
                  ) : (
                    lists.map((list) => (
                      <tr key={list.id} className="hover:bg-white/30 transition">
                        <td className="px-4 py-3">
                          <span className="inline-block rounded-full bg-lilac/10 px-2.5 py-1 text-xs font-bold text-lilac">
                            {list.subject}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-ink">{list.title}</td>
                        <td className="px-4 py-3 text-ink-soft">
                          {new Date(list.exercise_date).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-center text-ink font-bold">
                          {list.question_count || 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleTogglePublish(list)}
                            className="press inline-flex items-center justify-center gap-1 rounded-full bg-white/70 px-2 py-1 text-xs font-bold shadow-sm hover:text-lilac"
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
                              onClick={() => {
                                setEditingList(list);
                                setFormData({
                                  subject: list.subject,
                                  slug: list.slug,
                                  title: list.title,
                                  description: list.description || "",
                                });
                                setShowForm(true);
                              }}
                              className="press rounded-full bg-white/70 p-1.5 shadow-sm hover:text-sky"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(list)}
                              className="press rounded-full bg-white/70 p-1.5 shadow-sm hover:text-candy"
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

          {/* Formulário de edição */}
          {showForm && (
            <motion.div
              className="clay p-6"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <h2 className="mb-4 font-display text-xl font-bold text-ink">
                {editingList ? "✏️ Editar lista" : "➕ Nova lista"}
              </h2>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-bold text-ink">Título</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border-2 border-lilac/15 bg-white/80 px-4 py-2 text-ink outline-none focus:border-lilac"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-ink">Descrição</label>
                  <textarea
                    className="w-full rounded-xl border-2 border-lilac/15 bg-white/80 px-4 py-2 text-ink outline-none focus:border-lilac"
                    rows="3"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="press flex-1 rounded-xl bg-lilac px-4 py-2 font-bold text-white shadow-md disabled:opacity-60"
                    disabled={isSaving}
                  >
                    {isSaving ? "Salvando..." : "Salvar"}
                  </button>
                  <button
                    type="button"
                    className="press rounded-xl bg-white/70 px-4 py-2 font-bold text-ink shadow-md"
                    onClick={() => {
                      setShowForm(false);
                      setEditingList(null);
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </motion.div>
      )}
    </main>
  );
}
