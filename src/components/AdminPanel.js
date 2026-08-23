"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
  Upload,
  Play,
  BookOpen,
  ListChecks,
  Plus,
  Edit2,
  Check,
  X,
  Palette,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  FolderDown,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Filter,
  FileUp,
  GraduationCap,
  Layers,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getSupabaseBrowserClient } from "../utils/supabase";
import {
  SUBJECTS as STATIC_SUBJECTS,
  COLOR_PRESETS,
  ICON_MAP,
  getSubjectsFromDB,
  resolveSubject,
} from "../utils/subjects";
import {
  MATERIAL_CATEGORIES,
  getMaterials,
  uploadMaterialFile,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  togglePublishMaterial,
  formatFileSize,
  formatTitleFromFileName,
  detectMediaType,
  getCategoryInfo,
} from "../utils/materialRepository";
import UploadWizard from "./UploadWizard";
import ExerciseDrawer from "./ExerciseDrawer";
import MaterialViewerModal from "./MaterialViewerModal";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Badge from "./ui/Badge";
import { cn } from "../utils/cn";

export default function AdminPanel() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("lists"); // 'lists' | 'subjects' | 'materials'

  // Lists state
  const [lists, setLists] = useState([]);
  const [subjects, setSubjects] = useState(STATIC_SUBJECTS);
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadWizard, setShowUploadWizard] = useState(false);
  const [testingList, setTestingList] = useState(null);

  // Subject management state
  const [editingSubject, setEditingSubject] = useState(null);
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    id: "",
    name: "",
    emoji: "📚",
    color: "lilac",
    tag: "",
    iconName: "BookOpenText",
    active: true,
  });
  const [isSavingSubject, setIsSavingSubject] = useState(false);
  const [subjectError, setSubjectError] = useState(null);

  // Material management state
  const [isCreatingMaterial, setIsCreatingMaterial] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [previewingMaterial, setPreviewingMaterial] = useState(null);
  const [materialFilterSubject, setMaterialFilterSubject] = useState("");
  const [materialFilterCategory, setMaterialFilterCategory] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [materialError, setMaterialError] = useState(null);
  const [materialForm, setMaterialForm] = useState({
    title: "",
    description: "",
    subject_id: "matematica",
    ano_letivo: "3º ano do Ensino Fundamental",
    category: "apostila",
    published: true,
  });
  const materialFileInputRef = useRef(null);

  const supabase = getSupabaseBrowserClient();

  // Auth protection
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, authLoading, router]);

  const loadData = useCallback(async () => {
    if (!supabase) return;
    try {
      setIsLoading(true);

      // Load subjects, lists, and materials concurrently
      const [subjectsData, listsRes, materialsData] = await Promise.all([
        getSubjectsFromDB(true), // include inactive
        supabase
          .from("exercise_lists")
          .select("*")
          .order("exercise_date", { ascending: false }),
        getMaterials(),
      ]);

      if (listsRes.error) throw listsRes.error;

      setSubjects(subjectsData);
      setLists(listsRes.data || []);
      setMaterials(materialsData || []);
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar dados do admin:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (isAdmin) loadData();
  }, [isAdmin, loadData]);

  // ==================== LIST ACTIONS ====================
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

  // ==================== SUBJECT ACTIONS ====================
  function handleOpenCreateSubject() {
    setEditingSubject(null);
    setSubjectForm({
      id: "",
      name: "",
      emoji: "📚",
      color: "lilac",
      tag: "Estudo & prática",
      iconName: "BookOpenText",
      active: true,
    });
    setSubjectError(null);
    setIsCreatingSubject(true);
  }

  function handleOpenEditSubject(subj) {
    setIsCreatingSubject(false);
    setEditingSubject(subj);
    setSubjectForm({
      id: subj.id,
      name: subj.name,
      emoji: subj.emoji || "📚",
      color: subj.color || "lilac",
      tag: subj.tag || "",
      iconName: subj.iconName || "BookOpenText",
      active: subj.active ?? true,
    });
    setSubjectError(null);
  }

  async function handleSaveSubject(e) {
    e.preventDefault();
    if (!supabase) return;
    setIsSavingSubject(true);
    setSubjectError(null);

    try {
      const cleanId = subjectForm.id
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "")
        .slice(0, 50);

      if (!cleanId) {
        throw new Error("O identificador da matéria é obrigatório.");
      }
      if (!subjectForm.name.trim()) {
        throw new Error("O nome da matéria é obrigatório.");
      }

      const preset = COLOR_PRESETS.find((p) => p.color === subjectForm.color) ?? COLOR_PRESETS[1];

      const payload = {
        id: cleanId,
        name: subjectForm.name.trim(),
        emoji: subjectForm.emoji.trim() || "📚",
        icon: subjectForm.iconName,
        color: preset.color,
        hex: preset.hex,
        gradient: preset.gradient,
        soft: preset.soft,
        tag: subjectForm.tag.trim(),
        active: subjectForm.active,
      };

      if (editingSubject) {
        const { error: updateError } = await supabase
          .from("subjects")
          .update(payload)
          .eq("id", editingSubject.id);

        if (updateError) throw updateError;
      } else {
        payload.order_index = subjects.length + 1;
        const { error: insertError } = await supabase
          .from("subjects")
          .insert(payload);

        if (insertError) {
          if (insertError.code === "23505") {
            throw new Error("Já existe uma matéria com este identificador.");
          }
          throw insertError;
        }
      }

      setIsCreatingSubject(false);
      setEditingSubject(null);
      await loadData();
    } catch (err) {
      setSubjectError(err.message);
    } finally {
      setIsSavingSubject(false);
    }
  }

  async function handleToggleSubjectActive(subj) {
    if (!supabase) return;
    try {
      const nextActive = !subj.active;
      const { error: updateError } = await supabase
        .from("subjects")
        .update({ active: nextActive })
        .eq("id", subj.id);

      if (updateError) throw updateError;

      setSubjects((prev) =>
        prev.map((s) => (s.id === subj.id ? { ...s, active: nextActive } : s))
      );
    } catch (err) {
      alert("Erro ao alterar status da matéria: " + err.message);
    }
  }

  async function handleDeleteSubject(subj) {
    const associatedLists = lists.filter((l) => l.subject === subj.id);
    const associatedMaterials = materials.filter((m) => m.subject_id === subj.id);

    if (associatedLists.length > 0 || associatedMaterials.length > 0) {
      alert(
        `Não é possível excluir "${subj.name}" pois existem ${associatedLists.length} lista(s) e ${associatedMaterials.length} material(is) associados. Você pode desativá-la.`
      );
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir a matéria "${subj.name}"?`)) return;

    try {
      const { error: delError } = await supabase
        .from("subjects")
        .delete()
        .eq("id", subj.id);

      if (delError) throw delError;

      setSubjects((prev) => prev.filter((s) => s.id !== subj.id));
    } catch (err) {
      alert("Erro ao excluir matéria: " + err.message);
    }
  }

  // ==================== MATERIAL ACTIONS ====================
  function handleOpenCreateMaterial() {
    setEditingMaterial(null);
    setSelectedFile(null);
    setMaterialForm({
      title: "",
      description: "",
      subject_id: subjects[0]?.id || "matematica",
      ano_letivo: "3º ano do Ensino Fundamental",
      category: "apostila",
      published: true,
    });
    setMaterialError(null);
    setIsCreatingMaterial(true);
  }

  function handleOpenEditMaterial(mat) {
    setIsCreatingMaterial(false);
    setSelectedFile(null);
    setEditingMaterial(mat);
    setMaterialForm({
      title: mat.title,
      description: mat.description || "",
      subject_id: mat.subject_id,
      ano_letivo: mat.ano_letivo || "3º ano do Ensino Fundamental",
      category: mat.category || "apostila",
      published: mat.published ?? true,
    });
    setMaterialError(null);
  }

  async function handleSaveMaterial(e) {
    e.preventDefault();
    setIsUploadingMaterial(true);
    setMaterialError(null);

    try {
      if (!materialForm.title.trim()) {
        throw new Error("O título do material é obrigatório.");
      }

      if (!editingMaterial && !selectedFile) {
        throw new Error("Por favor, selecione um arquivo (Vídeo, Áudio, Imagem ou PDF) para fazer o upload.");
      }

      let fileInfo = null;

      if (selectedFile) {
        fileInfo = await uploadMaterialFile(selectedFile, {
          subjectId: materialForm.subject_id,
        });
      }

      if (editingMaterial) {
        // Update
        const payload = {
          title: materialForm.title,
          description: materialForm.description,
          subject_id: materialForm.subject_id,
          ano_letivo: materialForm.ano_letivo,
          category: materialForm.category,
          published: materialForm.published,
        };

        if (fileInfo) {
          payload.file_url = fileInfo.fileUrl;
          payload.file_name = fileInfo.fileName;
          payload.file_size = fileInfo.fileSize;
          payload.file_type = fileInfo.fileType;
          payload.media_type = fileInfo.mediaType;
        }

        await updateMaterial(editingMaterial.id, payload);
      } else {
        // Create
        await createMaterial({
          title: materialForm.title,
          description: materialForm.description,
          subject_id: materialForm.subject_id,
          ano_letivo: materialForm.ano_letivo,
          category: materialForm.category,
          published: materialForm.published,
          file_url: fileInfo.fileUrl,
          file_name: fileInfo.fileName,
          file_size: fileInfo.fileSize,
          file_type: fileInfo.fileType,
          media_type: fileInfo.mediaType,
        });
      }

      setIsCreatingMaterial(false);
      setEditingMaterial(null);
      setSelectedFile(null);
      await loadData();
    } catch (err) {
      console.error("Erro ao salvar material:", err);
      setMaterialError(err.message);
    } finally {
      setIsUploadingMaterial(false);
    }
  }

  async function handleTogglePublishMaterial(mat) {
    try {
      await togglePublishMaterial(mat.id, mat.published);
      setMaterials((prev) =>
        prev.map((m) => (m.id === mat.id ? { ...m, published: !m.published } : m))
      );
    } catch (err) {
      alert("Erro ao alterar publicação: " + err.message);
    }
  }

  async function handleDeleteMaterial(mat) {
    if (!confirm(`Tem certeza que deseja excluir o material "${mat.title}"?`)) return;
    try {
      await deleteMaterial(mat);
      setMaterials((prev) => prev.filter((m) => m.id !== mat.id));
    } catch (err) {
      alert("Erro ao excluir material: " + err.message);
    }
  }

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

  // Filtered materials
  const filteredMaterials = materials.filter((m) => {
    const matchSubj = materialFilterSubject ? m.subject_id === materialFilterSubject : true;
    const matchCat = materialFilterCategory ? m.category === materialFilterCategory : true;
    return matchSubj && matchCat;
  });

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

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-ink">⚙️ Painel Administrativo</h1>
          <p className="mt-2 text-ink-soft">
            Gerencie listas de exercícios, matérias e materiais de apoio (vídeos, áudios, imagens, PDFs)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {activeTab === "materials" && (
            <button
              onClick={handleOpenCreateMaterial}
              className="press cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-[#72D6F5] to-[#33BEEC] px-5 py-3 text-sm font-bold text-white shadow-[0_6px_0_#1E9BC7] active:translate-y-1.5 active:shadow-none"
            >
              <FileUp className="h-5 w-5" />
              Novo Material
            </button>
          )}
          {activeTab === "subjects" && (
            <button
              onClick={handleOpenCreateSubject}
              className="press cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-[#3FE3B8] to-[#06C994] px-5 py-3 text-sm font-bold text-white shadow-[0_6px_0_#05A87C] active:translate-y-1.5 active:shadow-none"
            >
              <Plus className="h-5 w-5" />
              Nova Matéria
            </button>
          )}
          <button
            onClick={() => setShowUploadWizard(true)}
            className="press cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-[#B48CFF] to-[#9257FF] px-5 py-3 text-sm font-bold text-white shadow-[0_6px_0_#7A3FE0] active:translate-y-1.5 active:shadow-none"
          >
            <Upload className="h-5 w-5" />
            Importar JSON
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-lilac/15 pb-4">
        <button
          onClick={() => setActiveTab("lists")}
          className={cn(
            "press cursor-pointer flex items-center gap-2 rounded-2xl px-5 py-2.5 font-display text-sm font-bold transition",
            activeTab === "lists"
              ? "bg-lilac text-white shadow-md"
              : "bg-white/70 text-ink hover:bg-white"
          )}
        >
          <ListChecks className="h-4 w-4" />
          Listas de Exercícios ({lists.length})
        </button>
        <button
          onClick={() => setActiveTab("subjects")}
          className={cn(
            "press cursor-pointer flex items-center gap-2 rounded-2xl px-5 py-2.5 font-display text-sm font-bold transition",
            activeTab === "subjects"
              ? "bg-lilac text-white shadow-md"
              : "bg-white/70 text-ink hover:bg-white"
          )}
        >
          <BookOpen className="h-4 w-4" />
          Gestão de Matérias ({subjects.length})
        </button>
        <button
          onClick={() => setActiveTab("materials")}
          className={cn(
            "press cursor-pointer flex items-center gap-2 rounded-2xl px-5 py-2.5 font-display text-sm font-bold transition",
            activeTab === "materials"
              ? "bg-lilac text-white shadow-md"
              : "bg-white/70 text-ink hover:bg-white"
          )}
        >
          <FolderDown className="h-4 w-4" />
          Gestão de Materiais ({materials.length})
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-[#FFE3F0] px-4 py-3 text-sm font-semibold text-[#a62f5f]">
          Erro: {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-ink-soft">
          Carregando dados...
        </div>
      ) : activeTab === "lists" ? (
        /* ==================== TAB 1: LISTS ==================== */
        <div className="space-y-6">
          {/* Summary by subject */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {subjects
              .filter((s) => s.active)
              .map((subject) => {
                const count = lists.filter((l) => l.subject === subject.id).length;
                return (
                  <div
                    key={subject.id}
                    className="clay flex flex-col items-center gap-2 p-4 text-center"
                  >
                    <span className="text-3xl">{subject.emoji}</span>
                    <span className="text-sm font-bold text-ink">{subject.name}</span>
                    <span className="text-2xl font-bold text-lilac">{count}</span>
                  </div>
                );
              })}
          </div>

          {/* Exercise Lists Table */}
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
                    lists.map((list) => {
                      const subjectObj = subjects.find((s) => s.id === list.subject);
                      return (
                        <tr key={list.id} className="hover:bg-white/30 transition">
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#EEE6FF] px-2.5 py-1 text-xs font-bold text-[#A370FF]">
                              <span>{subjectObj?.emoji || "📖"}</span>
                              <span>{subjectObj?.name || list.subject}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-ink max-w-xs truncate">
                            {list.title}
                          </td>
                          <td className="px-4 py-3 text-ink-soft">
                            {new Date(list.exercise_date + "T12:00:00").toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-4 py-3 text-center text-ink font-bold">
                            {list.question_count || 0}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleTogglePublish(list)}
                              className="press cursor-pointer inline-flex items-center justify-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold shadow-sm hover:text-lilac"
                              title={list.published ? "Despublicar" : "Publicar"}
                            >
                              {list.published ? (
                                <>
                                  <Eye className="h-4 w-4 text-emerald-600" />
                                  <span className="text-emerald-700">Sim</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-4 w-4 text-rose-500" />
                                  <span className="text-rose-600">Não</span>
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === "subjects" ? (
        /* ==================== TAB 2: SUBJECTS ==================== */
        <div className="space-y-6">
          {/* Modal / Form for Subject Create/Edit */}
          <AnimatePresence>
            {(isCreatingSubject || editingSubject) && (
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="clay bg-white/95 p-6 shadow-xl"
              >
                <div className="mb-4 flex items-center justify-between border-b border-lilac/15 pb-3">
                  <h3 className="font-display text-xl font-bold text-ink">
                    {editingSubject ? `✏️ Editar Matéria: ${editingSubject.name}` : "✨ Nova Matéria"}
                  </h3>
                  <button
                    onClick={() => {
                      setIsCreatingSubject(false);
                      setEditingSubject(null);
                    }}
                    className="press rounded-full bg-white p-1.5 text-ink-soft hover:text-candy shadow-sm"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {subjectError && (
                  <div className="mb-4 rounded-xl bg-[#FFE3F0] p-3 text-sm font-semibold text-[#a62f5f]">
                    {subjectError}
                  </div>
                )}

                <form onSubmit={handleSaveSubject} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                        Identificador (Slug)
                      </label>
                      <input
                        type="text"
                        disabled={!!editingSubject}
                        placeholder="ex: robotica, artes, ingles"
                        value={subjectForm.id}
                        onChange={(e) =>
                          setSubjectForm({
                            ...subjectForm,
                            id: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                          })
                        }
                        className="w-full rounded-2xl border-2 border-lilac/15 bg-white/90 px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-lilac disabled:opacity-60"
                        required
                      />
                      <span className="mt-1 block text-[11px] text-ink-soft">
                        Usado na URL (ex: /materias/{subjectForm.id || "nome"})
                      </span>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                        Nome de Exibição
                      </label>
                      <input
                        type="text"
                        placeholder="ex: Robótica Educacional"
                        value={subjectForm.name}
                        onChange={(e) =>
                          setSubjectForm({ ...subjectForm, name: e.target.value })
                        }
                        className="w-full rounded-2xl border-2 border-lilac/15 bg-white/90 px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-lilac"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                        Emoji
                      </label>
                      <input
                        type="text"
                        value={subjectForm.emoji}
                        onChange={(e) =>
                          setSubjectForm({ ...subjectForm, emoji: e.target.value })
                        }
                        className="w-full rounded-2xl border-2 border-lilac/15 bg-white/90 px-4 py-2.5 text-center text-lg font-bold text-ink outline-none focus:border-lilac"
                        maxLength={4}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                        Ícone
                      </label>
                      <select
                        value={subjectForm.iconName}
                        onChange={(e) =>
                          setSubjectForm({ ...subjectForm, iconName: e.target.value })
                        }
                        className="w-full rounded-2xl border-2 border-lilac/15 bg-white/90 px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-lilac"
                      >
                        {Object.keys(ICON_MAP).map((iconKey) => (
                          <option key={iconKey} value={iconKey}>
                            {iconKey}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                        Tag / Subtítulo
                      </label>
                      <input
                        type="text"
                        placeholder="ex: Tecnologia & Código"
                        value={subjectForm.tag}
                        onChange={(e) =>
                          setSubjectForm({ ...subjectForm, tag: e.target.value })
                        }
                        className="w-full rounded-2xl border-2 border-lilac/15 bg-white/90 px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-lilac"
                      />
                    </div>
                  </div>

                  {/* Color Palette Selector */}
                  <div>
                    <label className="mb-2 block text-xs font-bold text-ink uppercase tracking-wider">
                      Identidade Visual / Cor
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {COLOR_PRESETS.map((preset) => (
                        <button
                          key={preset.color}
                          type="button"
                          onClick={() =>
                            setSubjectForm({ ...subjectForm, color: preset.color })
                          }
                          className={cn(
                            "press flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold transition",
                            preset.bg,
                            subjectForm.color === preset.color
                              ? "ring-4 ring-offset-2 ring-lilac"
                              : "opacity-80 hover:opacity-100"
                          )}
                        >
                          <span
                            className="h-3.5 w-3.5 rounded-full shadow-inner"
                            style={{ backgroundColor: preset.hex }}
                          />
                          <span className="capitalize text-ink">{preset.color}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSubjectForm({ ...subjectForm, active: !subjectForm.active })
                      }
                      className="press flex items-center gap-2 rounded-xl bg-white/80 px-3 py-1.5 text-xs font-bold text-ink shadow-sm"
                    >
                      {subjectForm.active ? (
                        <>
                          <ToggleRight className="h-5 w-5 text-emerald-600" />
                          <span className="text-emerald-700">Matéria Ativa no site</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-5 w-5 text-ink-soft" />
                          <span className="text-ink-soft">Matéria Oculta (Inativa)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Submit buttons */}
                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingSubject(false);
                        setEditingSubject(null);
                      }}
                      className="press rounded-2xl bg-white/80 px-4 py-2.5 text-sm font-bold text-ink shadow-sm hover:bg-white"
                    >
                      Cancelar
                    </button>
                    <Button
                      type="submit"
                      variant="lilac"
                      size="md"
                      disabled={isSavingSubject}
                    >
                      <span className="flex items-center gap-1.5">
                        <Check className="h-4 w-4" />
                        {isSavingSubject ? "Salvando..." : "Salvar Matéria"}
                      </span>
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Subjects Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subj) => {
              const listCount = lists.filter((l) => l.subject === subj.id).length;
              const materialCount = materials.filter((m) => m.subject_id === subj.id).length;

              return (
                <div
                  key={subj.id}
                  className={cn(
                    "clay group relative flex flex-col justify-between p-5 transition hover:shadow-lg",
                    !subj.active && "opacity-60 bg-gray-50/50"
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-sm"
                          style={{ backgroundColor: `${subj.hex}25` }}
                        >
                          {subj.emoji}
                        </div>
                        <div>
                          <h4 className="font-display text-lg font-bold text-ink">
                            {subj.name}
                          </h4>
                          <span className="font-mono text-xs text-ink-soft">/{subj.id}</span>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                          subj.active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-gray-200 text-gray-700"
                        )}
                      >
                        {subj.active ? "Ativa" : "Oculta"}
                      </span>
                    </div>

                    {subj.tag && (
                      <p className="mt-3 text-xs font-semibold text-ink-soft italic">
                        &ldquo;{subj.tag}&rdquo;
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-lilac/10 px-2.5 py-1 text-xs font-bold text-lilac">
                        {listCount} lista{listCount !== 1 ? "s" : ""}
                      </span>
                      <span className="rounded-full bg-sky/10 px-2.5 py-1 text-xs font-bold text-sky">
                        {materialCount} material{materialCount !== 1 ? "is" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex items-center justify-between border-t border-lilac/10 pt-3">
                    <button
                      onClick={() => handleToggleSubjectActive(subj)}
                      className="press cursor-pointer text-xs font-bold text-ink-soft hover:text-lilac"
                    >
                      {subj.active ? "Desativar" : "Ativar"}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditSubject(subj)}
                        className="press cursor-pointer rounded-full bg-white/80 p-1.5 text-ink-soft shadow-sm hover:text-sky"
                        title="Editar Matéria"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(subj)}
                        className="press cursor-pointer rounded-full bg-white/80 p-1.5 text-ink-soft shadow-sm hover:text-candy"
                        title="Excluir Matéria"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ==================== TAB 3: MATERIALS ==================== */
        <div className="space-y-6">
          {/* Create / Edit Material Modal */}
          <AnimatePresence>
            {(isCreatingMaterial || editingMaterial) && (
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="clay bg-white/95 p-6 shadow-xl"
              >
                <div className="mb-4 flex items-center justify-between border-b border-lilac/15 pb-3">
                  <h3 className="font-display text-xl font-bold text-ink">
                    {editingMaterial
                      ? `✏️ Editar Material: ${editingMaterial.title}`
                      : "📂 Novo Material de Apoio (Vídeo, Áudio, Imagem ou PDF)"}
                  </h3>
                  <button
                    onClick={() => {
                      setIsCreatingMaterial(false);
                      setEditingMaterial(null);
                      setSelectedFile(null);
                    }}
                    className="press rounded-full bg-white p-1.5 text-ink-soft hover:text-candy shadow-sm"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {materialError && (
                  <div className="mb-4 rounded-xl bg-[#FFE3F0] p-3 text-sm font-semibold text-[#a62f5f]">
                    {materialError}
                  </div>
                )}

                <form onSubmit={handleSaveMaterial} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                        Título do Material (Auto-gerado do arquivo ou personalizado)
                      </label>
                      <input
                        type="text"
                        placeholder="ex: Vídeo Explicativo - Sistema Solar"
                        value={materialForm.title}
                        onChange={(e) =>
                          setMaterialForm({ ...materialForm, title: e.target.value })
                        }
                        className="w-full rounded-2xl border-2 border-lilac/15 bg-white/90 px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-lilac"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                        Matéria
                      </label>
                      <select
                        value={materialForm.subject_id}
                        onChange={(e) =>
                          setMaterialForm({ ...materialForm, subject_id: e.target.value })
                        }
                        className="w-full rounded-2xl border-2 border-lilac/15 bg-white/90 px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-lilac"
                      >
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.emoji} {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                        Categoria do Material
                      </label>
                      <select
                        value={materialForm.category}
                        onChange={(e) =>
                          setMaterialForm({ ...materialForm, category: e.target.value })
                        }
                        className="w-full rounded-2xl border-2 border-lilac/15 bg-white/90 px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-lilac"
                      >
                        {MATERIAL_CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.emoji} {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                        Ano Letivo
                      </label>
                      <input
                        type="text"
                        value={materialForm.ano_letivo}
                        onChange={(e) =>
                          setMaterialForm({ ...materialForm, ano_letivo: e.target.value })
                        }
                        className="w-full rounded-2xl border-2 border-lilac/15 bg-white/90 px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-lilac"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                      Descrição / Instruções
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Breve descrição sobre o conteúdo do vídeo, áudio, imagem ou apostila..."
                      value={materialForm.description}
                      onChange={(e) =>
                        setMaterialForm({ ...materialForm, description: e.target.value })
                      }
                      className="w-full rounded-2xl border-2 border-lilac/15 bg-white/90 px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-lilac resize-none"
                    />
                  </div>

                  {/* File Upload Box */}
                  <div>
                    <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                      {editingMaterial ? "Substituir Arquivo (Opcional)" : "Arquivo de Mídia"}
                    </label>

                    <div
                      onClick={() => materialFileInputRef.current?.click()}
                      className={cn(
                        "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition",
                        selectedFile
                          ? "border-emerald-400 bg-emerald-50/50"
                          : "border-lilac/25 bg-lilac/5 hover:border-lilac/50 hover:bg-lilac/10"
                      )}
                    >
                      <input
                        ref={materialFileInputRef}
                        type="file"
                        accept=".mp4,.webm,.ogg,.mov,.mp3,.wav,.m4a,.png,.jpg,.jpeg,.webp,.gif,.svg,.pdf,.doc,.docx,.ppt,.pptx,.txt"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setSelectedFile(file);

                            // Auto-fill title from filename if title empty or default
                            if (!materialForm.title || materialForm.title === "Novo Material") {
                              setMaterialForm((prev) => ({
                                ...prev,
                                title: formatTitleFromFileName(file.name),
                              }));
                            }

                            // Auto-suggest category based on detected media type
                            const detected = detectMediaType(file.type, file.name);
                            if (detected === "video") {
                              setMaterialForm((prev) => ({ ...prev, category: "video" }));
                            } else if (detected === "audio") {
                              setMaterialForm((prev) => ({ ...prev, category: "audio" }));
                            } else if (detected === "image") {
                              setMaterialForm((prev) => ({ ...prev, category: "imagem" }));
                            }
                          }
                        }}
                      />

                      {selectedFile ? (
                        <div className="flex items-center gap-3 text-emerald-800">
                          <Check className="h-6 w-6 text-emerald-600" />
                          <div className="text-left">
                            <p className="text-xs font-bold">{selectedFile.name}</p>
                            <p className="text-[11px] text-emerald-600">
                              {formatFileSize(selectedFile.size)} &middot; Tipo detectado:{" "}
                              <strong>{detectMediaType(selectedFile.type, selectedFile.name)}</strong>
                            </p>
                          </div>
                        </div>
                      ) : editingMaterial ? (
                        <div className="text-xs text-ink-soft">
                          <p className="font-semibold text-ink">
                            Arquivo atual:{" "}
                            <span className="font-mono text-lilac">{editingMaterial.file_name}</span> (
                            {formatFileSize(editingMaterial.file_size)})
                          </p>
                          <p className="mt-1 text-[11px]">Clique para selecionar outro arquivo se desejar substituir.</p>
                        </div>
                      ) : (
                        <div>
                          <FileUp className="mx-auto mb-2 h-8 w-8 text-lilac" />
                          <p className="text-xs font-bold text-ink">
                            Clique ou arraste um Vídeo, Áudio, Imagem (PNG/JPG) ou PDF
                          </p>
                          <p className="mt-1 text-[11px] text-ink-soft">
                            Vídeos (MP4, WebM), Áudios (MP3, WAV), Imagens (PNG, JPG), PDFs (Até 200MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Published status */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setMaterialForm({ ...materialForm, published: !materialForm.published })
                      }
                      className="press flex items-center gap-2 rounded-xl bg-white/80 px-3 py-1.5 text-xs font-bold text-ink shadow-sm"
                    >
                      {materialForm.published ? (
                        <>
                          <ToggleRight className="h-5 w-5 text-emerald-600" />
                          <span className="text-emerald-700">Material publicado para a criança</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-5 w-5 text-ink-soft" />
                          <span className="text-ink-soft">Material oculto (Rascunho)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingMaterial(false);
                        setEditingMaterial(null);
                        setSelectedFile(null);
                      }}
                      className="press rounded-2xl bg-white/80 px-4 py-2.5 text-sm font-bold text-ink shadow-sm hover:bg-white"
                    >
                      Cancelar
                    </button>
                    <Button
                      type="submit"
                      variant="sky"
                      size="md"
                      disabled={isUploadingMaterial}
                    >
                      <span className="flex items-center gap-1.5">
                        <Check className="h-4 w-4" />
                        {isUploadingMaterial ? "Enviando arquivo para o Storage..." : "Salvar Material"}
                      </span>
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filters for materials */}
          <div className="clay-sm flex flex-wrap items-center justify-between gap-3 bg-white/80 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-ink">
              <Filter className="h-4 w-4 text-lilac" />
              <span>Filtrar Materiais:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={materialFilterSubject}
                onChange={(e) => setMaterialFilterSubject(e.target.value)}
                className="rounded-xl border border-lilac/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink outline-none"
              >
                <option value="">Todas as Matérias</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.emoji} {s.name}
                  </option>
                ))}
              </select>

              <select
                value={materialFilterCategory}
                onChange={(e) => setMaterialFilterCategory(e.target.value)}
                className="rounded-xl border border-lilac/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink outline-none"
              >
                <option value="">Todas as Categorias</option>
                {MATERIAL_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>

              {(materialFilterSubject || materialFilterCategory) && (
                <button
                  onClick={() => {
                    setMaterialFilterSubject("");
                    setMaterialFilterCategory("");
                  }}
                  className="press rounded-xl bg-candy-soft px-3 py-1.5 text-xs font-bold text-[#b03b6e]"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Materials Table */}
          <div className="clay overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-ink">Material</th>
                    <th className="px-4 py-3 text-left font-bold text-ink">Matéria</th>
                    <th className="px-4 py-3 text-left font-bold text-ink">Tipo</th>
                    <th className="px-4 py-3 text-center font-bold text-ink">Tamanho</th>
                    <th className="px-4 py-3 text-center font-bold text-ink">Status</th>
                    <th className="px-4 py-3 text-center font-bold text-ink">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/50">
                  {filteredMaterials.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-ink-soft">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FolderDown className="h-8 w-8 text-lilac/40" />
                          <p className="font-semibold">Nenhum material de apoio cadastrado.</p>
                          <p className="text-xs">
                            Clique em <strong>Novo Material</strong> para fazer upload de vídeos, áudios, imagens ou PDFs.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMaterials.map((mat) => {
                      const subjectObj = subjects.find((s) => s.id === mat.subject_id);
                      const catInfo = getCategoryInfo(mat.category);
                      const mediaType =
                        mat.media_type || detectMediaType(mat.file_type, mat.file_name);

                      return (
                        <tr key={mat.id} className="hover:bg-white/30 transition">
                          <td className="px-4 py-3">
                            <div className="min-w-0 max-w-xs sm:max-w-md">
                              <div className="flex items-center gap-1.5">
                                {getMediaIcon(mediaType)}
                                <p className="font-bold text-ink truncate">{mat.title}</p>
                              </div>
                              <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-soft">
                                <span className="font-mono text-[11px] truncate">{mat.file_name}</span>
                                {mat.ano_letivo && (
                                  <>
                                    <span>&middot;</span>
                                    <span>{mat.ano_letivo}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#EEE6FF] px-2.5 py-1 text-xs font-bold text-[#A370FF]">
                              <span>{subjectObj?.emoji || "📚"}</span>
                              <span>{subjectObj?.name || mat.subject_id}</span>
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky/10 px-2.5 py-1 text-xs font-bold text-sky">
                              <span>{catInfo.emoji}</span>
                              <span>{catInfo.label}</span>
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center text-xs font-semibold text-ink-soft">
                            {formatFileSize(mat.file_size)}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleTogglePublishMaterial(mat)}
                              className="press cursor-pointer inline-flex items-center justify-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold shadow-sm hover:text-lilac"
                              title={mat.published ? "Ocultar material" : "Publicar material"}
                            >
                              {mat.published ? (
                                <>
                                  <Eye className="h-4 w-4 text-emerald-600" />
                                  <span className="text-emerald-700">Ativo</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-4 w-4 text-rose-500" />
                                  <span className="text-rose-600">Oculto</span>
                                </>
                              )}
                            </button>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setPreviewingMaterial(mat)}
                                className="press cursor-pointer rounded-full bg-white/80 p-1.5 text-ink-soft shadow-sm hover:text-mint"
                                title="Visualizar / Reproduzir Player"
                              >
                                <Play className="h-4 w-4" />
                              </button>
                              {mat.file_url && (
                                <a
                                  href={mat.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={mat.file_name}
                                  className="press cursor-pointer rounded-full bg-white/80 p-1.5 text-ink-soft shadow-sm hover:text-sky"
                                  title="Baixar Arquivo"
                                >
                                  <Download className="h-4 w-4" />
                                </a>
                              )}
                              <button
                                onClick={() => handleOpenEditMaterial(mat)}
                                className="press cursor-pointer rounded-full bg-white/80 p-1.5 text-ink-soft shadow-sm hover:text-lilac"
                                title="Editar Material"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMaterial(mat)}
                                className="press cursor-pointer rounded-full bg-white/80 p-1.5 text-ink-soft shadow-sm hover:text-candy"
                                title="Excluir Material"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
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
            onSaved={() => loadData()}
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

      {/* Material Viewer Modal for Admin Preview */}
      <AnimatePresence>
        {previewingMaterial && (
          <MaterialViewerModal
            material={previewingMaterial}
            onClose={() => setPreviewingMaterial(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
