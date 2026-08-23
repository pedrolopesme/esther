"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Music,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  CalendarDays,
  GraduationCap,
  Sparkles,
  Maximize2,
  FileDown,
} from "lucide-react";
import {
  formatFileSize,
  getCategoryInfo,
  detectMediaType,
  trackMaterialAccess,
} from "../utils/materialRepository";
import { getSubject } from "../utils/subjects";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import { cn } from "../utils/cn";

export default function MaterialViewerModal({ material, onClose, onAccessLogged }) {
  const [hasLoggedView, setHasLoggedView] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (material && !hasLoggedView) {
      trackMaterialAccess(material, "view");
      setHasLoggedView(true);
      onAccessLogged?.(material.id, "view");
    }
  }, [material, hasLoggedView, onAccessLogged]);

  if (!material) return null;

  const mediaType =
    material.media_type || detectMediaType(material.file_type, material.file_name);
  const catInfo = getCategoryInfo(material.category);
  const subject = getSubject(material.subject_id);

  async function handleDownload(e) {
    e.preventDefault();
    setIsDownloading(true);
    try {
      await trackMaterialAccess(material, "download");
      onAccessLogged?.(material.id, "download");

      // Trigger download
      const response = await fetch(material.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = material.file_name || "material";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Erro ao baixar arquivo:", err);
      // Fallback: direct link
      window.open(material.file_url, "_blank");
    } finally {
      setIsDownloading(false);
    }
  }

  function renderMediaContent() {
    switch (mediaType) {
      case "video":
        return (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-black/90 p-2 sm:p-4 shadow-inner overflow-hidden">
            <video
              controls
              autoPlay={false}
              playsInline
              className="max-h-[65vh] w-full rounded-2xl outline-none"
              src={material.file_url}
            >
              Seu navegador não suporta reprodução de vídeo.
            </video>
          </div>
        );

      case "audio":
        return (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-[#EEE6FF] via-[#E1F6FD] to-[#FFE3F0] p-8 sm:p-12 text-center shadow-inner">
            <div className="mb-6 grid h-24 w-24 place-items-center rounded-full bg-white shadow-lg text-4xl anim-bob">
              🎧
            </div>
            <h4 className="font-display text-xl font-bold text-ink mb-2">
              {material.title}
            </h4>
            <p className="text-xs text-ink-soft mb-6 max-w-sm">
              {material.description || "Ouça o áudio com atenção para aprender o conteúdo!"}
            </p>
            <audio
              controls
              autoPlay={false}
              className="w-full max-w-md rounded-2xl shadow-md outline-none"
              src={material.file_url}
            >
              Seu navegador não suporta reprodução de áudio.
            </audio>
          </div>
        );

      case "image":
        return (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white/80 p-2 sm:p-4 shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={material.file_url}
              alt={material.title}
              className="max-h-[65vh] max-w-full rounded-2xl object-contain shadow-sm"
            />
          </div>
        );

      case "document":
      default:
        // Check if PDF for iframe viewer
        const isPdf =
          material.file_type === "application/pdf" ||
          material.file_name?.toLowerCase().endsWith(".pdf");

        if (isPdf) {
          return (
            <div className="flex flex-col rounded-3xl bg-white shadow-inner overflow-hidden border border-lilac/10">
              <div className="flex items-center justify-between bg-lilac/10 px-4 py-2 text-xs font-bold text-ink">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-lilac" />
                  Visualizador de PDF
                </span>
                <a
                  href={material.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press flex items-center gap-1 text-lilac hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir em nova aba
                </a>
              </div>
              <iframe
                src={`${material.file_url}#toolbar=1&navpanes=0`}
                className="h-[65vh] w-full border-none"
                title={material.title}
              />
            </div>
          );
        }

        return (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white/80 p-8 sm:p-12 text-center shadow-inner">
            <div className="mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-lilac/15 text-3xl">
              📄
            </div>
            <h4 className="font-display text-xl font-bold text-ink mb-2">
              {material.title}
            </h4>
            <p className="text-xs text-ink-soft mb-6 max-w-md">
              {material.description ||
                "Este documento está pronto para download e estudos no seu computador ou celular."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="sky"
                size="md"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                <span className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {isDownloading ? "Baixando..." : "Baixar Arquivo"}
                </span>
              </Button>
              <a
                href={material.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="press rounded-2xl bg-white px-5 py-3 text-sm font-bold text-ink shadow-sm hover:bg-cream"
              >
                <span className="flex items-center gap-1.5">
                  <ExternalLink className="h-4 w-4" />
                  Visualizar Direto
                </span>
              </a>
            </div>
          </div>
        );
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-md p-3 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="clay relative flex max-h-[95vh] w-full max-w-4xl flex-col bg-cream/95 p-0 overflow-hidden shadow-2xl"
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
              style={{ backgroundColor: `${subject?.hex || "#A370FF"}25` }}
            >
              {catInfo.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-bold text-ink truncate">
                {material.title}
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                <span>{subject?.name || material.subject_id}</span>
                <span>&middot;</span>
                <span>{catInfo.label}</span>
                <span>&middot;</span>
                <span>{formatFileSize(material.file_size)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="press cursor-pointer hidden sm:flex items-center gap-1.5 rounded-full bg-sky/15 px-3 py-1.5 text-xs font-bold text-sky shadow-sm hover:bg-sky/25"
              title="Baixar material"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isDownloading ? "Baixando..." : "Baixar"}</span>
            </button>
            <button
              onClick={onClose}
              className="press cursor-pointer rounded-full bg-white/80 p-2 text-ink-soft shadow-sm hover:bg-candy-soft hover:text-candy"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Viewer Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {renderMediaContent()}

          {/* Description & Metadata Footer */}
          {material.description && (
            <div className="rounded-2xl bg-white/70 p-4 shadow-sm border border-lilac/10">
              <p className="text-xs font-bold text-ink uppercase tracking-wider mb-1">
                Sobre este material
              </p>
              <p className="text-sm text-ink-soft leading-relaxed">
                {material.description}
              </p>
            </div>
          )}

          {/* Status Pill for Child */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-mint-soft/40 to-sky-soft/40 p-3.5 text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Você acessou este material! Seu progresso foi salvo para seus pais.</span>
            </div>
            <button
              onClick={handleDownload}
              className="press cursor-pointer font-bold text-sky hover:underline"
            >
              Baixar para o computador &rarr;
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
