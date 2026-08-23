import { getSupabaseBrowserClient } from "./supabase";
import { logChildEvent } from "./childEvents";
import { addPoints } from "./points";

export const MAX_GAME_FILE_SIZE_BYTES = 52428800; // 50MB

/**
 * Generate a clean URL-friendly slug
 */
export function buildSlug(text = "") {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
}

/**
 * Parse HTML content on client side using DOMParser to extract #game-manifest JSON
 */
export function parseGameHtml(htmlContent) {
  if (!htmlContent) return null;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    const manifestTag = doc.getElementById("game-manifest");
    let manifest = {};

    if (manifestTag && manifestTag.textContent) {
      try {
        manifest = JSON.parse(manifestTag.textContent.trim());
      } catch (err) {
        console.warn("Erro ao fazer parse do JSON em #game-manifest:", err);
      }
    }

    const title = manifest.title || doc.title || "Minijogo Educativo";
    const description = manifest.description || "";
    const version = manifest.version || "1.0.0";
    const subject = manifest.subject || "ciencias";
    const grade = manifest.grade || "4º ano";
    const targetAge = manifest.targetAge || 9;
    const maxScore = Number(manifest.maxScore) || 100;
    const cover = manifest.cover || null; // base64 or url

    return {
      title,
      description,
      version,
      subject,
      grade,
      targetAge,
      maxScore,
      cover,
      manifest,
    };
  } catch (err) {
    console.error("Falha ao analisar HTML do jogo:", err);
    return null;
  }
}

/**
 * Fetch games with optional filters
 */
export async function getGames({ subjectId, publishedOnly = false, childId = null } = {}) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  let query = supabase
    .from("games")
    .select("*")
    .order("created_at", { ascending: false });

  if (subjectId) {
    query = query.eq("subject_id", subjectId);
  }
  if (publishedOnly) {
    query = query.eq("published", true);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Erro ao buscar jogos:", error);
    throw error;
  }

  const gamesList = data || [];

  // If childId is provided or active child in localStorage, attach play status & best score
  let effectiveChildId = childId;
  if (!effectiveChildId && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("esther_child");
      if (stored) {
        effectiveChildId = JSON.parse(stored)?.id;
      }
    } catch {}
  }

  if (effectiveChildId && gamesList.length > 0) {
    try {
      const { data: sessions } = await supabase
        .from("game_sessions")
        .select("game_id, score, max_score, score_pct, time_spent_seconds, completed_at")
        .eq("child_id", effectiveChildId);

      const statusMap = {};
      (sessions || []).forEach((s) => {
        if (!statusMap[s.game_id]) {
          statusMap[s.game_id] = {
            played: true,
            playCount: 0,
            bestScore: s.score,
            bestScorePct: Number(s.score_pct) || 0,
            lastPlayedAt: s.completed_at,
          };
        }
        statusMap[s.game_id].playCount += 1;
        if (s.score > statusMap[s.game_id].bestScore) {
          statusMap[s.game_id].bestScore = s.score;
          statusMap[s.game_id].bestScorePct = Number(s.score_pct) || 0;
        }
      });

      return gamesList.map((g) => ({
        ...g,
        playStatus: statusMap[g.id] || { played: false, playCount: 0, bestScore: 0, bestScorePct: 0, lastPlayedAt: null },
      }));
    } catch (e) {
      console.warn("Não foi possível carregar status dos jogos:", e);
    }
  }

  return gamesList.map((g) => ({
    ...g,
    playStatus: { played: false, playCount: 0, bestScore: 0, bestScorePct: 0, lastPlayedAt: null },
  }));
}

/**
 * Upload single-file HTML game to Supabase Storage
 */
export async function uploadGameFile(file, { subjectId = "geral", customSlug = "" } = {}) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase não inicializado.");

  if (file.size > MAX_GAME_FILE_SIZE_BYTES) {
    throw new Error("O arquivo do jogo ultrapassa o limite máximo de 50MB.");
  }

  const cleanSlug = customSlug || buildSlug(file.name.replace(/\.[^/.]+$/, ""));
  const filePath = `${subjectId}/${Date.now()}_${cleanSlug}.html`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("games")
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: "text/html; charset=utf-8",
      upsert: false,
    });

  if (uploadError) {
    console.error("Erro no upload do jogo:", uploadError);
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from("games")
    .getPublicUrl(uploadData.path);

  return {
    fileUrl: publicUrlData.publicUrl,
    filePath: uploadData.path,
    fileName: file.name,
    fileSize: file.size,
  };
}

