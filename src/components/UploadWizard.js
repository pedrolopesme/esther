"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileJson,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Sparkles,
  Eye,
  Plus,
} from "lucide-react";
import { cn } from "../utils/cn";
import {
  SUBJECTS as STATIC_SUBJECTS,
  COLOR_PRESETS,
  getSubjectsFromDB,
  findOrCreateSubject,
  resolveSubject,
} from "../utils/subjects";
import { getSupabaseBrowserClient } from "../utils/supabase";
import Button from "./ui/Button";

const EXERCISE_TYPES = {
  "multiple-choice": "Múltipla escolha",
  "fill-gap": "Preencher lacuna",
  "true-false": "Verdadeiro ou falso",
};

function buildSlug(title) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
}

function detectSubjectSlug(materia, availableSubjects = []) {
  if (!materia) return availableSubjects[0]?.id || "matematica";
  const lower = materia.toLowerCase().trim();

  // Try direct match against available subjects
  const exact = availableSubjects.find(
    (s) => s.id === lower || s.name.toLowerCase() === lower
  );
  if (exact) return exact.id;

  const partial = availableSubjects.find(
    (s) => s.name.toLowerCase().includes(lower) || lower.includes(s.id)
  );
  if (partial) return partial.id;

  const map = {
    matem: "matematica",
    portug: "portugues",
    ingl: "ingles",
    geograf: "geografia",
    histór: "historia",
    histor: "historia",
    ciênc: "ciencias",
    cienc: "ciencias",
  };
  for (const [key, val] of Object.entries(map)) {
    if (lower.includes(key)) {
      const match = availableSubjects.find((s) => s.id === val);
      if (match) return match.id;
    }
  }

  return buildSlug(materia) || availableSubjects[0]?.id || "matematica";
}

function validateExercises(exercises) {
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return "Exercícios devem ser um array não vazio.";
  }
  const validTypes = ["multiple-choice", "fill-gap", "true-false"];
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    if (!ex.question || typeof ex.question !== "string") {
      return `Exercício ${i + 1}: campo "question" obrigatório.`;
    }
    if (!ex.type || !validTypes.includes(ex.type)) {
      return `Exercício ${i + 1}: tipo inválido "${ex.type}". Use: ${validTypes.join(", ")}`;
    }
    if (!Array.isArray(ex.options) || ex.options.length < 2) {
      return `Exercício ${i + 1}: precisa de ao menos 2 opções.`;
    }
    if (typeof ex.correctIndex !== "number" || ex.correctIndex < 0) {
      return `Exercício ${i + 1}: "correctIndex" inválido.`;
    }
  }
  return null;
}

