import { getSupabaseBrowserClient } from "./supabase";
import { logChildEvent } from "./childEvents";

// 50MB limit enforced by Supabase Storage Free Tier
export const MAX_FILE_SIZE_BYTES = 52428800; // 50MB (50 * 1024 * 1024)
export const MAX_FILE_SIZE_LABEL = "50MB";

export const MATERIAL_CATEGORIES = [
  { id: "apostila", label: "Apostila", emoji: "📖", defaultMedia: "document" },
  { id: "resumo", label: "Resumo / Guia", emoji: "📝", defaultMedia: "document" },
  { id: "video", label: "Vídeo Explicativo", emoji: "🎬", defaultMedia: "video" },
  { id: "audio", label: "Áudio / Podcast", emoji: "🎧", defaultMedia: "audio" },
  { id: "imagem", label: "Imagem / Infográfico", emoji: "🖼️", defaultMedia: "image" },
  { id: "livro", label: "Livro Didático", emoji: "📚", defaultMedia: "document" },
  { id: "caderno", label: "Caderno / Anotações", emoji: "📓", defaultMedia: "document" },
  { id: "exercicios", label: "Lista de Exercícios PDF", emoji: "📋", defaultMedia: "document" },
  { id: "prova", label: "Simulado / Prova", emoji: "🎯", defaultMedia: "document" },
  { id: "outro", label: "Outro Material", emoji: "📁", defaultMedia: "other" },
];

export function getCategoryInfo(categoryId) {
  return MATERIAL_CATEGORIES.find((c) => c.id === categoryId) || {
    id: categoryId,
    label: categoryId,
    emoji: "📄",
    defaultMedia: "document",
  };
}

export function detectMediaType(fileType = "", fileName = "") {
  const ft = fileType.toLowerCase();
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (ft.startsWith("video/") || ["mp4", "webm", "ogg", "mov", "m4v"].includes(ext)) {
    return "video";
  }
  if (ft.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "aac", "weba"].includes(ext)) {
    return "audio";
  }
  if (ft.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) {
    return "image";
  }
  return "document";
}

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatTitleFromFileName(fileName = "") {
  if (!fileName) return "";
  // Remove extension
  const withoutExt = fileName.replace(/\.[^/.]+$/, "");
  // Replace underscores and hyphens with spaces
  const withSpaces = withoutExt.replace(/[_-]+/g, " ").trim();
  // Capitalize words nicely
  return withSpaces
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Fetch materials with optional subject/category filtering and child/user access status
 */
export async function getMaterials({ subjectId, category, publishedOnly = false, childId = null } = {}) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  let query = supabase
    .from("materials")
    .select(`
      id,
      title,
      description,
subject_id,
      grade_level_id,
      file_url,
      file_name,
      file_size,
      file_type,
      media_type,
      category,
      published,
      download_count,
      created_at,
      updated_at
    `)
    .order("created_at", { ascending: false });

  if (subjectId) {
    query = query.eq("subject_id", subjectId);
  }
  if (category) {
    query = query.eq("category", category);
  }
  if (publishedOnly) {
    query = query.eq("published", true);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Erro ao buscar materiais:", error);
    throw error;
  }

  const materialsList = data || [];

  // Always try to resolve childId: prefer explicit param, fallback to localStorage
  let effectiveChildId = childId;
  if (!effectiveChildId && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("esther_child");
      if (stored) {
        effectiveChildId = JSON.parse(stored)?.id;
      }
    } catch {}
  }
  // Also try auth session user_id as fallback
  let effectiveUserId = null;
  if (!effectiveChildId && typeof window !== "undefined") {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        effectiveUserId = sessionData.session.user.id;
      }
    } catch {}
  }

  if ((effectiveChildId || effectiveUserId) && materialsList.length > 0) {
    try {
      let accessQuery = supabase
        .from("material_accesses")
        .select("material_id, action, created_at");
      if (effectiveChildId) {
        accessQuery = accessQuery.eq("child_id", effectiveChildId);
      } else if (effectiveUserId) {
        accessQuery = accessQuery.eq("user_id", effectiveUserId);
      }
      const { data: accesses } = await accessQuery;

      const accessMap = {};
      (accesses || []).forEach((acc) => {
        if (!accessMap[acc.material_id]) {
          accessMap[acc.material_id] = { viewed: false, downloaded: false, lastAccessed: acc.created_at };
        }
        if (acc.action === "view") accessMap[acc.material_id].viewed = true;
        if (acc.action === "download") accessMap[acc.material_id].downloaded = true;
      });

      return materialsList.map((m) => ({
        ...m,
        media_type: m.media_type || detectMediaType(m.file_type, m.file_name),
        accessStatus: accessMap[m.id] || { viewed: false, downloaded: false, lastAccessed: null },
      }));
    } catch (e) {
      console.warn("Não foi possível carregar status de acesso do material:", e);
    }
  }

  return materialsList.map((m) => ({
    ...m,
    media_type: m.media_type || detectMediaType(m.file_type, m.file_name),
    accessStatus: { viewed: false, downloaded: false, lastAccessed: null },
  }));
}

