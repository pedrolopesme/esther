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
  Gamepad2,
  Trophy,
  Code2,
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
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_LABEL,
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
import {
  getGames,
  uploadGameFile,
  createGame,
  updateGame,
  deleteGame,
  togglePublishGame,
  parseGameHtml,
  buildSlug,
} from "../utils/gameRepository";
import UploadWizard from "./UploadWizard";
import ExerciseDrawer from "./ExerciseDrawer";
import MaterialViewerModal from "./MaterialViewerModal";
import { GameDrawer } from "./GameComponents";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Badge from "./ui/Badge";
import { cn } from "../utils/cn";

export default function AdminPanel() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("lists"); // 'lists' | 'subjects' | 'materials' | 'games'

  // Lists state
  const [lists, setLists] = useState([]);
  const [subjects, setSubjects] = useState(STATIC_SUBJECTS);
  const [materials, setMaterials] = useState([]);
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadWizard, setShowUploadWizard] = useState(false);
  const [testingList, setTestingList] = useState(null);

  // Lists search & filter state
  const [listSearchTitle, setListSearchTitle] = useState("");
  const [listFilterSubject, setListFilterSubject] = useState("");
  const [listFilterGrade, setListFilterGrade] = useState("");
  const [listFilterStatus, setListFilterStatus] = useState(""); // "" | "published" | "draft"
  const [listFilterDate, setListFilterDate] = useState("");
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
  const [isMaterialDragActive, setIsMaterialDragActive] = useState(false);
  const materialDragCounterRef = useRef(0);

  // Games management state
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [testingGame, setTestingGame] = useState(null);
  const [gameFilterSubject, setGameFilterSubject] = useState("");
  const [selectedGameFile, setSelectedGameFile] = useState(null);
  const [selectedGameHtml, setSelectedGameHtml] = useState("");
  const [isUploadingGame, setIsUploadingGame] = useState(false);
  const [gameError, setGameError] = useState(null);
  const [gameForm, setGameForm] = useState({
    slug: "",
    title: "",
    description: "",
    subject_id: "ciencias",
    ano_letivo: "4º ano",
    target_age: 9,
    version: "1.0.0",
    max_score: 100,
    cover_url: "",
    published: true,
    metadata: {},
  });
  const gameFileInputRef = useRef(null);
  const [isGameDragActive, setIsGameDragActive] = useState(false);
  const gameDragCounterRef = useRef(0);

  const supabase = getSupabaseBrowserClient();

  // Auth protection
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, authLoading, router]);

  // Prevent browser default behavior on drop outside targets
  useEffect(() => {
    const preventDefault = (e) => e.preventDefault();
    window.addEventListener("dragover", preventDefault, false);
    window.addEventListener("drop", preventDefault, false);
    return () => {
      window.removeEventListener("dragover", preventDefault, false);
      window.removeEventListener("drop", preventDefault, false);
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!supabase) return;
    try {
      setIsLoading(true);

      const [subjectsData, listsRes, materialsData, gamesData] = await Promise.all([
        getSubjectsFromDB(true), // include inactive
        supabase
          .from("exercise_lists")
          .select("*")
          .order("exercise_date", { ascending: false }),
        getMaterials(),
        getGames(),
      ]);

      if (listsRes.error) throw listsRes.error;

      setSubjects(subjectsData);
      setLists(listsRes.data || []);
      setMaterials(materialsData || []);
      setGames(gamesData || []);
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
    const associatedGames = games.filter((g) => g.subject_id === subj.id);

    if (associatedLists.length > 0 || associatedMaterials.length > 0 || associatedGames.length > 0) {
      alert(
        `Não é possível excluir "${subj.name}" pois existem atividades associadas. Você pode desativá-la.`
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
  function handleSelectMaterialFile(file) {
    if (!file) return;
    setMaterialError(null);

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const formatted = formatFileSize(file.size);
      setMaterialError(
        `O arquivo selecionado (${formatted}) ultrapassa o limite máximo de ${MAX_FILE_SIZE_LABEL} por arquivo do Supabase (plano gratuito). Por favor, comprima o vídeo ou selecione um arquivo menor que 50MB.`
      );
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);

    if (!materialForm.title || materialForm.title === "Novo Material") {
      setMaterialForm((prev) => ({
        ...prev,
        title: formatTitleFromFileName(file.name),
      }));
    }

    const detected = detectMediaType(file.type, file.name);
    if (detected === "video") {
      setMaterialForm((prev) => ({ ...prev, category: "video" }));
    } else if (detected === "audio") {
      setMaterialForm((prev) => ({ ...prev, category: "audio" }));
    } else if (detected === "image") {
      setMaterialForm((prev) => ({ ...prev, category: "imagem" }));
    }
  }

  const handleMaterialDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    materialDragCounterRef.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsMaterialDragActive(true);
    }
  };

  const handleMaterialDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    materialDragCounterRef.current -= 1;
    if (materialDragCounterRef.current <= 0) {
      materialDragCounterRef.current = 0;
      setIsMaterialDragActive(false);
    }
  };

  const handleMaterialDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleMaterialDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    materialDragCounterRef.current = 0;
    setIsMaterialDragActive(false);

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleSelectMaterialFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

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

  // ==================== GAME ACTIONS ====================
  async function handleSelectGameFile(file) {
    if (!file) return;
    setGameError(null);

    if (!file.name.toLowerCase().endsWith(".html") && file.type !== "text/html") {
      setGameError("Por favor, selecione um arquivo de minijogo com extensão .html");
      return;
    }

    try {
      const text = await file.text();
      setSelectedGameFile(file);
      setSelectedGameHtml(text);

      // Parse manifest from HTML
      const parsed = parseGameHtml(text);
      if (parsed) {
        // Detect matching subject from manifest
        const matchedSubj = subjects.find(
          (s) =>
            s.id === parsed.subject?.toLowerCase() ||
            s.name.toLowerCase() === parsed.subject?.toLowerCase()
        );

        setGameForm((prev) => ({
          ...prev,
          title: parsed.title || formatTitleFromFileName(file.name),
          description: parsed.description || "",
          slug: buildSlug(parsed.title || file.name.replace(/\.html$/, "")),
          subject_id: matchedSubj?.id || prev.subject_id || "ciencias",
          ano_letivo: parsed.grade || prev.ano_letivo || "4º ano",
          target_age: parsed.targetAge || prev.target_age || 9,
          version: parsed.version || "1.0.0",
          max_score: parsed.maxScore || 100,
          cover_url: parsed.cover || "",
          metadata: parsed.manifest || {},
        }));
      }
    } catch (err) {
      console.error("Erro ao ler arquivo HTML do jogo:", err);
      setGameError("Não foi possível analisar o arquivo HTML. Verifique a formatação.");
    }
  }

  const handleGameDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    gameDragCounterRef.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsGameDragActive(true);
    }
  };

  const handleGameDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    gameDragCounterRef.current -= 1;
    if (gameDragCounterRef.current <= 0) {
      gameDragCounterRef.current = 0;
      setIsGameDragActive(false);
    }
  };

  const handleGameDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleGameDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    gameDragCounterRef.current = 0;
    setIsGameDragActive(false);

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleSelectGameFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  function handleOpenCreateGame() {
    setEditingGame(null);
    setSelectedGameFile(null);
    setSelectedGameHtml("");
    setGameForm({
      slug: "",
      title: "",
      description: "",
      subject_id: subjects[0]?.id || "ciencias",
      ano_letivo: "4º ano",
      target_age: 9,
      version: "1.0.0",
      max_score: 100,
      cover_url: "",
      published: true,
      metadata: {},
    });
    setGameError(null);
    setIsCreatingGame(true);
  }

  function handleOpenEditGame(gameItem) {
    setIsCreatingGame(false);
    setSelectedGameFile(null);
    setSelectedGameHtml("");
    setEditingGame(gameItem);
    setGameForm({
      slug: gameItem.slug,
      title: gameItem.title,
      description: gameItem.description || "",
      subject_id: gameItem.subject_id,
      ano_letivo: gameItem.ano_letivo || "4º ano",
      target_age: gameItem.target_age || 9,
      version: gameItem.version || "1.0.0",
      max_score: gameItem.max_score || 100,
      cover_url: gameItem.cover_url || "",
      published: gameItem.published ?? true,
      metadata: gameItem.metadata || {},
    });
    setGameError(null);
  }

  async function handleSaveGame(e) {
    e.preventDefault();
    setIsUploadingGame(true);
    setGameError(null);

    try {
      if (!gameForm.title.trim()) {
        throw new Error("O nome/título do jogo é obrigatório.");
      }

      if (!editingGame && !selectedGameFile) {
        throw new Error("Por favor, selecione um arquivo HTML (.html) de jogo.");
      }

      let fileInfo = null;

      if (selectedGameFile) {
        fileInfo = await uploadGameFile(selectedGameFile, {
          subjectId: gameForm.subject_id,
          customSlug: gameForm.slug || buildSlug(gameForm.title),
        });
      }

      if (editingGame) {
        const payload = {
          title: gameForm.title,
          description: gameForm.description,
          subject_id: gameForm.subject_id,
          ano_letivo: gameForm.ano_letivo,
          target_age: Number(gameForm.target_age) || 9,
          version: gameForm.version,
          max_score: Number(gameForm.max_score) || 100,
          cover_url: gameForm.cover_url || null,
          published: gameForm.published,
        };

        if (fileInfo) {
          payload.file_url = fileInfo.fileUrl;
          payload.file_name = fileInfo.fileName;
          payload.file_size = fileInfo.fileSize;
        }

        await updateGame(editingGame.id, payload);
      } else {
        await createGame({
          slug: gameForm.slug || buildSlug(gameForm.title),
          title: gameForm.title,
          description: gameForm.description,
          subject_id: gameForm.subject_id,
          ano_letivo: gameForm.ano_letivo,
          target_age: Number(gameForm.target_age) || 9,
          version: gameForm.version,
          max_score: Number(gameForm.max_score) || 100,
          cover_url: gameForm.cover_url || null,
          published: gameForm.published,
          file_url: fileInfo.fileUrl,
          file_name: fileInfo.fileName,
          file_size: fileInfo.fileSize,
          metadata: gameForm.metadata || {},
        });
      }

      setIsCreatingGame(false);
      setEditingGame(null);
      setSelectedGameFile(null);
      setSelectedGameHtml("");
      await loadData();
    } catch (err) {
      console.error("Erro ao salvar jogo:", err);
      setGameError(err.message);
    } finally {
      setIsUploadingGame(false);
    }
  }

  async function handleTogglePublishGame(gameItem) {
    try {
      await togglePublishGame(gameItem.id, gameItem.published);
      setGames((prev) =>
        prev.map((g) => (g.id === gameItem.id ? { ...g, published: !g.published } : g))
      );
    } catch (err) {
      alert("Erro ao alterar publicação do jogo: " + err.message);
    }
  }

  async function handleDeleteGame(gameItem) {
    if (!confirm(`Tem certeza que deseja excluir o jogo "${gameItem.title}"?`)) return;
    try {
      await deleteGame(gameItem);
      setGames((prev) => prev.filter((g) => g.id !== gameItem.id));
    } catch (err) {
      alert("Erro ao excluir jogo: " + err.message);
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
  // Unique grades for lists
  const uniqueListGrades = Array.from(
    new Set(lists.map((l) => l.ano_letivo).filter(Boolean))
  );

  // Filtered exercise lists
  const filteredLists = lists.filter((l) => {
    const matchTitle = listSearchTitle.trim()
      ? l.title?.toLowerCase().includes(listSearchTitle.toLowerCase().trim()) ||
        l.slug?.toLowerCase().includes(listSearchTitle.toLowerCase().trim())
      : true;
    const matchSubject = listFilterSubject ? l.subject === listFilterSubject : true;
    const matchGrade = listFilterGrade ? l.ano_letivo === listFilterGrade : true;
    const matchStatus =
      listFilterStatus === "published"
        ? l.published === true
        : listFilterStatus === "draft"
        ? l.published === false
        : true;
    const matchDate = listFilterDate
      ? l.exercise_date && l.exercise_date.startsWith(listFilterDate)
      : true;

    return matchTitle && matchSubject && matchGrade && matchStatus && matchDate;
  });

  // Filtered materials
  const filteredMaterials = materials.filter((m) => {
    const matchSubj = materialFilterSubject ? m.subject_id === materialFilterSubject : true;
    const matchCat = materialFilterCategory ? m.category === materialFilterCategory : true;
    return matchSubj && matchCat;
  });

  // Filtered games
  const filteredGames = games.filter((g) => {
    return gameFilterSubject ? g.subject_id === gameFilterSubject : true;
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
            Gerencie listas de exercícios, matérias, materiais de apoio e minijogos educativos
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {activeTab === "games" && (
            <button
              onClick={handleOpenCreateGame}
              className="press cursor-pointer inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-[#B48CFF] to-[#7A3FE0] px-5 py-3 text-sm font-bold text-white shadow-[0_6px_0_#5b21b6] active:translate-y-1.5 active:shadow-none"
            >
              <Gamepad2 className="h-5 w-5" />
              Novo Minijogo (HTML)
            </button>
          )}
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
          onClick={() => setActiveTab("games")}
          className={cn(
            "press cursor-pointer flex items-center gap-2 rounded-2xl px-5 py-2.5 font-display text-sm font-bold transition",
            activeTab === "games"
              ? "bg-lilac text-white shadow-md"
              : "bg-white/70 text-ink hover:bg-white"
          )}
        >
          <Gamepad2 className="h-4 w-4 text-candy" />
          Minijogos Educativos ({games.length})
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
          Materiais de Apoio ({materials.length})
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
          Matérias ({subjects.length})
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
          {/* Filters for Exercise Lists */}
          <div className="clay-sm flex flex-col gap-3 bg-white/85 p-4 sm:p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-ink">
                <Filter className="h-4 w-4 text-lilac" />
                <span>Filtros de Busca:</span>
                <span className="text-xs text-ink-soft font-normal">
                  ({filteredLists.length} {filteredLists.length === 1 ? "lista encontrada" : "listas encontradas"})
                </span>
              </div>

              {(listSearchTitle || listFilterSubject || listFilterGrade || listFilterStatus || listFilterDate) && (
                <button
                  onClick={() => {
                    setListSearchTitle("");
                    setListFilterSubject("");
                    setListFilterGrade("");
                    setListFilterStatus("");
                    setListFilterDate("");
                  }}
                  className="press rounded-xl bg-candy-soft px-3 py-1.5 text-xs font-bold text-[#b03b6e] hover:-translate-y-0.5 transition"
                >
                  <X className="mr-1 inline h-3.5 w-3.5" /> Limpar Filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {/* Search by name / slug */}
              <div>
                <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                  Nome da Lista
                </label>
                <input
                  type="text"
                  placeholder="Buscar por título ou slug..."
                  value={listSearchTitle}
                  onChange={(e) => setListSearchTitle(e.target.value)}
                  className="w-full rounded-xl border border-lilac/20 bg-white px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-lilac transition placeholder:font-normal"
                />
              </div>

              {/* Select Materia */}
              <div>
                <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                  Matéria
                </label>
                <select
                  value={listFilterSubject}
                  onChange={(e) => setListFilterSubject(e.target.value)}
                  className="w-full rounded-xl border border-lilac/20 bg-white px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-lilac transition"
                >
                  <option value="">Todas as Matérias</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.emoji} {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Serie / Ano Letivo */}
              <div>
                <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                  Série / Ano
                </label>
                <select
                  value={listFilterGrade}
                  onChange={(e) => setListFilterGrade(e.target.value)}
                  className="w-full rounded-xl border border-lilac/20 bg-white px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-lilac transition"
                >
                  <option value="">Todas as Séries</option>
                  {uniqueListGrades.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Status */}
              <div>
                <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={listFilterStatus}
                  onChange={(e) => setListFilterStatus(e.target.value)}
                  className="w-full rounded-xl border border-lilac/20 bg-white px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-lilac transition"
                >
                  <option value="">Todos os Status</option>
                  <option value="published">🟢 Publicadas (Ativas)</option>
                  <option value="draft">🔴 Ocultas (Rascunho)</option>
                </select>
              </div>

              {/* Filter by Date */}
              <div>
                <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                  Data
                </label>
                <input
                  type="date"
                  value={listFilterDate}
                  onChange={(e) => setListFilterDate(e.target.value)}
                  className="w-full rounded-xl border border-lilac/20 bg-white px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-lilac transition"
                />
              </div>
            </div>
          </div>

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
                  {filteredLists.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-ink-soft">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ListChecks className="h-8 w-8 text-lilac/40" />
                          <p className="font-semibold">Nenhuma lista de exercícios encontrada.</p>
                          <p className="text-xs">
                            {(listSearchTitle || listFilterSubject || listFilterGrade || listFilterStatus || listFilterDate)
                              ? "Tente ajustar ou limpar os filtros de busca acima."
                              : "Importe um arquivo JSON para cadastrar novas listas de exercícios."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLists.map((list) => {
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
      ) : activeTab === "games" ? (
        /* ==================== TAB 2: GAMES ==================== */
        <div className="space-y-6">
          {/* Modal / Form for Game Create/Edit */}
          <AnimatePresence>
            {(isCreatingGame || editingGame) && (
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="clay bg-white/95 p-6 shadow-xl"
              >
                <div className="mb-4 flex items-center justify-between border-b border-lilac/15 pb-3">
                  <h3 className="font-display text-xl font-bold text-ink">
                    {editingGame
                      ? `✏️ Editar Minijogo: ${editingGame.title}`
                      : "🎮 Novo Minijogo Educativo (Arquivo HTML Único)"}
                  </h3>
                  <button
                    onClick={() => {
                      setIsCreatingGame(false);
                      setEditingGame(null);
                      setSelectedGameFile(null);
                      setSelectedGameHtml("");
                    }}
                    className="press rounded-full bg-white p-1.5 text-ink-soft hover:text-candy shadow-sm"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {gameError && (
                  <div className="mb-4 rounded-xl bg-[#FFE3F0] p-3 text-sm font-semibold text-[#a62f5f]">
                    {gameError}
                  </div>
                )}

                <form onSubmit={handleSaveGame} className="space-y-4">
                  {/* File Upload Box with Dropzone */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                        {editingGame ? "Substituir Arquivo HTML (Opcional)" : "Arquivo do Jogo (HTML Único)"}
                      </label>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-200">
                        Padrão: Single-File com #game-manifest
                      </span>
                    </div>

                    <div
                      onDragEnter={handleGameDragEnter}
                      onDragLeave={handleGameDragLeave}
                      onDragOver={handleGameDragOver}
                      onDrop={handleGameDrop}
                      onClick={() => gameFileInputRef.current?.click()}
                      className={cn(
                        "flex cursor-pointer flex-col items-center justify-center rounded-3xl border-3 border-dashed p-7 text-center transition-all duration-200",
                        isGameDragActive
                          ? "border-indigo-500 bg-indigo-500/20 scale-[1.02] shadow-xl ring-4 ring-indigo-500/30"
                          : selectedGameFile
                          ? "border-emerald-400 bg-emerald-50/50 shadow-sm"
                          : "border-lilac/25 bg-lilac/5 hover:border-lilac/50 hover:bg-lilac/10"
                      )}
                    >
                      <input
                        ref={gameFileInputRef}
                        type="file"
                        accept=".html,text/html"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleSelectGameFile(e.target.files[0]);
                          }
                        }}
                      />

                      {selectedGameFile ? (
                        <div className="flex items-center gap-3 text-emerald-800">
                          <Check className="h-7 w-7 text-emerald-600 shrink-0" />
                          <div className="text-left">
                            <p className="text-sm font-bold">{selectedGameFile.name}</p>
                            <p className="text-xs text-emerald-600">
                              {formatFileSize(selectedGameFile.size)} &middot; Manifest detectado com sucesso!
                            </p>
                          </div>
                        </div>
                      ) : editingGame ? (
                        <div className="text-xs text-ink-soft">
                          <p className="font-semibold text-ink">
                            Arquivo atual:{" "}
                            <span className="font-mono text-lilac">{editingGame.file_name}</span> (
                            {formatFileSize(editingGame.file_size)})
                          </p>
                          <p className="mt-1 text-[11px]">
                            {isGameDragActive
                              ? "Solte o arquivo para substituir!"
                              : "Arraste um novo arquivo .html ou clique para substituir."}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className={cn(
                            "mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl transition-transform duration-200",
                            isGameDragActive ? "bg-indigo-600 text-white scale-110 shadow-lg" : "bg-lilac/15 text-lilac"
                          )}>
                            <Gamepad2 className="h-7 w-7" />
                          </div>
                          <p className="text-sm font-bold text-ink">
                            {isGameDragActive
                              ? "Solte o arquivo HTML do minijogo aqui!"
                              : "Clique ou arraste o arquivo .html compilado do jogo"}
                          </p>
                          <p className="mt-1 text-xs text-ink-soft">
                            HTML autossuficiente com assets embutidos em Base64 (Máx. 50MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                        Nome do Jogo
                      </label>
                      <input
                        type="text"
                        placeholder="ex: Nadando pela Imigração"
                        value={gameForm.title}
                        onChange={(e) =>
                          setGameForm({
                            ...gameForm,
                            title: e.target.value,
                            slug: !editingGame ? buildSlug(e.target.value) : gameForm.slug,
                          })
                        }
                        className="w-full rounded-2xl border-2 border-lilac/15 bg-white/90 px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-lilac"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                        Matéria Associada
                      </label>
                      <select
                        value={gameForm.subject_id}
                        onChange={(e) =>
                          setGameForm({ ...gameForm, subject_id: e.target.value })
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

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                        Ano Letivo / Série
                      </label>
                      <input
                        type="text"
                        value={gameForm.ano_letivo}
                        onChange={(e) =>
                          setGameForm({ ...gameForm, ano_letivo: e.target.value })
                        }
                        className="w-full rounded-2xl border-2 border-lilac/15 bg-white/90 px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-lilac"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                        Pontuação Máxima
                      </label>
                      <input
                        type="number"
                        value={gameForm.max_score}
                        onChange={(e) =>
                          setGameForm({ ...gameForm, max_score: e.target.value })
                        }
                        className="w-full rounded-2xl border-2 border-lilac/15 bg-white/90 px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-lilac"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                        Versão
                      </label>
                      <input
                        type="text"
                        value={gameForm.version}
                        onChange={(e) =>
                          setGameForm({ ...gameForm, version: e.target.value })
                        }
                        className="w-full rounded-2xl border-2 border-lilac/15 bg-white/90 px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-lilac font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                      Descrição / Objetivos de Aprendizagem
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Breve resumo da atividade, regras ou contexto pedagógico..."
                      value={gameForm.description}
                      onChange={(e) =>
                        setGameForm({ ...gameForm, description: e.target.value })
                      }
                      className="w-full rounded-2xl border-2 border-lilac/15 bg-white/90 px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-lilac resize-none"
                    />
                  </div>

                  {/* Thumbnail / Cover preview if extracted */}
                  {gameForm.cover_url && (
                    <div>
                      <label className="mb-1 block text-xs font-bold text-ink uppercase tracking-wider">
                        Capa / Thumbnail Extraída
                      </label>
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={gameForm.cover_url}
                          alt="Cover"
                          className="h-16 w-28 rounded-xl object-cover shadow-sm border border-lilac/20"
                        />
                        <span className="text-xs text-ink-soft">
                          Extraída automaticamente da tag <code>#game-manifest</code>.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Published status */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setGameForm({ ...gameForm, published: !gameForm.published })
                      }
                      className="press flex items-center gap-2 rounded-xl bg-white/80 px-3 py-1.5 text-xs font-bold text-ink shadow-sm"
                    >
                      {gameForm.published ? (
                        <>
                          <ToggleRight className="h-5 w-5 text-emerald-600" />
                          <span className="text-emerald-700">Minijogo publicado para as crianças</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-5 w-5 text-ink-soft" />
                          <span className="text-ink-soft">Minijogo oculto (Rascunho)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center gap-3 pt-3 border-t border-lilac/10">
                    <div>
                      {(selectedGameHtml || editingGame?.file_url) && (
                        <button
                          type="button"
                          onClick={() =>
                            setTestingGame(
                              editingGame || {
                                title: gameForm.title || "Preview",
                                subject_id: gameForm.subject_id,
                                ano_letivo: gameForm.ano_letivo,
                                max_score: gameForm.max_score,
                                version: gameForm.version,
                                rawHtml: selectedGameHtml,
                              }
                            )
                          }
                          className="press cursor-pointer flex items-center gap-1.5 rounded-2xl bg-indigo-50 border border-indigo-200 px-4 py-2.5 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-100"
                        >
                          <Play className="h-4 w-4" />
                          Testar no Drawer Lateral
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingGame(false);
                          setEditingGame(null);
                          setSelectedGameFile(null);
                          setSelectedGameHtml("");
                        }}
                        className="press rounded-2xl bg-white/80 px-4 py-2.5 text-sm font-bold text-ink shadow-sm hover:bg-white"
                      >
                        Cancelar
                      </button>
                      <Button
                        type="submit"
                        variant="lilac"
                        size="md"
                        disabled={isUploadingGame}
                      >
                        <span className="flex items-center gap-1.5">
                          <Check className="h-4 w-4" />
                          {isUploadingGame ? "Enviando jogo..." : "Salvar Minijogo"}
                        </span>
                      </Button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter Bar */}
          <div className="clay-sm flex flex-wrap items-center justify-between gap-3 bg-white/80 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-ink">
              <Filter className="h-4 w-4 text-lilac" />
              <span>Filtrar Minijogos:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={gameFilterSubject}
                onChange={(e) => setGameFilterSubject(e.target.value)}
                className="rounded-xl border border-lilac/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink outline-none"
              >
                <option value="">Todas as Matérias</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.emoji} {s.name}
                  </option>
                ))}
              </select>

              {gameFilterSubject && (
                <button
                  onClick={() => setGameFilterSubject("")}
                  className="press rounded-xl bg-candy-soft px-3 py-1.5 text-xs font-bold text-[#b03b6e]"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Games Table */}
          <div className="clay overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-ink">Minijogo</th>
                    <th className="px-4 py-3 text-left font-bold text-ink">Matéria</th>
                    <th className="px-4 py-3 text-center font-bold text-ink">Pontuação Máx</th>
                    <th className="px-4 py-3 text-center font-bold text-ink">Partidas</th>
                    <th className="px-4 py-3 text-center font-bold text-ink">Status</th>
                    <th className="px-4 py-3 text-center font-bold text-ink">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/50">
                  {filteredGames.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-ink-soft">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Gamepad2 className="h-8 w-8 text-lilac/40" />
                          <p className="font-semibold">Nenhum minijogo educativo cadastrado.</p>
                          <p className="text-xs">
                            Clique em <strong>Novo Minijogo</strong> para fazer upload de arquivos HTML compilados com o manifest.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredGames.map((gameItem) => {
                      const subjectObj = subjects.find((s) => s.id === gameItem.subject_id);

                      return (
                        <tr key={gameItem.id} className="hover:bg-white/30 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0 max-w-xs sm:max-w-md">
                              {gameItem.cover_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={gameItem.cover_url}
                                  alt={gameItem.title}
                                  className="h-10 w-16 shrink-0 rounded-lg object-cover shadow-sm border border-slate-200"
                                />
                              ) : (
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-xl text-indigo-600 border border-indigo-100">
                                  🎮
                                </span>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-ink truncate">{gameItem.title}</p>
                                <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-soft">
                                  <span className="font-mono text-[11px] truncate">
                                    {gameItem.file_name}
                                  </span>
                                  <span>&middot;</span>
                                  <span>{gameItem.ano_letivo}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#EEE6FF] px-2.5 py-1 text-xs font-bold text-[#A370FF]">
                              <span>{subjectObj?.emoji || "📚"}</span>
                              <span>{subjectObj?.name || gameItem.subject_id}</span>
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center text-xs font-bold text-ink">
                            {gameItem.max_score || 100} pts
                          </td>

                          <td className="px-4 py-3 text-center text-xs font-bold text-indigo-700">
                            {gameItem.play_count || 0}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleTogglePublishGame(gameItem)}
                              className="press cursor-pointer inline-flex items-center justify-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold shadow-sm hover:text-lilac"
                              title={gameItem.published ? "Ocultar jogo" : "Publicar jogo"}
                            >
                              {gameItem.published ? (
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
                                onClick={() => setTestingGame(gameItem)}
                                className="press cursor-pointer rounded-full bg-white/80 p-1.5 text-ink-soft shadow-sm hover:text-mint"
                                title="Testar no Drawer Lateral"
                              >
                                <Play className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEditGame(gameItem)}
                                className="press cursor-pointer rounded-full bg-white/80 p-1.5 text-ink-soft shadow-sm hover:text-lilac"
                                title="Editar Minijogo"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteGame(gameItem)}
                                className="press cursor-pointer rounded-full bg-white/80 p-1.5 text-ink-soft shadow-sm hover:text-candy"
                                title="Excluir Minijogo"
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
      ) : activeTab === "materials" ? (
        /* ==================== TAB 3: MATERIALS ==================== */
        <div className="space-y-6">
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

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                        {editingMaterial ? "Substituir Arquivo (Opcional)" : "Arquivo de Mídia"}
                      </label>
                      <span className="rounded-full bg-sun-soft px-2 py-0.5 text-[11px] font-bold text-[#b07804]">
                        Limite máx: {MAX_FILE_SIZE_LABEL} por arquivo
                      </span>
                    </div>

                    <div
                      onDragEnter={handleMaterialDragEnter}
                      onDragLeave={handleMaterialDragLeave}
                      onDragOver={handleMaterialDragOver}
                      onDrop={handleMaterialDrop}
                      onClick={() => materialFileInputRef.current?.click()}
                      className={cn(
                        "flex cursor-pointer flex-col items-center justify-center rounded-3xl border-3 border-dashed p-8 text-center transition-all duration-200",
                        isMaterialDragActive
                          ? "border-sky bg-sky/20 scale-[1.02] shadow-xl ring-4 ring-sky/30"
                          : selectedFile
                          ? "border-emerald-400 bg-emerald-50/50 shadow-sm"
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
                            handleSelectMaterialFile(e.target.files[0]);
                          }
                        }}
                      />

                      {selectedFile ? (
                        <div className="flex items-center gap-3 text-emerald-800">
                          <Check className="h-7 w-7 text-emerald-600 shrink-0" />
                          <div className="text-left">
                            <p className="text-sm font-bold">{selectedFile.name}</p>
                            <p className="text-xs text-emerald-600">
                              {formatFileSize(selectedFile.size)} &middot; Tipo detectado:{" "}
                              <strong className="capitalize">{detectMediaType(selectedFile.type, selectedFile.name)}</strong>
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
                          <p className="mt-1 text-[11px]">
                            {isMaterialDragActive
                              ? "Solte o arquivo para substituir!"
                              : "Arraste um novo arquivo ou clique para substituir."}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className={cn(
                            "mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl transition-transform duration-200",
                            isMaterialDragActive ? "bg-sky text-white scale-110 shadow-lg" : "bg-lilac/15 text-lilac"
                          )}>
                            <FileUp className="h-7 w-7" />
                          </div>
                          <p className="text-sm font-bold text-ink">
                            {isMaterialDragActive
                              ? "Solte o arquivo de mídia aqui!"
                              : "Clique ou arraste um Vídeo, Áudio, Imagem (PNG/JPG) ou PDF"}
                          </p>
                          <p className="mt-1 text-xs text-ink-soft">
                            MP4, WebM, MP3, WAV, PNG, JPG, PDF (Limite máx: <strong>50MB</strong>)
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
      ) : (
        /* ==================== TAB 4: SUBJECTS ==================== */
        <div className="space-y-6">
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
              const gameCount = games.filter((g) => g.subject_id === subj.id).length;

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

                    <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="rounded-full bg-lilac/10 px-2.5 py-0.5 font-bold text-lilac">
                        {listCount} listas
                      </span>
                      <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 font-bold text-indigo-700">
                        {gameCount} jogos
                      </span>
                      <span className="rounded-full bg-sky/10 px-2.5 py-0.5 font-bold text-sky">
                        {materialCount} materiais
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

      {/* Game Testing Drawer */}
      <AnimatePresence>
        {testingGame && (
          <GameDrawer
            game={testingGame}
            rawHtml={testingGame.rawHtml}
            onClose={() => setTestingGame(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
