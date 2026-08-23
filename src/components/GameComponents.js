"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { X, RotateCcw, Sparkles, Award, Star, Maximize2, Minimize2, Gamepad2, Trophy, Clock } from "lucide-react";
import confetti from "canvas-confetti";
import { recordGameCompletion } from "../utils/gameRepository";
import { getSubject } from "../utils/subjects";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import { cn } from "../utils/cn";

function celebrateGame() {
  const colors = ["#FF70A6", "#A370FF", "#FFD166", "#06D6A0", "#4CC9F0", "#FF9770"];
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors,
  });
}

/**
 * GameDrawer: Lateral testing drawer for Admin and inline preview
 */
export function GameDrawer({ game, onClose, rawHtml = null }) {
  const iframeRef = useRef(null);
  const [completedData, setCompletedData] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    if (rawHtml) {
      const blob = new Blob([rawHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [rawHtml]);

  useEffect(() => {
    function handleMessage(event) {
      if (event.data?.type === "GAME_COMPLETED") {
        console.log("🎮 Admin Preview - Evento GAME_COMPLETED recebido:", event.data.payload);
        setCompletedData(event.data.payload);
        celebrateGame();
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (!game && !rawHtml) return null;

  const targetUrl = blobUrl || game?.file_url;
  const subjectObj = getSubject(game?.subject_id);

  function handleRestart() {
    setCompletedData(null);
    if (iframeRef.current) {
      iframeRef.current.src = targetUrl;
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <motion.div
        className="relative z-10 flex h-full w-full max-w-3xl flex-col bg-[#0f172a] text-white shadow-2xl"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-slate-900/80 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-indigo-500/20 text-indigo-400">
              <Gamepad2 className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-white truncate">
                  {game?.title || "Testando Minijogo"}
                </h3>
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                  {game?.version ? `v${game.version}` : "Preview"}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {subjectObj?.name || game?.subject_id || "Geral"} &middot; {game?.ano_letivo || "Ensino Fundamental"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRestart}
              className="press cursor-pointer flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 shadow-sm"
              title="Reiniciar jogo"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reiniciar</span>
            </button>
            <button
              onClick={onClose}
              className="press cursor-pointer rounded-full bg-slate-800 p-2 text-slate-300 hover:bg-rose-500 hover:text-white transition"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Completion Notification Banner */}
        {completedData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 border-b border-emerald-500/30 bg-emerald-950/80 px-5 py-3 text-xs"
          >
            <div className="flex items-center gap-2 text-emerald-300 font-semibold">
              <Trophy className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>
                PostMessage recebido! Pontuação:{" "}
                <strong>
                  {completedData.score} / {completedData.maxScore || game?.max_score || 100}
                </strong>
                {completedData.timeSpentSeconds && (
                  <span> ({completedData.timeSpentSeconds}s gastos)</span>
                )}
              </span>
            </div>
            <button
              onClick={handleRestart}
              className="font-bold text-emerald-400 hover:underline"
            >
              Jogar de novo
            </button>
          </motion.div>
        )}

        {/* Iframe Viewport Container */}
        <div className="flex-1 overflow-hidden p-3 sm:p-5 flex flex-col justify-center items-center bg-black/40">
          <div className="relative w-full aspect-video max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-950">
            {targetUrl ? (
              <iframe
                ref={iframeRef}
                src={targetUrl}
                title={game?.title || "Jogo Educativo"}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
                loading="eager"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                Carregando arquivo do jogo...
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-800 bg-slate-900/90 px-5 py-3 text-xs text-slate-400 flex items-center justify-between">
          <span>Sandbox ativado &middot; Eventos postMessage rastreados</span>
          <span className="font-mono text-[11px] text-slate-500">
            {game?.file_name || "index.html"}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * GameViewerModal: Full-screen or rich modal experience for students
 */
export function GameViewerModal({ game, onClose, onGameCompleted }) {
  const iframeRef = useRef(null);
  const [completedPayload, setCompletedPayload] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const subjectObj = getSubject(game?.subject_id);

  // Listen for postMessage from child iframe
  useEffect(() => {
    async function handleGameMessage(event) {
      if (event.data?.type === "GAME_COMPLETED") {
        const payload = event.data.payload || {};
        console.log("🎮 Aluno concluiu o jogo:", payload);
        setCompletedPayload(payload);
        celebrateGame();

        // Persist to Supabase and award stars
        if (game) {
          await recordGameCompletion(game, payload);
          onGameCompleted?.(game.id, payload);
        }
      }
    }

    window.addEventListener("message", handleGameMessage);
    return () => window.removeEventListener("message", handleGameMessage);
  }, [game, onGameCompleted]);

  function handleRestart() {
    setCompletedPayload(null);
    if (iframeRef.current && game?.file_url) {
      iframeRef.current.src = game.file_url;
    }
  }

  function toggleFullscreen() {
    setIsFullscreen((prev) => !prev);
  }

  if (!game) return null;

  const scorePct = completedPayload
    ? completedPayload.maxScore > 0
      ? Math.round((completedPayload.score / completedPayload.maxScore) * 100)
      : 100
    : 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        ref={containerRef}
        className={cn(
          "relative flex flex-col bg-[#0b1329] text-white rounded-[2rem] overflow-hidden shadow-2xl border border-slate-700/60 transition-all duration-300",
          isFullscreen
            ? "w-screen h-screen rounded-none p-0"
            : "w-full max-w-5xl max-h-[94vh] aspect-[16/10]"
        )}
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-5 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-lilac to-candy text-white text-xl shadow-md">
              🎮
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-bold text-white truncate">
                {game.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-bold text-lilac">{subjectObj?.name || game.subject_id}</span>
                <span>&middot;</span>
                <span>{game.ano_letivo || "4º ano"}</span>
                {game.max_score && (
                  <>
                    <span>&middot;</span>
                    <span>Até {game.max_score} pontos</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRestart}
              className="press cursor-pointer flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 shadow-sm"
              title="Jogar do início"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reiniciar</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="press cursor-pointer rounded-xl bg-slate-800 p-2 text-slate-300 hover:bg-slate-700"
              title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            <button
              onClick={onClose}
              className="press cursor-pointer rounded-full bg-slate-800 p-2 text-slate-300 hover:bg-rose-600 hover:text-white transition"
              title="Sair do jogo"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Completion Celebration Overlay Banner */}
        {completedPayload && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-b border-emerald-500/30 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 text-lg">
                🏆
              </div>
              <div>
                <p className="font-display text-sm font-bold text-emerald-300">
                  Parabéns! Você concluiu o jogo com sucesso!
                </p>
                <p className="text-slate-300">
                  Pontuação: <strong>{completedPayload.score}</strong> / {completedPayload.maxScore || game.max_score} ({scorePct}%)
                  {completedPayload.timeSpentSeconds && (
                    <span> &middot; Tempo: {completedPayload.timeSpentSeconds} segundos</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-sun/20 px-3 py-1 text-xs font-extrabold text-[#ffd166] flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-current" />
                +{Math.max(1, Math.round(scorePct / 10))} Estrelas ganhas!
              </span>
              <button
                onClick={handleRestart}
                className="press rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500"
              >
                Jogar Novamente
              </button>
            </div>
          </motion.div>
        )}

        {/* Game iframe */}
        <div className="relative flex-1 w-full h-full bg-black">
          <iframe
            ref={iframeRef}
            src={game.file_url}
            title={game.title}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
            loading="eager"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
