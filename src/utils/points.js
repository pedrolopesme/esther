"use client";

const STORAGE_KEY = "userPoints";
const EVENT_NAME = "points:update";

export function getPoints() {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const val = parseInt(raw ?? "0", 10);
  return Number.isFinite(val) ? val : 0;
}

export function setPoints(value) {
  if (typeof window === "undefined") return;
  const clamped = Math.max(0, Math.floor(value));
  window.localStorage.setItem(STORAGE_KEY, String(clamped));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: clamped }));
}

export function addPoints(delta) {
  if (typeof window === "undefined") return 0;
  const current = getPoints();
  const next = current + Math.floor(delta);
  setPoints(next);
  return next;
}

export function subPoints(delta) {
  return addPoints(-Math.abs(delta));
}

export const POINTS_EVENT = EVENT_NAME;

