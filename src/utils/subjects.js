import {
  Calculator,
  BookOpenText,
  Languages,
  Globe2,
  Landmark,
  Microscope,
} from "lucide-react";

/**
 * Central theme registry for every subject.
 * Each subject owns a color identity, a Lucide icon, a sticker emoji and a
 * soft gradient used across the home grid, subject pages and exercise pages.
 *
 * `color` keys map to the Tailwind theme colors defined in globals.css
 * (candy / lilac / sky / mint / sun / coral).
 */
export const SUBJECTS = [
  {
    id: "matematica",
    name: "Matemática",
    emoji: "🔢",
    icon: Calculator,
    color: "candy",
    hex: "#FF70A6",
    gradient: "from-[#FF70A6] to-[#FF9AC5]",
    soft: "from-[#FFE3F0] to-[#FFF0F7]",
    tag: "Números & lógica",
  },
  {
    id: "portugues",
    name: "Português",
    emoji: "📚",
    icon: BookOpenText,
    color: "lilac",
    hex: "#A370FF",
    gradient: "from-[#A370FF] to-[#C4A3FF]",
    soft: "from-[#EEE6FF] to-[#F6F0FF]",
    tag: "Leitura & escrita",
  },
  {
    id: "ingles",
    name: "Inglês",
    emoji: "🇺🇸",
    icon: Languages,
    color: "sky",
    hex: "#4CC9F0",
    gradient: "from-[#4CC9F0] to-[#8BDDF6]",
    soft: "from-[#E1F6FD] to-[#F0FBFE]",
    tag: "Words & grammar",
  },
  {
    id: "geografia",
    name: "Geografia",
    emoji: "🌍",
    icon: Globe2,
    color: "mint",
    hex: "#06D6A0",
    gradient: "from-[#06D6A0] to-[#5FE6C4]",
    soft: "from-[#DBF9F1] to-[#EEFCF8]",
    tag: "Mundo & lugares",
  },
  {
    id: "historia",
    name: "História",
    emoji: "📜",
    icon: Landmark,
    color: "sun",
    hex: "#FFD166",
    gradient: "from-[#FFC13B] to-[#FFDD8A]",
    soft: "from-[#FFF3D6] to-[#FFF9EC]",
    tag: "Tempo & memória",
  },
  {
    id: "ciencias",
    name: "Ciências",
    emoji: "🔬",
    icon: Microscope,
    color: "coral",
    hex: "#FF9770",
    gradient: "from-[#FF9770] to-[#FFB89B]",
    soft: "from-[#FFE9E0] to-[#FFF4EF]",
    tag: "Vida & natureza",
  },
];

const SUBJECT_MAP = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));

export function getSubject(id) {
  return SUBJECT_MAP[id] ?? null;
}
