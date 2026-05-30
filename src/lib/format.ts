export function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function scoreFromRun(timeSec: number, mistakes: number, hintsUsed: number): number {
  // Lower = better, but we display higher = better. Convert to a 0–10000 scale.
  const base = Math.max(0, 10000 - timeSec * 5);
  const penalty = mistakes * 80 + hintsUsed * 50;
  return Math.max(0, Math.round(base - penalty));
}
