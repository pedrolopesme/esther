"use client";

import { useAccessLog } from "../hooks/useAccessLog";

/**
 * Client component that logs page visits for authenticated students.
 * Mount once in the layout; it reads the current pathname automatically.
 */
export default function AccessLogProvider() {
  useAccessLog();
  return null;
}
