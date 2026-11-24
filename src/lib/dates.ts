export type UnlockMode = "daily" | "all";

/** The viewer's local date as YYYY-MM-DD. */
export function localToday(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * How many windows are open on a given local date. Mirrors get_shared_calendar in
 * supabase/schema.sql, which is what actually decides for a shared calendar.
 */
export function openCountFor(today: string, mode: UnlockMode): number {
  if (mode === "all") return 25;
  const [, month, day] = today.split("-").map(Number);
  if (month === 12) return Math.min(day, 25);
  if (month <= 6) return 25; // after Christmas, everything stays open
  return 0; // before December
}

/** Timestamp of the next local midnight at which another window opens, or null. */
export function nextUnlockAt(now: Date, mode: UnlockMode): number | null {
  if (mode === "all") return null;
  const month = now.getMonth() + 1;
  const day = now.getDate();
  if (month === 12 && day < 25) {
    return new Date(now.getFullYear(), 11, day + 1).getTime();
  }
  if (month >= 7 && month <= 11) return new Date(now.getFullYear(), 11, 1).getTime();
  return null;
}

export function getCountdown(target: number | null, now: number) {
  if (!target) return null;
  const remaining = Math.max(0, target - now);
  return {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining / 3_600_000) % 24),
    minutes: Math.floor((remaining / 60_000) % 60),
    seconds: Math.floor((remaining / 1_000) % 60),
  };
}