/**
 * Upload material file to Supabase storage bucket with size validation
 */
export async function uploadMaterialFile(file, { subjectId = "geral" } = {}) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase não inicializado.");

  // Pre-validate file size against Supabase Free Tier limit
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const fileSizeFormatted = formatFileSize(file.size);
    throw new Error(
      `O arquivo "${file.name}" possui ${fileSizeFormatted}, ultrapassando o limite máximo de ${MAX_FILE_SIZE_LABEL} por arquivo do Supabase (plano gratuito). Comprima o vídeo/arquivo ou use um formato menor.`
    );
  }

  const fileExt = file.name.split(".").pop();
  const cleanBaseName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 60);

  const filePath = `${subjectId}/${Date.now()}_${cleanBaseName}.${fileExt}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("study-materials")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Erro no upload do arquivo:", uploadError);
    if (uploadError.message?.includes("exceeded the maximum allowed size") || uploadError.statusCode === "413") {
      throw new Error(
        `O arquivo ultrapassa o limite de ${MAX_FILE_SIZE_LABEL} por objeto do Supabase. Reduza a resolução ou tamanho do vídeo.`
      );
    }
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from("study-materials")
    .getPublicUrl(uploadData.path);

  const mediaType = detectMediaType(file.type, file.name);

  return {
    fileUrl: publicUrlData.publicUrl,
    filePath: uploadData.path,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || "application/octet-stream",
    mediaType,
  };
}

export async function createMaterial(payload) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase não inicializado.");

  const mediaType = payload.media_type || detectMediaType(payload.file_type, payload.file_name);

  const { data, error } = await supabase
    .from("materials")
    .insert({
      title: payload.title.trim(),
      description: payload.description?.trim() || "",
subject_id: payload.subject_id,
      grade_level_id: payload.grade_level_id,
      file_url: payload.file_url,
      file_name: payload.file_name,
      file_size: payload.file_size || 0,
      file_type: payload.file_type || "application/pdf",
      media_type: mediaType,
      category: payload.category || "apostila",
      published: payload.published ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar registro do material:", error);
    throw error;
  }

  return data;
}

export async function updateMaterial(id, payload) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase não inicializado.");

  const updateFields = {
    title: payload.title?.trim(),
    description: payload.description?.trim(),
subject_id: payload.subject_id,
    grade_level_id: payload.grade_level_id,
    category: payload.category,
    published: payload.published,
    updated_at: new Date().toISOString(),
  };

  if (payload.file_url) {
    updateFields.file_url = payload.file_url;
    updateFields.file_name = payload.file_name;
    updateFields.file_size = payload.file_size;
    updateFields.file_type = payload.file_type;
    updateFields.media_type = payload.media_type || detectMediaType(payload.file_type, payload.file_name);
  }

  const { data, error } = await supabase
    .from("materials")
    .update(updateFields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar material:", error);
    throw error;
  }

  return data;
}

export async function deleteMaterial(material) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase não inicializado.");

  const { error: dbError } = await supabase
    .from("materials")
    .delete()
    .eq("id", material.id);

  if (dbError) throw dbError;

  try {
    if (material.file_url && material.file_url.includes("/study-materials/")) {
      const parts = material.file_url.split("/study-materials/");
      if (parts[1]) {
        await supabase.storage.from("study-materials").remove([decodeURIComponent(parts[1])]);
      }
    }
  } catch (storageErr) {
    console.warn("Aviso: arquivo do storage não pôde ser removido:", storageErr);
  }

  return true;
}

export async function togglePublishMaterial(id, currentPublished) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase não inicializado.");

  const { data, error } = await supabase
    .from("materials")
    .update({ published: !currentPublished })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Record material view or download event for child & parents
 */
export async function trackMaterialAccess(material, action = "view") {
  if (typeof window === "undefined" || !material?.id) return;

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

    // 1. Insert in material_accesses table
    await supabase.from("material_accesses").insert({
      material_id: material.id,
      child_id: childId,
      user_id: userId,
      action: action, // 'view' | 'download'
    });

    // 2. Increment download_count if action is download
    if (action === "download") {
      await supabase.rpc("increment_download_count", { m_id: material.id }).catch(() => {
        // Fallback update
        supabase
          .from("materials")
          .update({ download_count: (material.download_count || 0) + 1 })
          .eq("id", material.id)
          .then(() => {});
      });
    }

    // 3. Log structured child_event if a child is active
    if (childId) {
      const eventType = action === "download" ? "material_downloaded" : "material_viewed";
      await logChildEvent({
        childId,
        eventType,
        subject: material.subject_id,
        listTitle: material.title,
        metadata: {
          materialId: material.id,
          fileName: material.file_name,
          mediaType: material.media_type || detectMediaType(material.file_type, material.file_name),
          category: material.category,
          action,
        },
      });
    }
  } catch (err) {
    console.error("Erro ao registrar acesso ao material:", err);
  }
}