export default function UploadWizard({ onClose, onSaved }) {
  const [step, setStep] = useState(0);
  const [subjects, setSubjects] = useState(STATIC_SUBJECTS);
  const [jsonError, setJsonError] = useState(null);
  const [rawExercises, setRawExercises] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "matematica",
    slug: "",
    ano_letivo: "3º ano do Ensino Fundamental",
    exercise_date: new Date().toISOString().slice(0, 10),
  });
  const [stats, setStats] = useState({ total: 0, types: {} });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Drag and drop state
  const [isDragActive, setIsDragActive] = useState(false);
  const dragCounterRef = useRef(0);

  // Quick subject creation
  const [showQuickCreateSubject, setShowQuickCreateSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectEmoji, setNewSubjectEmoji] = useState("📚");
  const [newSubjectColor, setNewSubjectColor] = useState("lilac");
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);

  const fileRef = useRef(null);
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    async function loadSubjects() {
      const data = await getSubjectsFromDB(false);
      setSubjects(data);
    }
    loadSubjects();
  }, []);

  const handleFile = useCallback((file) => {
    setJsonError(null);
    if (!file) return;

    // Check extension or type
    if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
      setJsonError("Por favor, selecione ou arraste um arquivo com extensão .json");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const exercises = json.exercises || json;
        const err = validateExercises(exercises);
        if (err) {
          setJsonError(err);
          return;
        }

        setRawExercises(exercises);

        const title = json.title || json.nome || file.name.replace(/\.json$/, "");
        const description = json.description || "";
        const materia = json.materia || "";
        const detectedSubj = detectSubjectSlug(materia, subjects);
        const date = json.data || json.date || new Date().toISOString().slice(0, 10);

        const typeCounts = {};
        exercises.forEach((ex) => {
          typeCounts[ex.type] = (typeCounts[ex.type] || 0) + 1;
        });

        setFormData({
          title,
          description,
          subject: detectedSubj,
          slug: buildSlug(title),
          ano_letivo: json.ano_letivo || "3º ano do Ensino Fundamental",
          exercise_date: date,
        });
        setStats({ total: exercises.length, types: typeCounts });
        setStep(1);
      } catch {
        setJsonError("Arquivo JSON inválido. Confira a formatação.");
      }
    };
    reader.readAsText(file);
  }, [subjects]);

  // Window-level and modal-level drag event listeners
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragActive(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragActive(false);

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
      e.dataTransfer.clearData();
    }
  };

  // Prevent browser from navigating or opening dropped file accidentally
  useEffect(() => {
    const preventDefaults = (e) => {
      e.preventDefault();
    };
    window.addEventListener("dragover", preventDefaults, false);
    window.addEventListener("drop", preventDefaults, false);
    return () => {
      window.removeEventListener("dragover", preventDefaults, false);
      window.removeEventListener("drop", preventDefaults, false);
    };
  }, []);

  async function handleQuickCreateSubject() {
    if (!newSubjectName.trim()) return;
    setIsCreatingSubject(true);
    try {
      const created = await findOrCreateSubject({
        id: buildSlug(newSubjectName),
        name: newSubjectName.trim(),
        emoji: newSubjectEmoji.trim() || "📚",
        color: newSubjectColor,
        tag: "Estudo & prática",
      });

      if (created) {
        setSubjects((prev) => {
          const exists = prev.some((s) => s.id === created.id);
          return exists ? prev : [...prev, created];
        });
        setFormData((prev) => ({ ...prev, subject: created.id }));
        setShowQuickCreateSubject(false);
        setNewSubjectName("");
      }
    } catch (err) {
      alert("Erro ao criar matéria: " + err.message);
    } finally {
      setIsCreatingSubject(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveError(null);

    try {
      const chosenSubject = subjects.find((s) => s.id === formData.subject);

      // Ensure subject exists in database before saving list
      if (!chosenSubject) {
        await findOrCreateSubject({
          id: formData.subject,
          name: formData.subject,
          emoji: "📚",
          color: "lilac",
        });
      }

      const row = {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        slug: formData.slug || buildSlug(formData.title),
        materia: chosenSubject?.name || formData.subject,
        ano_letivo: formData.ano_letivo,
        exercise_date: formData.exercise_date,
        exercises: rawExercises,
        published: true,
      };

      const { error: insertError } = await supabase
        .from("exercise_lists")
        .insert(row);

      if (insertError) throw insertError;

      onSaved?.();
      onClose?.();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  const subjectInfo =
    subjects.find((s) => s.id === formData.subject) ||
    STATIC_SUBJECTS.find((s) => s.id === formData.subject) ||
    resolveSubject({ id: formData.subject, name: formData.subject });

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <motion.div
        className={cn(
          "clay relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-0 transition-all duration-200",
          isDragActive && step === 0 && "ring-4 ring-lilac scale-[1.01] shadow-2xl"
        )}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-lilac to-sky p-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/30 backdrop-blur-sm">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Nova Lista de Exercícios
              </h2>
              <p className="text-sm text-white/80">
                {step === 0 && "Envie o arquivo JSON"}
                {step === 1 && "Confira os detalhes e matéria"}
                {step === 2 && "Revise e salve"}
              </p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="mt-4 flex gap-2">
            {["Upload", "Detalhes", "Revisão"].map((label, i) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                    i < step && "bg-white text-lilac",
                    i === step && "bg-white text-lilac ring-2 ring-white/50",
                    i > step && "bg-white/25 text-white/60"
                  )}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    i <= step ? "text-white" : "text-white/50"
                  )}
                >
                  {label}
                </span>
                {i < 2 && <div className="h-0.5 flex-1 rounded bg-white/20" />}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* STEP 0: Upload */}
            {step === 0 && (
              <motion.div
                key="upload"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-4 rounded-3xl border-3 border-dashed p-10 text-center transition-all duration-200",
                    isDragActive
                      ? "border-lilac bg-lilac/20 scale-[1.02] shadow-xl ring-4 ring-lilac/30"
                      : "border-lilac/30 bg-lilac/5 hover:border-lilac/60 hover:bg-lilac/10"
                  )}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                >
                  <div className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-200",
                    isDragActive ? "bg-lilac text-white scale-110 shadow-lg" : "bg-lilac/15 text-lilac"
                  )}>
                    <FileJson className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-ink">
                      {isDragActive ? "Solte o arquivo JSON aqui!" : "Arraste o arquivo JSON aqui"}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {isDragActive ? "Solte para importar os exercícios" : "ou clique para selecionar do computador"}
                    </p>
                  </div>
                  <span className="rounded-full bg-lilac/15 px-3 py-1 text-xs font-bold text-lilac">
                    .json
                  </span>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>

                {jsonError && (
                  <motion.div
                    className="mt-4 flex items-start gap-3 rounded-xl bg-[#FFE3F0] p-4"
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                  >
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#FF70A6]" />
                    <p className="text-sm font-semibold text-[#a62f5f]">{jsonError}</p>
                  </motion.div>
                )}

                <div className="mt-6 rounded-xl bg-white/60 p-4">
                  <p className="mb-2 text-sm font-bold text-ink">Formato esperado:</p>
                  <pre className="overflow-x-auto rounded-lg bg-ink/5 p-3 text-xs text-ink-soft">
{`{
  "title": "Nome da lista",
  "description": "Descrição curta",
  "materia": "Ciências",
  "ano_letivo": "4º ano do Ensino Fundamental",
  "data": "2026-08-22",
  "exercises": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "Pergunta aqui?",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explicacao": "Explicação",
      "dica": "Dica opcional"
    }
  ]
}`}
                  </pre>
                </div>
              </motion.div>
            )}

            {/* STEP 1: Metadata */}
            {step === 1 && (
              <motion.div
                key="details"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Stats pill */}
                <div className="flex items-center gap-3 rounded-xl bg-[#EEE6FF] p-3">
                  <Sparkles className="h-5 w-5 text-[#A370FF]" />
                  <span className="text-sm font-bold text-ink">
                    {stats.total} exercício{stats.total !== 1 && "s"} detectado{stats.total !== 1 && "s"}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(stats.types).map(([type, count]) => (
                      <span
                        key={type}
                        className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold text-ink-soft"
                      >
                        {EXERCISE_TYPES[type] || type}: {count}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Subject Selector */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-sm font-bold text-ink">
                      Matéria Associada
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowQuickCreateSubject(!showQuickCreateSubject)}
                      className="press cursor-pointer flex items-center gap-1 text-xs font-bold text-lilac hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {showQuickCreateSubject ? "Fechar nova matéria" : "Criar nova matéria"}
                    </button>
                  </div>

                  {/* Quick create inline form */}
                  {showQuickCreateSubject && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mb-3 rounded-2xl bg-lilac/10 p-3.5 border border-lilac/20"
                    >
                      <p className="mb-2 text-xs font-bold text-ink">
                        Adicionar nova matéria rapidamente:
                      </p>
                      <div className="flex flex-wrap gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Nome da matéria (ex: Robótica)"
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          className="flex-1 min-w-[160px] rounded-xl border border-lilac/20 bg-white px-3 py-1.5 text-xs font-semibold text-ink outline-none focus:border-lilac"
                        />
                        <input
                          type="text"
                          value={newSubjectEmoji}
                          onChange={(e) => setNewSubjectEmoji(e.target.value)}
                          className="w-12 rounded-xl border border-lilac/20 bg-white px-2 py-1.5 text-center text-xs font-bold text-ink outline-none"
                          title="Emoji"
                          maxLength={3}
                        />
                        <select
                          value={newSubjectColor}
                          onChange={(e) => setNewSubjectColor(e.target.value)}
                          className="rounded-xl border border-lilac/20 bg-white px-2 py-1.5 text-xs font-semibold text-ink outline-none"
                        >
                          {COLOR_PRESETS.map((p) => (
                            <option key={p.color} value={p.color}>
                              {p.color}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          variant="lilac"
                          size="sm"
                          onClick={handleQuickCreateSubject}
                          disabled={isCreatingSubject || !newSubjectName.trim()}
                        >
                          Criar e Selecionar
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {subjects.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, subject: s.id })}
                        className={cn(
                          "press cursor-pointer flex items-center gap-2 rounded-xl p-2.5 text-left transition-all",
                          formData.subject === s.id
                            ? "bg-white ring-2 ring-lilac shadow-md"
                            : "bg-white/60 hover:bg-white/90 shadow-sm"
                        )}
                      >
                        <span className="text-xl">{s.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-ink">{s.name}</p>
                          <span className="text-[10px] text-ink-soft block font-mono">
                            /{s.id}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-ink">
                    Título da Lista
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border-2 border-lilac/15 bg-white/80 px-4 py-2.5 text-ink outline-none focus:border-lilac transition"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-ink">
                    Slug (identificador na URL)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-soft whitespace-nowrap">
                      {formData.subject}/
                    </span>
                    <input
                      type="text"
                      className="flex-1 rounded-xl border-2 border-lilac/15 bg-white/80 px-4 py-2.5 text-ink outline-none focus:border-lilac transition font-mono text-sm"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      className="press cursor-pointer rounded-lg bg-[#EEE6FF] px-2.5 py-2 text-xs font-bold text-[#A370FF] hover:bg-[#DDD0FF] transition"
                      onClick={() =>
                        setFormData({ ...formData, slug: buildSlug(formData.title) })
                      }
                      title="Gerar slug a partir do título"
                    >
                      Auto
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-bold text-ink">
                    Descrição
                  </label>
                  <textarea
                    className="w-full rounded-xl border-2 border-lilac/15 bg-white/80 px-4 py-2.5 text-ink outline-none focus:border-lilac transition resize-none"
                    rows="3"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-ink">
                      Data dos exercícios
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-xl border-2 border-lilac/15 bg-white/80 px-4 py-2.5 text-ink outline-none focus:border-lilac transition"
                      value={formData.exercise_date}
                      onChange={(e) =>
                        setFormData({ ...formData, exercise_date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-bold text-ink">
                      Ano letivo
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border-2 border-lilac/15 bg-white/80 px-4 py-2.5 text-ink outline-none focus:border-lilac transition"
                      value={formData.ano_letivo}
                      onChange={(e) =>
                        setFormData({ ...formData, ano_letivo: e.target.value })
                      }
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Review */}
            {step === 2 && (
              <motion.div
                key="review"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Summary card */}
                <div className="rounded-xl bg-gradient-to-br from-white/80 to-white/40 p-5">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl shadow-sm"
                      style={{ backgroundColor: `${subjectInfo?.hex || "#A370FF"}25` }}
                    >
                      {subjectInfo?.emoji || "📝"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg font-bold text-ink truncate">
                        {formData.title}
                      </h3>
                      <p className="mt-0.5 text-sm text-ink-soft line-clamp-2">
                        {formData.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                          style={{
                            backgroundColor: `${subjectInfo?.hex || "#A370FF"}20`,
                            color: subjectInfo?.hex || "#A370FF",
                          }}
                        >
                          {subjectInfo?.name}
                        </span>
                        <span className="rounded-full bg-[#E1F6FD] px-2.5 py-0.5 text-xs font-bold text-[#4CC9F0]">
                          {formData.ano_letivo}
                        </span>
                        <span className="rounded-full bg-[#DBF9F1] px-2.5 py-0.5 text-xs font-bold text-[#06D6A0]">
                          {stats.total} questões
                        </span>
                        <span className="rounded-full bg-[#FFF3D6] px-2.5 py-0.5 text-xs font-bold text-[#E8A81E]">
                          {new Date(formData.exercise_date + "T12:00:00").toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exercise preview */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-ink-soft" />
                    <span className="text-sm font-bold text-ink">
                      Prévia dos exercícios
                    </span>
                  </div>
                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl bg-white/50 p-3">
                    {rawExercises.map((ex, i) => (
                      <div
                        key={ex.id || i}
                        className="flex items-start gap-3 rounded-lg bg-white/70 p-3"
                      >
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#EEE6FF] text-xs font-bold text-[#A370FF]">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-ink line-clamp-2">
                            {ex.question}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {ex.options.map((opt, j) => (
                              <span
                                key={j}
                                className={cn(
                                  "rounded-md px-1.5 py-0.5 text-[10px] font-bold",
                                  j === ex.correctIndex
                                    ? "bg-[#DBF9F1] text-emerald-700"
                                    : "bg-ink/5 text-ink-soft"
                                )}
                              >
                                {opt}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-bold text-ink-soft whitespace-nowrap">
                          {EXERCISE_TYPES[ex.type] || ex.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-[#DBF9F1] p-4">
                  <p className="text-sm font-semibold text-emerald-800">
                    ✅ A lista será salva associada à matéria{" "}
                    <strong>{subjectInfo?.name}</strong> e já ficará{" "}
                    <strong>disponível</strong> para as crianças. Você pode ocultá-la no painel.
                  </p>
                </div>

                {saveError && (
                  <div className="flex items-start gap-3 rounded-xl bg-[#FFE3F0] p-4">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#FF70A6]" />
                    <p className="text-sm font-semibold text-[#a62f5f]">{saveError}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-lilac/10 bg-[#FFF7FC]/80 backdrop-blur-sm p-4">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="press cursor-pointer flex items-center gap-1.5 rounded-xl bg-white/70 px-4 py-2.5 text-sm font-bold text-ink shadow-sm hover:bg-white transition"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="press cursor-pointer rounded-xl bg-white/70 px-4 py-2.5 text-sm font-bold text-ink shadow-sm hover:bg-white transition"
            >
              Cancelar
            </button>
          )}

          {step < 2 ? (
            <Button
              variant="lilac"
              size="md"
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 0 && rawExercises.length === 0) ||
                (step === 1 && !formData.title.trim())
              }
            >
              <span className="flex items-center gap-1.5">
                Próximo
                <ChevronRight className="h-4 w-4" />
              </span>
            </Button>
          ) : (
            <Button
              variant="mint"
              size="md"
              onClick={handleSave}
              disabled={isSaving}
            >
              <span className="flex items-center gap-1.5">
                {isSaving ? (
                  "Salvando..."
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Salvar lista
                  </>
                )}
              </span>
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