/**
 * Create game record in database
 */
export async function createGame(payload) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase não inicializado.");

  const slug = payload.slug || buildSlug(payload.title);

  const { data, error } = await supabase
    .from("games")
    .insert({
      slug,
      title: payload.title.trim(),
      description: payload.description?.trim() || "",
      subject_id: payload.subject_id,
      ano_letivo: payload.ano_letivo || "4º ano",
      target_age: payload.target_age || 9,
      version: payload.version || "1.0.0",
      max_score: payload.max_score || 100,
      cover_url: payload.cover_url || null,
      file_url: payload.file_url,
      file_name: payload.file_name,
      file_size: payload.file_size || 0,
      metadata: payload.metadata || {},
      published: payload.published ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar registro do jogo:", error);
    throw error;
  }

  return data;
}

/**
 * Update game record
 */
export async function updateGame(id, payload) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase não inicializado.");

  const updateFields = {
    title: payload.title?.trim(),
    description: payload.description?.trim(),
    subject_id: payload.subject_id,
    ano_letivo: payload.ano_letivo,
    target_age: payload.target_age,
    version: payload.version,
    max_score: payload.max_score,
    published: payload.published,
    updated_at: new Date().toISOString(),
  };

  if (payload.cover_url !== undefined) {
    updateFields.cover_url = payload.cover_url;
  }
  if (payload.file_url) {
    updateFields.file_url = payload.file_url;
    updateFields.file_name = payload.file_name;
    updateFields.file_size = payload.file_size;
  }

  const { data, error } = await supabase
    .from("games")
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar jogo:", error);
    throw error;
  }

  return data;
}

/**
 * Delete game record and its storage file
 */
export async function deleteGame(game) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase não inicializado.");

  const { error: dbError } = await supabase
    .from("games")
    .delete()
    .eq("id", game.id);

  if (dbError) throw dbError;

  try {
    if (game.file_url && game.file_url.includes("/games/")) {
      const parts = game.file_url.split("/games/");
      if (parts[1]) {
        await supabase.storage.from("games").remove([decodeURIComponent(parts[1])]);
      }
    }
  } catch (storageErr) {
    console.warn("Aviso: arquivo do storage não pôde ser removido:", storageErr);
  }

  return true;
}

/**
 * Toggle game published status
 */
export async function togglePublishGame(id, currentPublished) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase não inicializado.");

  const { data, error } = await supabase
    .from("games")
    .update({ published: !currentPublished })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Record game session completion & award points
 */
export async function recordGameCompletion(game, payload = {}) {
  if (typeof window === "undefined" || !game?.id) return;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  try {
    let childId = null;
    let userId = null;

    try {
      const stored = localStorage.getItem("esther_child");
      if (stored) {
        childId = JSON.parse(stored)?.id;
      }
    } catch {}

    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      userId = sessionData.session.user.id;
    }

    const score = Number(payload.score) || 0;
    const maxScore = Number(payload.maxScore) || game.max_score || 100;
    const scorePct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const timeSpentSeconds = Number(payload.timeSpentSeconds) || 0;
    const details = payload.details || {};

    // 1. Insert in game_sessions
    await supabase.from("game_sessions").insert({
      game_id: game.id,
      child_id: childId,
      user_id: userId,
      game_title: game.title,
      subject_id: game.subject_id,
      score,
      max_score: maxScore,
      score_pct: scorePct,
      time_spent_seconds: timeSpentSeconds,
      details,
    });

    // 2. Increment game play_count
    supabase
      .from("games")
      .update({ play_count: (game.play_count || 0) + 1 })
      .eq("id", game.id)
      .then(() => {});

    // 3. Award Stars / Points to student based on score percentage (only on positive score)
    const starsEarned = score > 0 ? Math.max(1, Math.round(scorePct / 10)) : 0;
    if (starsEarned > 0) {
      addPoints(starsEarned);
    }

    // 4. Log child event for parents timeline
    if (childId) {
      await logChildEvent({
        childId,
        eventType: "game_completed",
        subject: game.subject_id,
        listTitle: game.title,
        metadata: {
          gameId: game.id,
          score,
          maxScore,
          scorePct,
          timeSpentSeconds,
          starsEarned,
          details,
        },
      });
    }
  } catch (err) {
    console.error("Erro ao registrar conclusão do jogo:", err);
  }
}
