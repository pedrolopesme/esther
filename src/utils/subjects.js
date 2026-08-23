import {
  Calculator,
  BookOpenText,
  Languages,
  Globe2,
  Landmark,
  Microscope,
  Sparkles,
  GraduationCap,
  Atom,
  Palette,
  Music,
  HeartPulse,
} from "lucide-react";
import { getSupabaseBrowserClient } from "./supabase";

export const ICON_MAP = {
  Calculator,
  BookOpenText,
  Languages,
  Globe2,
  Landmark,
  Microscope,
  Sparkles,
  GraduationCap,
  Atom,
  Palette,
  Music,
  HeartPulse,
};

export const COLOR_PRESETS = [
  {
    color: "candy",
    hex: "#FF70A6",
    gradient: "from-[#FF70A6] to-[#FF9AC5]",
    soft: "from-[#FFE3F0] to-[#FFF0F7]",
    bg: "bg-[#FFE3F0] ring-2 ring-[#FF70A6]",
    iconBg: "bg-[#FFE3F0]",
    badge: "bg-[#FFE3F0] text-[#FF70A6]",
  },
  {
    color: "lilac",
    hex: "#A370FF",
    gradient: "from-[#A370FF] to-[#C4A3FF]",
    soft: "from-[#EEE6FF] to-[#F6F0FF]",
    bg: "bg-[#EEE6FF] ring-2 ring-[#A370FF]",
    iconBg: "bg-[#EEE6FF]",
    badge: "bg-[#EEE6FF] text-[#A370FF]",
  },
  {
    color: "sky",
    hex: "#4CC9F0",
    gradient: "from-[#4CC9F0] to-[#8BDDF6]",
    soft: "from-[#E1F6FD] to-[#F0FBFE]",
    bg: "bg-[#E1F6FD] ring-2 ring-[#4CC9F0]",
    iconBg: "bg-[#E1F6FD]",
    badge: "bg-[#E1F6FD] text-[#4CC9F0]",
  },
  {
    color: "mint",
    hex: "#06D6A0",
    gradient: "from-[#06D6A0] to-[#5FE6C4]",
    soft: "from-[#DBF9F1] to-[#EEFCF8]",
    bg: "bg-[#DBF9F1] ring-2 ring-[#06D6A0]",
    iconBg: "bg-[#DBF9F1]",
    badge: "bg-[#DBF9F1] text-[#06D6A0]",
  },
  {
    color: "sun",
    hex: "#FFD166",
    gradient: "from-[#FFC13B] to-[#FFDD8A]",
    soft: "from-[#FFF3D6] to-[#FFF9EC]",
    bg: "bg-[#FFF3D6] ring-2 ring-[#FFD166]",
    iconBg: "bg-[#FFF3D6]",
    badge: "bg-[#FFF3D6] text-[#E8A81E]",
  },
  {
    color: "coral",
    hex: "#FF9770",
    gradient: "from-[#FF9770] to-[#FFB89B]",
    soft: "from-[#FFE9E0] to-[#FFF4EF]",
    bg: "bg-[#FFE9E0] ring-2 ring-[#FF9770]",
    iconBg: "bg-[#FFE9E0]",
    badge: "bg-[#FFE9E0] text-[#FF9770]",
  },
];

