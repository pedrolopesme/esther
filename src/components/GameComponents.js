"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { X, RotateCcw, Sparkles, Award, Star, Maximize2, Minimize2, Gamepad2, Trophy, Clock, AlertCircle } from "lucide-react";
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
  const [htmlDoc, setHtmlDoc] = useState(rawHtml || "");
  const [isLoadingHtml, setIsLoadingHtml] = useState(!rawHtml);
  const [fetchError, setFetchError] = useState(null);

  // Lock background scroll and prevent arrow/space key scroll while drawer is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", " "].includes(e.key)) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Fetch HTML text when URL is provided
  useEffect(() => {
    let active = true;

    if (rawHtml) {
      setHtmlDoc(rawHtml);
      setIsLoadingHtml(false);
      setFetchError(null);
      return;
    }

    if (game?.file_url) {
      setIsLoadingHtml(true);
      setFetchError(null);
      fetch(game.file_url)
        .then((res) => {
          if (!res.ok) throw new Error(`Falha ao carregar arquivo (${res.status})`);
          return res.text();
        })
        .then((text) => {
          if (active) {
            setHtmlDoc(text);
            setIsLoadingHtml(false);
          }
        })
        .catch((err) => {
          if (active) {
            console.error("Erro ao carregar HTML do jogo:", err);
            setFetchError(err.message);
            setIsLoadingHtml(false);
          }
        });
    }

    return () => {
      active = false;
    };
  }, [game?.file_url, rawHtml]);

  // Listen for postMessage from game iframe
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

  const subjectObj = getSubject(game?.subject_id);

  function handleRestart() {
    setCompletedData(null);
    if (iframeRef.current) {
      const current = htmlDoc;
      iframeRef.current.srcdoc = "";
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.srcdoc = current;
      }, 50);
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
        {completedData && (() => {
          const rawScore = Number(completedData.score) || 0;
          const maxScore = Number(completedData.maxScore) || game?.max_score || 100;
          const safeScore = Math.max(0, rawScore);
          const pct = maxScore > 0 ? Math.max(0, Math.round((safeScore / maxScore) * 100)) : 0;
          const isVictory = rawScore > 0 && pct >= 50;

          return (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex items-center justify-between gap-3 border-b px-5 py-3 text-xs transition-colors",
                isVictory
                  ? "border-emerald-500/30 bg-emerald-950/90 text-emerald-300"
                  : "border-amber-500/30 bg-amber-950/90 text-amber-200"
              )}
            >
              <div className="flex items-center gap-2 font-semibold">
                {isVictory ? (
                  <Trophy className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <span className="text-base">💪</span>
                )}
                <span>
                  {isVictory ? "Partida concluída!" : "Fim de jogo / Tente novamente!"}{" "}
                  Pontuação: <strong>{rawScore} / {maxScore} ({pct}%)</strong>
                  {completedData.timeSpentSeconds !== undefined && (
                    <span> &middot; {completedData.timeSpentSeconds}s gastos</span>
                  )}
                </span>
              </div>
              <button
                onClick={handleRestart}
                className={cn(
                  "font-bold hover:underline",
                  isVictory ? "text-emerald-400" : "text-amber-300"
                )}
              >
                Jogar de novo
              </button>
            </motion.div>
          );
        })()}

        {/* Iframe Viewport Container */}
        <div className="flex-1 overflow-hidden p-3 sm:p-5 flex flex-col justify-center items-center bg-black/40">
          <div className="relative w-full aspect-video max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-950">
            {isLoadingHtml ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400 text-sm">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500" />
                <span>Carregando e renderizando o jogo...</span>
              </div>
            ) : fetchError ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-rose-300 text-sm">
                <AlertCircle className="h-8 w-8 text-rose-500" />
                <p className="font-bold">Erro ao carregar o arquivo do jogo</p>
                <p className="text-xs text-rose-400">{fetchError}</p>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                srcDoc={htmlDoc}
                title={game?.title || "Jogo Educativo"}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
                loading="eager"
              />
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-800 bg-slate-900/90 px-5 py-3 text-xs text-slate-400 flex items-center justify-between">
          <span>Sandbox seguro &middot; Renderizado via HTML compilado</span>
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
  const [htmlDoc, setHtmlDoc] = useState("");
  const [isLoadingHtml, setIsLoadingHtml] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const containerRef = useRef(null);

  const subjectObj = getSubject(game?.subject_id);

  // Lock background scroll and prevent directional key scroll while game modal is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", " "].includes(e.key)) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Fetch HTML text directly to guarantee browser parses as full HTML document
  useEffect(() => {
    let active = true;

    if (game?.file_url) {
      setIsLoadingHtml(true);
      setFetchError(null);
      fetch(game.file_url)
        .then((res) => {
          if (!res.ok) throw new Error(`Falha ao carregar arquivo (${res.status})`);
          return res.text();
        })
        .then((text) => {
          if (active) {
            setHtmlDoc(text);
            setIsLoadingHtml(false);
          }
        })
        .catch((err) => {
          if (active) {
            console.error("Erro ao carregar HTML do jogo:", err);
            setFetchError(err.message);
            setIsLoadingHtml(false);
          }
        });
    }

    return () => {
      active = false;
    };
  }, [game?.file_url]);

  // Listen for postMessage from child iframe
  useEffect(() => {
    async function handleGameMessage(event) {
      if (event.data?.type === "GAME_COMPLETED") {
        const payload = event.data.payload || {};
        const rawScore = Number(payload.score) || 0;
        const maxScore = Number(payload.maxScore) || game?.max_score || 100;
        const isVictory = rawScore > 0 && (maxScore > 0 ? (rawScore / maxScore) >= 0.5 : true);

        console.log("🎮 Aluno finalizou o jogo:", payload, { isVictory });
        setCompletedPayload(payload);
        if (isVictory) {
          celebrateGame();
        }

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
    if (iframeRef.current && htmlDoc) {
      const current = htmlDoc;
      iframeRef.current.srcdoc = "";
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.srcdoc = current;
      }, 50);
    }
  }

  function toggleFullscreen() {
    setIsFullscreen((prev) => !prev);
  }

  if (!game) return null;

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

        {/* Outcome Banner (Win vs Game Over) */}
        {completedPayload && (() => {
          const rawScore = Number(completedPayload.score) || 0;
          const maxScore = Number(completedPayload.maxScore) || game.max_score || 100;
          const safeScore = Math.max(0, rawScore);
          const pct = maxScore > 0 ? Math.max(0, Math.round((safeScore / maxScore) * 100)) : 0;
          const isVictory = rawScore > 0 && pct >= 50;
          const starsAwarded = isVictory ? Math.max(1, Math.round(pct / 10)) : 0;

          return (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "border-b px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs transition-colors",
                isVictory
                  ? "border-emerald-500/30 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950"
                  : "border-rose-500/30 bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-full text-lg",
                    isVictory
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-rose-500/20 text-rose-400"
                  )}
                >
                  {isVictory ? "🏆" : "💥"}
                </div>
                <div>
                  <p
                    className={cn(
                      "font-display text-sm font-bold",
                      isVictory ? "text-emerald-300" : "text-rose-300"
                    )}
                  >
                    {isVictory
                      ? "Parabéns! Você concluiu o minijogo com sucesso!"
                      : "Fim de jogo! Não desista, tente novamente!"}
                  </p>
                  <p className="text-slate-300">
                    Pontuação final: <strong>{rawScore}</strong> / {maxScore} ({pct}%)
                    {completedPayload.timeSpentSeconds !== undefined && (
                      <span> &middot; Tempo: {completedPayload.timeSpentSeconds}s</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {starsAwarded > 0 ? (
                  <span className="rounded-full bg-sun/20 px-3 py-1 text-xs font-extrabold text-[#ffd166] flex items-center gap-1 border border-sun/30">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    +{starsAwarded} Estrelas ganhas!
                  </span>
                ) : (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
                    Tente fazer mais pontos para ganhar estrelas!
                  </span>
                )}
                <button
                  onClick={handleRestart}
                  className={cn(
                    "press rounded-xl px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition",
                    isVictory ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
                  )}
                >
                  Jogar Novamente
                </button>
              </div>
            </motion.div>
          );
        })()}

        {/* Game iframe rendered with srcDoc */}
        <div className="relative flex-1 w-full h-full bg-black">
          {isLoadingHtml ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400 text-sm">
              <span className="h-9 w-9 animate-spin rounded-full border-3 border-indigo-500/30 border-t-indigo-500" />
              <span>Carregando o jogo...</span>
            </div>
          ) : fetchError ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-rose-300 text-sm">
              <AlertCircle className="h-8 w-8 text-rose-500" />
              <p className="font-bold">Erro ao carregar o minijogo</p>
              <p className="text-xs text-rose-400">{fetchError}</p>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              srcDoc={htmlDoc}
              title={game.title}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
              loading="eager"
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
