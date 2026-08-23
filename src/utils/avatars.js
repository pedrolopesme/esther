export const CHILD_AVATARS = [
  { id: "panda", emoji: "🐼", label: "Panda fofinho" },
  { id: "cat", emoji: "🐱", label: "Gatinho" },
  { id: "dog", emoji: "🐶", label: "Cachorrinho" },
  { id: "bunny", emoji: "🐰", label: "Coelhinho" },
  { id: "fox", emoji: "🦊", label: "Raposa" },
  { id: "koala", emoji: "🐨", label: "Coala" },
  { id: "tiger", emoji: "🐯", label: "Tigre" },
  { id: "lion", emoji: "🦁", label: "Leão" },
  { id: "frog", emoji: "🐸", label: "Sapo" },
  { id: "monkey", emoji: "🐵", label: "Macaquinho" },
  { id: "hamster", emoji: "🐹", label: "Hamster" },
  { id: "pig", emoji: "🐷", label: "Porquinho" },
  { id: "cow", emoji: "🐮", label: "Vaquinha" },
  { id: "chick", emoji: "🐥", label: "Pintinho" },
  { id: "penguin", emoji: "🐧", label: "Pinguim" },
  { id: "unicorn", emoji: "🦄", label: "Unicórnio" },
  { id: "bee", emoji: "🐝", label: "Abelhinha" },
  { id: "butterfly", emoji: "🦋", label: "Borboleta" },
  { id: "ladybug", emoji: "🐞", label: "Joaninha" },
  { id: "turtle", emoji: "🐢", label: "Tartaruguinha" },
  { id: "octopus", emoji: "🐙", label: "Polvinho" },
  { id: "whale", emoji: "🐳", label: "Baleia" },
  { id: "rainbow", emoji: "🌈", label: "Arco-íris" },
  { id: "star", emoji: "⭐", label: "Estrelinha" },
];

export const DEFAULT_CHILD_AVATAR = CHILD_AVATARS[0];

export function getChildAvatar(avatarId) {
  return CHILD_AVATARS.find((avatar) => avatar.id === avatarId) || DEFAULT_CHILD_AVATAR;
}

export function getStoredChildAvatar(childId) {
  if (typeof window === "undefined" || !childId) return DEFAULT_CHILD_AVATAR.id;

  try {
    return getChildAvatar(localStorage.getItem(`esther_child_avatar_${childId}`)).id;
  } catch {
    return DEFAULT_CHILD_AVATAR.id;
  }
}

export function persistChildAvatar(childId, avatarId) {
  if (typeof window === "undefined" || !childId) return;

  try {
    localStorage.setItem(`esther_child_avatar_${childId}`, getChildAvatar(avatarId).id);
  } catch {
    // localStorage can be unavailable in private browsing; the in-memory profile still updates.
  }
}