export const SUBJECTS = [
  {
    id: "matematica",
    name: "Matemática",
    emoji: "🔢",
    icon: Calculator,
    iconName: "Calculator",
    color: "candy",
    hex: "#FF70A6",
    gradient: "from-[#FF70A6] to-[#FF9AC5]",
    soft: "from-[#FFE3F0] to-[#FFF0F7]",
    tag: "Números & lógica",
    order_index: 1,
    active: true,
  },
  {
    id: "portugues",
    name: "Português",
    emoji: "📚",
    icon: BookOpenText,
    iconName: "BookOpenText",
    color: "lilac",
    hex: "#A370FF",
    gradient: "from-[#A370FF] to-[#C4A3FF]",
    soft: "from-[#EEE6FF] to-[#F6F0FF]",
    tag: "Leitura & escrita",
    order_index: 2,
    active: true,
  },
  {
    id: "ingles",
    name: "Inglês",
    emoji: "🇺🇸",
    icon: Languages,
    iconName: "Languages",
    color: "sky",
    hex: "#4CC9F0",
    gradient: "from-[#4CC9F0] to-[#8BDDF6]",
    soft: "from-[#E1F6FD] to-[#F0FBFE]",
    tag: "Words & grammar",
    order_index: 3,
    active: true,
  },
  {
    id: "geografia",
    name: "Geografia",
    emoji: "🌍",
    icon: Globe2,
    iconName: "Globe2",
    color: "mint",
    hex: "#06D6A0",
    gradient: "from-[#06D6A0] to-[#5FE6C4]",
    soft: "from-[#DBF9F1] to-[#EEFCF8]",
    tag: "Mundo & lugares",
    order_index: 4,
    active: true,
  },
  {
    id: "historia",
    name: "História",
    emoji: "📜",
    icon: Landmark,
    iconName: "Landmark",
    color: "sun",
    hex: "#FFD166",
    gradient: "from-[#FFC13B] to-[#FFDD8A]",
    soft: "from-[#FFF3D6] to-[#FFF9EC]",
    tag: "Tempo & memória",
    order_index: 5,
    active: true,
  },
  {
    id: "ciencias",
    name: "Ciências",
    emoji: "🔬",
    icon: Microscope,
    iconName: "Microscope",
    color: "coral",
    hex: "#FF9770",
    gradient: "from-[#FF9770] to-[#FFB89B]",
    soft: "from-[#FFE9E0] to-[#FFF4EF]",
    tag: "Vida & natureza",
    order_index: 6,
    active: true,
  },
];

export function resolveSubject(raw) {
  if (!raw) return null;
  const iconComponent = typeof raw.icon === "string" 
    ? (ICON_MAP[raw.icon] ?? BookOpenText) 
    : (raw.icon ?? BookOpenText);
  
  const preset = COLOR_PRESETS.find((p) => p.color === raw.color) ?? COLOR_PRESETS[1];

  return {
    id: raw.id,
    name: raw.name ?? raw.id,
    emoji: raw.emoji || "📚",
    icon: iconComponent,
    iconName: typeof raw.icon === "string" ? raw.icon : (raw.iconName || "BookOpenText"),
    color: raw.color || preset.color,
    hex: raw.hex || preset.hex,
    gradient: raw.gradient || preset.gradient,
    soft: raw.soft || preset.soft,
    tag: raw.tag || "",
    order_index: raw.order_index ?? 0,
    active: raw.active ?? true,
  };
}

const STATIC_SUBJECT_MAP = Object.fromEntries(
  SUBJECTS.map((s) => [s.id, resolveSubject(s)])
);

export function getSubject(id) {
  return STATIC_SUBJECT_MAP[id] ?? null;
}

/**
 * Fetch active subjects from Supabase (with static fallback)
 */
export async function getSubjectsFromDB(includeInactive = false) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return SUBJECTS.map(resolveSubject);

  try {
    let query = supabase
      .from("subjects")
      .select("*")
      .order("order_index", { ascending: true })
      .order("name", { ascending: true });

    if (!includeInactive) {
      query = query.eq("active", true);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return SUBJECTS.map(resolveSubject);
    }

    return data.map(resolveSubject);
  } catch (err) {
    console.error("Erro ao carregar matérias:", err);
    return SUBJECTS.map(resolveSubject);
  }
}

/**
 * Find or create a subject by id/name
 */
export async function findOrCreateSubject({ id, name, emoji, color, tag }) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const cleanId = id
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 50);

  // Check if exists
  const { data: existing } = await supabase
    .from("subjects")
    .select("*")
    .eq("id", cleanId)
    .maybeSingle();

  if (existing) {
    return resolveSubject(existing);
  }

  const preset = COLOR_PRESETS.find((p) => p.color === color) ?? COLOR_PRESETS[1];

  const newSubject = {
    id: cleanId,
    name: name || cleanId,
    emoji: emoji || "📚",
    icon: "BookOpenText",
    color: preset.color,
    hex: preset.hex,
    gradient: preset.gradient,
    soft: preset.soft,
    tag: tag || "Estudo",
    order_index: 99,
    active: true,
  };

  const { data, error } = await supabase
    .from("subjects")
    .insert(newSubject)
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar matéria:", error);
    throw error;
  }

  return resolveSubject(data);
}
