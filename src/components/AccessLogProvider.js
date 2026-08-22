"use client";

/**
 * AccessLogProvider no longer logs raw granular path clicks,
 * as activity is now tracked via structured events ('login', 'exercise_started', 'exercise_completed').
 */
export default function AccessLogProvider() {
  return null;
}
