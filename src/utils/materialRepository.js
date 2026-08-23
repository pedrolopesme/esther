import { getSupabaseBrowserClient } from "./supabase";

export const MATERIAL_CATEGORIES = [
  { id: "apostila", label: "Apostila", emoji: "📖" },
  { id: "resumo", label: "Resumo / Guia", emoji: "📝" },
  { id: "livro", label: "Livro Didático", emoji: "📚" },
  { id: "caderno", label: "Caderno / Anotações", emoji: "📓" },
  { id: "exercicios", label: "Lista de Exercícios PDF", emoji: "📋" },
  { id: "prova", label: "Simulado / Prova", emoji: "🎯" },
  { id: "outro", label: "Outro Material", emoji: "📁" },
];

export function getCategoryInfo(categoryId) {
  return MATERIAL_CATEGORIES.find((c) => c.id === categoryId) || {
    id: categoryId,
    label: categoryId,
    emoji: "📄",
  };
}

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export async function getMaterials({ subjectId, category, publishedOnly = false } = {}) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  let query = supabase
    .from("materials")
    .select(`
      id,
      title,
      description,
      subject_id,
      ano_letivo,
      file_url,
      file_name,
      file_size,
      file_type,
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

  return data || [];
}

export async function uploadMaterialFile(file, { subjectId = "geral" } = {}) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase não inicializado.");

  const fileExt = file.name.split(".").pop();
  const cleanBaseName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 50);

  const filePath = `${subjectId}/${Date.now()}_${cleanBaseName}.${fileExt}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("study-materials")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Erro no upload do arquivo:", uploadError);
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from("study-materials")
    .getPublicUrl(uploadData.path);

  return {
    fileUrl: publicUrlData.publicUrl,
    filePath: uploadData.path,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || "application/octet-stream",
  };
}

export async function createMaterial(payload) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase não inicializado.");

  const { data, error } = await supabase
    .from("materials")
    .insert({
      title: payload.title.trim(),
      description: payload.description?.trim() || "",
      subject_id: payload.subject_id,
      ano_letivo: payload.ano_letivo || "3º ano do Ensino Fundamental",
      file_url: payload.file_url,
      file_name: payload.file_name,
      file_size: payload.file_size || 0,
      file_type: payload.file_type || "application/pdf",
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

  const { data, error } = await supabase
    .from("materials")
    .update({
      title: payload.title?.trim(),
      description: payload.description?.trim(),
      subject_id: payload.subject_id,
      ano_letivo: payload.ano_letivo,
      category: payload.category,
      published: payload.published,
      updated_at: new Date().toISOString(),
    })
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

  // Delete DB record
  const { error: dbError } = await supabase
    .from("materials")
    .delete()
    .eq("id", material.id);

  if (dbError) throw dbError;

  // Try to remove from storage if file_url belongs to study-materials
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
